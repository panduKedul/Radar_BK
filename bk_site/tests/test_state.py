import os
from bk_site import dataset_store as ds


def test_state_roundtrip():
    ds.save_state({"X": "rujuk"}, {"X": ["A", "B", "C"]})
    try:
        st = ds.load_state()
        assert st == {"status": {"X": "rujuk"}, "sosio": {"X": ["A", "B", "C"]}}
    finally:
        ds.reset_state()
    assert ds.load_state() == {"status": {}, "sosio": {}}


def test_mutasi_tersimpan_ke_disk():
    from bk_site.app import app
    c = app.test_client()
    ids = [s["id"] for s in __import__("bk_site.app", fromlist=["DATA"]).DATA["students"]][:4]
    c.post("/kasus", data={"id": ids[0], "status": "rujuk"})
    c.post("/sosiometri", data={"pemilih": ids[0], "teman": ids[1:4]})
    st = ds.load_state()
    assert st["status"].get(ids[0]) == "rujuk"
    assert st["sosio"].get(ids[0]) == ids[1:4]
    ds.reset_state()
    assert os.path.exists(ds.STATE_FILE)


def test_404_siswa_asing():
    from bk_site.app import app
    r = app.test_client().get("/siswa/TAK-ADA")
    assert r.status_code == 404 and "Tak ketemu" in r.data.decode()


def test_seed_tak_bisa_hapus():
    from bk_site.app import app
    r = app.test_client().post("/data/hapus", data={"file": "Data Kelas 5 lengkap.xlsx"})
    assert r.status_code == 200 and "tak boleh dihapus" in r.data.decode()
    assert os.path.exists(os.path.join(ds.UP, "Data Kelas 5 lengkap.xlsx"))


def test_sosio_tampil_nama():
    from bk_site.app import app
    c = app.test_client()
    ids = [s["id"] for s in __import__("bk_site.app", fromlist=["DATA"]).DATA["students"]][:4]
    c.post("/sosiometri", data={"pemilih": ids[0], "teman": ids[1:4]})
    try:
        t = c.get("/sosiometri").data.decode()
        assert "ALYA ZHAFIRAH" in t
    finally:
        ds.reset_state()
