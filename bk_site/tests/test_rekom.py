import sys
sys.path.insert(0, "E:/AI Agent/Riset_22Sep")
from bk_site.data_loader import load_dataset
from bk_site.risk import compute_risk
from bk_site.rekom import rekomendasi

P = "E:/AI Agent/Riset_22Sep/bk_site/uploads/Data Kelas 5 lengkap.xlsx"


def test_rekom_intervensi_prioritas():
    d = load_dataset(P)
    s = [x for x in d["students"] if compute_risk(x)["badge"] == "Intervensi"]
    assert s, "harus ada contoh Intervensi"
    rec = rekomendasi(s[0], compute_risk(s[0]))
    assert rec[0].startswith("Prioritas")


def test_rekom_aman_apresiasi():
    d = load_dataset(P)
    s = [x for x in d["students"] if x["nama"] == "DIMAS ZABDAN ABRIZAM"][0]
    rec = rekomendasi(s, compute_risk(s))
    assert rec == ["Pertahankan; beri apresiasi agar konsisten."]


def test_rekom_sebut_mapel():
    s = {"kelas_rows": {"Kelas 5": {"rata": 80, "absensi": 99,
           "poin": 0, "ipas": 78, "bind": 82, "mtk": 80}}, "tren": "Naik"}
    rec = rekomendasi(s, compute_risk(s))
    assert any("Bimbingan belajar" in r and "IPAS" in r for r in rec)
