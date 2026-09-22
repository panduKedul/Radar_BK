from bk_site.data_loader import load_dataset, parse_pct
from bk_site.risk import compute_risk

P = "E:/AI Agent/Riset_22Sep/bk_site/uploads/Data Kelas 5 lengkap.xlsx"


def test_load_24():
    d = load_dataset(P)
    assert len(d["students"]) == 24


def test_parse_pct():
    assert parse_pct("94.8%") == 94.8


def test_risk_aman():
    d = load_dataset(P)
    s = [x for x in d["students"] if x["nama"] == "DIMAS ZABDAN ABRIZAM"][0]
    r = compute_risk(s)
    assert r["badge"] == "Aman" and r["skor"] == 0


def test_risk_pantau_absensi():
    d = load_dataset(P)
    s = [x for x in d["students"] if x["nama"] == "ALYA ZHAFIRAH"][0]
    r = compute_risk(s)
    assert r["skor"] == 40 and r["badge"] == "Pantau"


def test_risk_poin():
    d = load_dataset(P)
    s = [x for x in d["students"] if x["nama"] == "FATHAN ALMAYZA HAMIZAN"][0]
    r = compute_risk(s)
    assert r["skor"] == 20 and r["badge"] == "Aman"
