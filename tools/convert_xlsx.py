"""Konversi xlsx -> students.json sekali (seed statis)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bk_site.data_loader import load_dataset

SRC = ROOT / "Data Kelas 5 lengkap.xlsx"
DST = ROOT / "radar-bk-react" / "src" / "data" / "students.json"

def main():
    data = load_dataset(str(SRC))
    students = data["students"]
    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_text(json.dumps(students, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(students)} siswa -> {DST}")

if __name__ == "__main__":
    main()
