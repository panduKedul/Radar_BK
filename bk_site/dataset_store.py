"""Kelola dataset aktif + validasi upload."""
import os

from werkzeug.utils import secure_filename

from bk_site.data_loader import load_dataset
from bk_site.paths import UPLOADS

UP = UPLOADS
REQUIRED1 = ["id", "nama", "kelas", "nilai_ipas", "nilai_bind", "nilai_mtk",
             "absensi harian", "rata_nilai", "poin_pelanggaran"]
REQUIRED2 = ["ID Siswa", "Nama Siswa", "Rata-rata K5 (Asli)", "Tren Akhir"]
ACTIVE_FILE = os.path.join(UP, ".aktif")
STATE_FILE = os.path.join(UP, "state.json")


def load_state():
    import json
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            st = json.load(f)
        return {"status": st.get("status", {}), "sosio": st.get("sosio", {})}
    except (OSError, ValueError):
        return {"status": {}, "sosio": {}}


def save_state(status, sosio):
    import json
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({"status": status, "sosio": sosio}, f)
    os.replace(tmp, STATE_FILE)


def reset_state():
    save_state({}, {})


def validate_xlsx(path):
    import openpyxl
    from bk_site.data_loader import detect_sheets, norm, REQUIRED1, REQUIRED2
    errs = []
    try:
        w = openpyxl.load_workbook(path, read_only=True, data_only=True)
    except Exception as e:
        return ["File tak terbaca sebagai xlsx: %s" % e]
    try:
        found = detect_sheets(w)
        if "utama" not in found:
            errs.append("Bagian data nilai tak ketemu (butuh kolom: id, nama, kelas, nilai_ipas, nilai_bind, nilai_mtk, absensi harian, rata_nilai, poin_pelanggaran). Unduh template.")
        if "rekap" not in found:
            errs.append("Bagian rekap tak ketemu (butuh kolom: ID Siswa, Nama Siswa; opsional: Rata-rata K5 (Asli), Tren Akhir — tren dihitung otomatis bila kosong). Unduh template.")
        if not errs:
            try:
                load_dataset(path)
            except Exception as e:
                errs.append("Isi tak terbaca: %s" % e)
    finally:
        w.close()
    return errs


def list_datasets():
    return sorted(f for f in os.listdir(UP) if f.endswith(".xlsx"))


def active_path(default):
    try:
        with open(ACTIVE_FILE, encoding="utf-8") as f:
            p = os.path.join(UP, f.read().strip())
        if os.path.exists(p):
            return p
    except OSError:
        pass
    return default


def set_active(filename):
    base = os.path.basename(filename or "")
    if not base.endswith(".xlsx") or base in (".", ".."):
        raise ValueError("Nama file tak valid.")
    if not os.path.exists(os.path.join(UP, base)):
        raise ValueError("File '%s' tak ada di uploads." % base)
    with open(ACTIVE_FILE, "w", encoding="utf-8") as f:
        f.write(base)
    return os.path.join(UP, base)


def load_active(default):
    return load_dataset(active_path(default))
