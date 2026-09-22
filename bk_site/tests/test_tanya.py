import sys
sys.path.insert(0, "E:/AI Agent/Riset_22Sep")

from bk_site.app import app
from bk_site.data_loader import load_dataset
from bk_site.tanya import jawab

P = "E:/AI Agent/Riset_22Sep/bk_site/uploads/Data Kelas 5 lengkap.xlsx"
DATA = load_dataset(P)


def test_bantuan():
    a = jawab("bantuan", DATA)
    assert "absensi terendah" in a


def test_intervensi():
    a = jawab("siapa intervensi", DATA)
    assert "perhatian segera" in a or "Intervensi" in a


def test_nama_siswa():
    s = DATA["students"][0]
    a = jawab("rekomendasi untuk " + s["nama"], DATA)
    assert s["nama"] in a and "sarankan" in a


def test_unknown():
    a = jawab("xyz tak jelas", DATA)
    assert "kurang paham" in a


def test_absensi_terendah():
    a = jawab("absensi terendah siapa", DATA)
    assert "absensi terendah" in a and "Saran saya" in a


def test_nilai_terendah_n():
    a = jawab("3 nilai terendah", DATA)
    assert "nilai terendah" in a


def test_mapel():
    a = jawab("mtk terendah", DATA)
    assert "Matematika" in a


def test_siswa_mapel():
    a = jawab("DIMAS ZABDAN ABRIZAM nilai ipanya gimana?", DATA)
    assert "DIMAS ZABDAN ABRIZAM" in a and "IPAS" in a and "Terakhir" in a


def test_siswa_tren():
    a = jawab("apakah nilai MTK ILHAM ALFARIZQI memiliki tren naik?", DATA)
    assert "ILHAM ALFARIZQI" in a and a.startswith(("Ya.", "Tidak."))


def test_kelas_level_bagus():
    a = jawab("nilai kelas 1 yang paling bagus siapa?", DATA)
    assert "paling bagus" in a and "Kelas 1" in a and "terendah" not in a


def test_badge_superlatif():
    a = jawab("siapa intervensi paling rendah", DATA)
    assert "Intervensi paling rendah" in a and "butuh perhatian segera" not in a
    b = jawab("intervensi paling tinggi siapa", DATA)
    assert "Intervensi paling tinggi" in b
    c = jawab("siapa yang aman", DATA)
    assert "Aman ada" in c


def test_ranking():
    a = jawab("siapa anak ranking 1 dikelas 2?", DATA)
    assert "Ranking" in a and "Kelas 2" in a and "terendah" not in a
    b = jawab("ranking 3 siapa", DATA)
    assert "Ranking 3" in b
    c = jawab("siapa ranking 7", DATA)
    assert "Ranking 7" in c and c.count("(") == 1


def test_siswa_level():
    a = jawab("MUHAMMAD RAFKA WIBOWO nilai kelas 2 nya bagaimana?", DATA)
    assert "MUHAMMAD RAFKA WIBOWO" in a and "Kelas 2" in a and "badge" not in a


def test_nama_tak_ada():
    mini = {"students": [{"id": "1", "nama": "BUDI SANTOSO",
             "kelas_rows": {"Kelas 5": {"absensi": 99, "rata": 90, "poin": 0,
                                        "ipas": 90, "bind": 90, "mtk": 90}},
             "kelas_akhir": "Kelas 5", "kelas_labels": ["Kelas 5"],
             "ip_k": [90], "bi_k": [90], "mtk_k": [90], "tren": "Naik"}]}
    a = jawab("ILHAM ALFARIZQI nilainya gimana?", mini)
    assert "ILHAM ALFARIZQI" in a and "tidak berada di data/kelas ini" in a


def test_no_dict_leak():
    for q in ("siapa absensi terendah", "3 nilai terendah", "poin tertinggi",
              "siapa intervensi", "tren turun"):
        assert "kelas_rows" not in jawab(q, DATA)


def test_poin():
    a = jawab("poin tertinggi siapa", DATA)
    assert "Poin tertinggi" in a


def test_tren_naik():
    a = jawab("siapa yang trennya naik", DATA)
    assert "Tren naik" in a and "turun ada" not in a


def test_reset():
    c = app.test_client()
    c.post("/tanya", data={"q": "bantuan"})
    assert "bubble q" in c.get("/tanya").get_data(as_text=True)
    assert c.post("/tanya/reset").status_code == 302
    assert "bubble q" not in c.get("/tanya").get_data(as_text=True)


def test_route():
    c = app.test_client()
    assert c.get("/tanya").status_code == 200
    r = c.post("/tanya", data={"q": "bantuan"})
    assert r.status_code == 302
    assert "absensi terendah" in c.get("/tanya").get_data(as_text=True)
