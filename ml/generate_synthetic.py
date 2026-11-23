"""Fallback: create synthetic turbofan data in the exact C-MAPSS FD001 file format.

Only used if the real NASA files cannot be downloaded. It writes a file called
SYNTHETIC next to the data so train.py records the dataset honestly.

Run from the ml/ folder:  python generate_synthetic.py
"""
from pathlib import Path

import numpy as np

RAW_DIR = Path(__file__).parent / "data" / "raw"

# Healthy mean value of each of the 21 sensors (close to real FD001 values).
BASE = np.array([518.67, 642.5, 1590.5, 1408.9, 14.62, 21.61, 553.4, 2388.1, 9065.2, 1.3,
                 47.5, 521.4, 2388.1, 8143.8, 8.44, 0.03, 393.2, 2388.0, 100.0, 38.8, 23.29])
# How much each sensor drifts by the time the engine fails (0 = constant sensor).
DRIFT = np.array([0, 1.5, 12.0, 18.0, 0, 0, -2.5, 0.12, 25.0, 0,
                  0.9, -2.2, 0.12, 15.0, 0.08, 0, 3.5, 0, 0, -0.6, -0.35])
NOISE = np.array([0, 0.5, 6.0, 9.0, 0, 0, 0.9, 0.07, 22.0, 0,
                  0.27, 0.74, 0.07, 19.0, 0.037, 0, 1.5, 0, 0, 0.18, 0.11])


def engine_rows(unit: int, life: int, rng: np.random.Generator) -> np.ndarray:
    """All cycles of one engine from new to failure. Degradation grows exponentially."""
    cycles = np.arange(1, life + 1)
    wear = (np.exp(3 * cycles / life) - 1) / (np.exp(3) - 1)  # 0 at start, 1 at failure
    sensors = BASE + np.outer(wear, DRIFT) + rng.normal(0, 1, (life, 21)) * NOISE
    ops = np.column_stack([rng.normal(0, 0.002, life), rng.normal(0, 0.0003, life), np.full(life, 100.0)])
    return np.column_stack([np.full(life, unit), cycles, ops, sensors])


def write_txt(path: Path, data: np.ndarray) -> None:
    lines = [" ".join([str(int(r[0])), str(int(r[1]))] + [f"{v:.4f}" for v in r[2:]]) for r in data]
    path.write_text("\n".join(lines) + "\n")


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)
    train = [engine_rows(u, int(rng.integers(130, 361)), rng) for u in range(1, 101)]
    test, rul = [], []
    for u in range(1, 101):
        life = int(rng.integers(130, 361))
        full = engine_rows(u, life, rng)
        cut = int(rng.integers(30, life - 5))  # stop the engine before it fails
        test.append(full[:cut])
        rul.append(life - cut)
    write_txt(RAW_DIR / "train_FD001.txt", np.vstack(train))
    write_txt(RAW_DIR / "test_FD001.txt", np.vstack(test))
    (RAW_DIR / "RUL_FD001.txt").write_text("\n".join(str(r) for r in rul) + "\n")
    (RAW_DIR / "SYNTHETIC").write_text("synthetic data modelled on C-MAPSS FD001\n")
    print("OK: synthetic data written to", RAW_DIR)


if __name__ == "__main__":
    main()
