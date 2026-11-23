"""AeroHealth ML pipeline: train an RUL model on C-MAPSS FD001 and export predictions.

Steps: load files -> label RUL (capped at 125) -> rolling features ->
train Linear Regression (baseline) and Random Forest -> evaluate -> export.

Run from the ml/ folder:  python train.py
Outputs (written to ml/outputs/ AND copied to web/prisma/data/):
  fleet.csv   one row per test engine cycle: unit, cycle, 14 sensors, predicted_rul, true_rul
  model.json  metrics for all models + feature importances
"""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

ML_DIR = Path(__file__).parent
RAW_DIR = ML_DIR / "data" / "raw"
OUT_DIR = ML_DIR / "outputs"
WEB_DATA_DIR = ML_DIR.parent / "web" / "prisma" / "data"

COLUMNS = ["unit", "cycle", "op1", "op2", "op3"] + [f"s{i}" for i in range(1, 22)]
# The 7 other sensors are constant in FD001, so they carry no information.
SENSORS = ["s2", "s3", "s4", "s7", "s8", "s9", "s11", "s12", "s13", "s14", "s15", "s17", "s20", "s21"]
RUL_CAP = 125   # early in life an engine looks "healthy", so we cap the target
WINDOW = 10     # rolling window in cycles
MODEL_VERSION = "rf-v1"


def load_cmapss(path: Path) -> pd.DataFrame:
    """Read a C-MAPSS txt file (space separated, no header, trailing spaces)."""
    df = pd.read_csv(path, sep=r"\s+", header=None)
    df = df.iloc[:, : len(COLUMNS)]
    df.columns = COLUMNS
    return df[["unit", "cycle"] + SENSORS]


def add_rul_labels(df: pd.DataFrame, cap: int = RUL_CAP) -> pd.DataFrame:
    """Train label: cycles left until this engine's last cycle, capped at `cap`."""
    out = df.copy()
    max_cycle = out.groupby("unit")["cycle"].transform("max")
    out["rul"] = (max_cycle - out["cycle"]).clip(upper=cap)
    return out


def add_true_rul_for_test(df: pd.DataFrame, rul_at_end: pd.Series) -> pd.DataFrame:
    """Test label for every cycle: RUL at the last cycle + cycles until that last cycle."""
    out = df.copy()
    last_cycle = out.groupby("unit")["cycle"].transform("max")
    end_rul = out["unit"].map(rul_at_end)
    out["true_rul"] = end_rul + (last_cycle - out["cycle"])
    return out


def add_rolling_features(df: pd.DataFrame, window: int = WINDOW) -> pd.DataFrame:
    """Rolling mean and std of each sensor, per engine, using only past cycles."""
    out = df.sort_values(["unit", "cycle"]).copy()
    grouped = out.groupby("unit")[SENSORS]
    means = grouped.rolling(window, min_periods=1).mean().reset_index(level=0, drop=True)
    stds = grouped.rolling(window, min_periods=1).std().reset_index(level=0, drop=True).fillna(0)
    for s in SENSORS:
        out[f"{s}_mean"] = means[s]
        out[f"{s}_std"] = stds[s]
    return out


def feature_columns() -> list[str]:
    return ["cycle"] + SENSORS + [f"{s}_mean" for s in SENSORS] + [f"{s}_std" for s in SENSORS]


def rmse(y_true, y_pred) -> float:
    y_true, y_pred = np.asarray(y_true, float), np.asarray(y_pred, float)
    return float(np.sqrt(np.mean((y_pred - y_true) ** 2)))


def nasa_score(y_true, y_pred) -> float:
    """PHM08 score. d = pred - true. Late predictions (d > 0) are punished more."""
    d = np.asarray(y_pred, float) - np.asarray(y_true, float)
    return float(np.sum(np.where(d < 0, np.exp(-d / 13) - 1, np.exp(d / 10) - 1)))


def main() -> None:
    synthetic = (RAW_DIR / "SYNTHETIC").exists()
    dataset = "Synthetic data modelled on C-MAPSS FD001" if synthetic else "NASA C-MAPSS FD001"
    print(f"Dataset: {dataset}")

    train = add_rolling_features(add_rul_labels(load_cmapss(RAW_DIR / "train_FD001.txt")))
    test_raw = load_cmapss(RAW_DIR / "test_FD001.txt")
    rul_end = pd.read_csv(RAW_DIR / "RUL_FD001.txt", header=None).iloc[:, 0]
    rul_end.index = range(1, len(rul_end) + 1)  # unit numbers start at 1
    test = add_rolling_features(add_true_rul_for_test(test_raw, rul_end))
    # Score against the capped truth, the same way the model was trained.
    test["true_rul_capped"] = test["true_rul"].clip(upper=RUL_CAP)

    X_cols = feature_columns()
    X_train, y_train = train[X_cols], train["rul"]

    lr = LinearRegression().fit(X_train, y_train)
    rf = RandomForestRegressor(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    # Standard C-MAPSS evaluation: one prediction per test engine, at its last cycle.
    last = test.groupby("unit").tail(1)
    y_last = last["true_rul_capped"]
    preds = {
        "Mean baseline": np.full(len(last), y_train.mean()),
        "Linear Regression": np.clip(lr.predict(last[X_cols]), 0, None),
        "Random Forest": np.clip(rf.predict(last[X_cols]), 0, None),
    }
    results = {name: {"rmse": round(rmse(y_last, p), 2), "nasa_score": round(nasa_score(y_last, p), 1)}
               for name, p in preds.items()}

    print(f"\n{'Model':<20}{'RMSE':>8}{'NASA score':>14}")
    for name, r in results.items():
        print(f"{name:<20}{r['rmse']:>8.2f}{r['nasa_score']:>14.1f}")

    # Export RF predictions for EVERY test cycle (used for charts in the app).
    test["predicted_rul"] = np.clip(rf.predict(test[X_cols]), 0, None).round(1)
    fleet = test[["unit", "cycle"] + SENSORS + ["predicted_rul", "true_rul"]]

    importances = sorted(zip(X_cols, rf.feature_importances_), key=lambda x: -x[1])[:10]
    model_info = {
        "version": MODEL_VERSION,
        "algorithm": "RandomForestRegressor (200 trees, max_depth 15)",
        "dataset": dataset,
        "rulCap": RUL_CAP,
        "window": WINDOW,
        "features": X_cols,
        "rmse": results["Random Forest"]["rmse"],
        "nasaScore": results["Random Forest"]["nasa_score"],
        "lrRmse": results["Linear Regression"]["rmse"],
        "lrNasaScore": results["Linear Regression"]["nasa_score"],
        "meanRmse": results["Mean baseline"]["rmse"],
        "importances": [{"feature": f, "importance": round(float(v), 4)} for f, v in importances],
        "trainedAt": datetime.now(timezone.utc).isoformat(),
    }

    OUT_DIR.mkdir(exist_ok=True)
    fleet.to_csv(OUT_DIR / "fleet.csv", index=False)
    (OUT_DIR / "model.json").write_text(json.dumps(model_info, indent=2))
    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for name in ["fleet.csv", "model.json"]:
        shutil.copy(OUT_DIR / name, WEB_DATA_DIR / name)
    print(f"\nWrote {len(fleet)} rows to outputs/fleet.csv and copied files to {WEB_DATA_DIR}")
    print("Top 5 features:", ", ".join(f for f, _ in importances[:5]))


if __name__ == "__main__":
    main()
