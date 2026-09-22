"""Path portabel: dev vs exe PyInstaller."""
import os
import shutil
import sys

FROZEN = getattr(sys, "frozen", False)


def resource_path(rel):
    base = getattr(sys, "_MEIPASS", None) or os.path.dirname(
        os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, rel)


def base_dir():
    if FROZEN:
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


BASE = base_dir()
if FROZEN:
    UPLOADS = os.path.join(os.path.dirname(BASE), "uploads")
else:
    UPLOADS = os.path.join(BASE, "bk_site", "uploads")
SEED_NAME = "Data Kelas 5 lengkap.xlsx"


def ensure_uploads():
    os.makedirs(UPLOADS, exist_ok=True)
    if FROZEN:
        legacy = os.path.join(BASE, "uploads")
        if os.path.isdir(legacy):
            for f in os.listdir(legacy):
                src, dst = os.path.join(legacy, f), os.path.join(UPLOADS, f)
                if f.endswith(".xlsx") and not os.path.exists(dst):
                    shutil.copy(src, dst)
    dst = os.path.join(UPLOADS, SEED_NAME)
    if not os.path.exists(dst):
        for cand in (resource_path(os.path.join("bk_site", "uploads", SEED_NAME)),
                     resource_path(SEED_NAME)):
            if os.path.exists(cand):
                shutil.copy(cand, dst)
                break
    return os.path.join(UPLOADS, SEED_NAME)
