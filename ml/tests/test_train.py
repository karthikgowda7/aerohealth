"""Run from the ml/ folder:  python -m pytest -q"""
import math
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from train import add_rolling_features, add_rul_labels, add_true_rul_for_test, nasa_score, rmse  # noqa: E402

SENSORS = ["s2", "s3", "s4", "s7", "s8", "s9", "s11", "s12", "s13", "s14", "s15", "s17", "s20", "s21"]


def make_df(unit: int, cycles: int) -> pd.DataFrame:
    df = pd.DataFrame({"unit": unit, "cycle": range(1, cycles + 1)})
    for s in SENSORS:
        df[s] = df["cycle"] * 1.0
    return df


def test_rul_counts_down_to_zero():
    df = add_rul_labels(make_df(1, 5))
    assert df["rul"].tolist() == [4, 3, 2, 1, 0]


def test_rul_is_capped():
    df = add_rul_labels(make_df(1, 200), cap=125)
    assert df["rul"].max() == 125
    assert df["rul"].iloc[-1] == 0


def test_rul_is_per_engine():
    df = add_rul_labels(pd.concat([make_df(1, 3), make_df(2, 5)]))
    assert df[df.unit == 1]["rul"].tolist() == [2, 1, 0]
    assert df[df.unit == 2]["rul"].iloc[0] == 4


def test_true_rul_for_test_set():
    df = add_true_rul_for_test(make_df(1, 3), pd.Series({1: 10}))
    assert df["true_rul"].tolist() == [12, 11, 10]


def test_rolling_mean_uses_only_past_cycles():
    df = add_rolling_features(make_df(1, 3), window=2)
    assert df["s2_mean"].tolist() == [1.0, 1.5, 2.5]
    assert df["s2_std"].iloc[0] == 0  # first cycle has no spread


def test_rmse():
    assert rmse([0, 0], [3, 4]) == math.sqrt(12.5)
    assert rmse([5, 5], [5, 5]) == 0


def test_nasa_score_punishes_late_more_than_early():
    late = nasa_score([50], [60])   # predicted 10 cycles too many
    early = nasa_score([50], [40])  # predicted 10 cycles too few
    assert math.isclose(late, math.e - 1)
    assert math.isclose(early, math.exp(10 / 13) - 1)
    assert late > early
