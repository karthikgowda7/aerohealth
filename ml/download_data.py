"""Download NASA C-MAPSS FD001 into ml/data/raw/.

If every mirror fails, it creates synthetic data in the same format instead
(see generate_synthetic.py) so the rest of the project still works.

Run from the ml/ folder:  python download_data.py
"""
import sys
import urllib.request
from pathlib import Path

RAW_DIR = Path(__file__).parent / "data" / "raw"
FILES = ["train_FD001.txt", "test_FD001.txt", "RUL_FD001.txt"]
# Public GitHub copies of the NASA files (NASA has moved the original link several times).
MIRRORS = [
    "https://raw.githubusercontent.com/hankroark/Turbofan-Engine-Degradation/master/CMAPSSData/",
    "https://raw.githubusercontent.com/LahiruJayasinghe/RUL-Net/master/CMAPSSData/",
    "https://raw.githubusercontent.com/schwxd/LSTM-Keras-CMAPSS/master/C-MAPSS-Data/",
]


def try_mirror(base: str) -> bool:
    """Download all files from one mirror. Returns True only if all look valid."""
    for name in FILES:
        url = base + name
        print(f"  downloading {url}")
        with urllib.request.urlopen(url, timeout=30) as resp:
            text = resp.read().decode("utf-8")
        rows = [line for line in text.splitlines() if line.strip()]
        if name.startswith("train") and len(rows) != 20631:
            raise ValueError(f"unexpected row count {len(rows)} in {name}")
        (RAW_DIR / name).write_text(text)
    return True


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    marker = RAW_DIR / "SYNTHETIC"
    for base in MIRRORS:
        try:
            try_mirror(base)
            if marker.exists():
                marker.unlink()
            print("OK: real NASA C-MAPSS FD001 saved to", RAW_DIR)
            return
        except Exception as exc:  # network error, 404, bad file
            print(f"  mirror failed: {exc}")
    print("All mirrors failed. Generating synthetic data instead.")
    import generate_synthetic
    generate_synthetic.main()


if __name__ == "__main__":
    sys.exit(main())
