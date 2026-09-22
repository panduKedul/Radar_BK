# Website Radar BK Kelas 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun Flask lokal 7 route + skor risiko + upload dataset untuk 24 siswa Kelas 5.

**Architecture:** Monolit Flask; `data_loader.py` baca 2 sheet via openpyxl; `risk.py` skor murni fungsi; `dataset_store.py` kelola uploads/ + aktif; template Jinja + Chart.js CDN; status/sosiometri dict memori.

**Tech Stack:** Python 3.10, Flask 3.x, openpyxl (ada), pytest, Chart.js CDN.

**Spec:** `docs/superpowers/specs/2026-09-15-website-bk-radar-design.md`

## Global Constraints
- Lokal saja, tanpa deploy, tanpa DB, tanpa API LLM, tanpa isi curhat konseling.
- Dataset default `Riset_22Sep/Data Kelas 5 lengkap.xlsx`; salin ke `bk_site/uploads/` saat setup.
- Skor: absensi<95 → +40; rata<85 → +30; poin>0 → +20; tren Turun → +10. Badge 0-20 Aman, 21-50 Pantau, 51+ Intervensi + alasan.
- Upload max 5MB, hanya .xlsx, secure_filename, pesan error sebut kolom kurang.
- Tanpa repo git di workspace → langkah "Commit" diganti "Tandai todo selesai".

---

### Task 1: Fondasi + data_loader + risk + uji

**Files:**
- Create: `E:\AI Agent\bk_site\requirements.txt`
- Create: `E:\AI Agent\bk_site\data_loader.py`
- Create: `E:\AI Agent\bk_site\risk.py`
- Create: `E:\AI Agent\bk_site\uploads\.gitkeep-hapus` (catatan: buat folder `uploads/` + salin dataset default ke `uploads/Data Kelas 5 lengkap.xlsx`)
- Test: `E:\AI Agent\bk_site\tests\test_risk.py`

**Interfaces:**
- Consumes: file xlsx dataset (2 sheet).
- Produces: `load_dataset(path) -> {"students": [...], "by_id": {...}}`; tiap student dict: `id,nama,kelas_rows,rata_k5,absensi_k5(float),poin_k5,tren,ip_k (list 5),bi_k,mtk_k`; `compute_risk(s) -> {"skor": int, "badge": str, "alasan": [str]}`; `parse_pct("94.8%") -> 94.8`.

- [ ] **Step 1: Install dep**

Run: `pip install flask pytest`
Expected: PASS, `python -c "import flask, pytest"` sukses.

- [ ] **Step 2: Tulis requirements + data_loader + risk**

`requirements.txt`:
```
flask
openpyxl
pytest
```

`data_loader.py` (inti):
```python
import openpyxl
def parse_pct(v):
    if v is None: return 0.0
    if isinstance(v, (int, float)): return float(v)
    return float(str(v).replace("%", "").strip() or 0)
def load_dataset(path):
    w = openpyxl.load_workbook(path, read_only=True, data_only=True)
    s = w["Dataset_Format_Website"]
    rows = list(s.iter_rows(values_only=True))[1:]
    by_id = {}
    for r in rows:
        sid, nama, kelas = r[0], r[1], r[2]
        by_id.setdefault(sid, {"id": sid, "nama": nama, "kelas_rows": {}})
        by_id[sid]["kelas_rows"][kelas] = {"ipas": r[3], "bind": r[4], "mtk": r[5],
            "absensi": parse_pct(r[6]), "rata": r[7], "poin": r[8] or 0}
    s2 = w["Rekap_Per_Mapel_K1_sd_K5"]
    for r in list(s2.iter_rows(values_only=True))[1:]:
        sid = r[1]
        if sid in by_id:
            by_id[sid].update({"ip_k": list(r[3:8]), "bi_k": list(r[8:13]),
                "mtk_k": list(r[13:18]), "rata_k5": r[18], "tren": r[19]})
    return {"students": list(by_id.values()), "by_id": by_id}
```

`risk.py`:
```python
def compute_risk(s):
    kr = s["kelas_rows"].get("Kelas 5", {})
    skor, alasan = 0, []
    if kr.get("absensi", 100) < 95: skor += 40; alasan.append("Absensi %.1f%% < 95" % kr["absensi"])
    if (kr.get("rata") or 100) < 85: skor += 30; alasan.append("Rata %.1f < 85" % kr["rata"])
    if (kr.get("poin") or 0) > 0: skor += 20; alasan.append("Poin pelanggaran %d" % kr["poin"])
    if s.get("tren") == "Turun": skor += 10; alasan.append("Tren akhir Turun")
    badge = "Aman" if skor <= 20 else ("Pantau" if skor <= 50 else "Intervensi")
    return {"skor": skor, "badge": badge, "alasan": alasan or ["Semua indikator baik"]}
```

- [ ] **Step 3: Tulis test**

`tests/test_risk.py`:
```python
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
    s = [x for x in d["students"] if x["nama"] == "ALYA ZHAFIRAH"][0]
    r = compute_risk(s)
    assert r["badge"] == "Aman" and r["skor"] == 0
def test_risk_poin():
    d = load_dataset(P)
    s = [x for x in d["students"] if x["nama"] == "FATHAN ALMAYZA HAMIZAN"][0]
    r = compute_risk(s)
    assert r["skor"] == 20 and r["badge"] == "Aman"
```
Catatan: FATHAN K5 absensi 98.4, rata 97.68, poin 5, tren? verifikasi saat run — bila badge meleset, betulkan angka ekspektasi sesuai data aktual, bukan kode.

- [ ] **Step 4: Run test**

Run: `pytest E:\AI Agent\bk_site\tests\test_risk.py -v` (dari `E:\AI Agent`, tambah `__init__.py` kosong di `bk_site/` bila import gagal)
Expected: PASS 4/4.

- [ ] **Step 5: Tandai todo selesai**

### Task 2: App + landing/radar/siswa/tren

**Files:**
- Create: `E:\AI Agent\bk_site\app.py`
- Create: `E:\AI Agent\bk_site\templates\base.html`
- Create: `E:\AI Agent\bk_site\templates\index.html`
- Create: `E:\AI Agent\bk_site\templates\radar.html`
- Create: `E:\AI Agent\bk_site\templates\siswa.html`
- Create: `E:\AI Agent\bk_site\templates\tren.html`
- Create: `E:\AI Agent\bk_site\static\style.css`

**Interfaces:**
- Consumes: `load_dataset`, `compute_risk` dari Task 1.
- Produces: route `/`, `/radar`, `/siswa/<id>`, `/tren`; app baca dataset sekali saat start (`DATA = load_dataset(DEFAULT)`).

- [ ] **Step 1: Tulis app.py (4 route)**

```python
from flask import Flask, render_template
from bk_site.data_loader import load_dataset
from bk_site.risk import compute_risk
DEFAULT = "E:/AI Agent/Riset_22Sep/bk_site/uploads/Data Kelas 5 lengkap.xlsx"
app = Flask(__name__)
DATA = load_dataset(DEFAULT)
def with_risk():
    out = []
    for s in DATA["students"]:
        out.append({**s, "risk": compute_risk(s)})
    return sorted(out, key=lambda x: -x["risk"]["skor"])
@app.get("/") 
def index():
    rows = with_risk()
    n_int = sum(1 for r in rows if r["risk"]["badge"] == "Intervensi")
    return render_template("index.html", n=len(rows), n_int=n_int)
@app.get("/radar")
def radar(): return render_template("radar.html", rows=with_risk())
@app.get("/siswa/<path:sid>")
def siswa(sid):
    s = DATA["by_id"][sid]
    return render_template("siswa.html", s=s, risk=compute_risk(s))
@app.get("/tren")
def tren(): return render_template("tren.html", rows=DATA["students"])
if __name__ == "__main__": app.run(debug=True)
```

- [ ] **Step 2: Tulis 5 template + css** (base navigasi 6 link; index 6 kartu; radar tabel + badge warna + alasan; siswa grafik garis Chart.js ip_k/bi_k/mtk_k K1-K5; tren 3 grafik; css badge `.aman/.pantau/.intervensi` hijau/kuning/merah)

- [ ] **Step 3: Run server, cek manual**

Run: `python E:\AI Agent\bk_site\app.py`, buka `http://127.0.0.1:5000/`, `/radar` (24 baris), `/siswa/<id ALYA>`, `/tren`.
Expected: PASS semua render, badge muncul.

- [ ] **Step 4: Tandai todo selesai**

### Task 3: Kasus + sosiometri (memori sesi)

**Files:**
- Modify: `E:\AI Agent\bk_site\app.py` (tambah dict + 4 route)
- Create: `E:\AI Agent\bk_site\templates\kasus.html`
- Create: `E:\AI Agent\bk_site\templates\sosiometri.html`

**Interfaces:**
- Consumes: `DATA`, `with_risk()` Task 2.
- Produces: `STATUS = {}` default "observasi"; `SOSIO = []` list pilihan; route `/kasus` GET+POST, `/sosiometri` GET+POST. Label UI: "sementara (hilang saat restart)".

- [ ] **Step 1: Tambah kode kasus/sosiometri**

```python
from flask import request, redirect, url_for
STATUS = {}
SOSIO = []
CHOICES = ["observasi", "dipanggil", "orangtua", "rujuk"]
@app.get("/kasus")
def kasus():
    rows = with_risk()
    for r in rows: r["status"] = STATUS.get(r["id"], "observasi")
    return render_template("kasus.html", rows=rows, choices=CHOICES)
@app.post("/kasus")
def kasus_set():
    sid = request.form["id"]
    if request.form["status"] in CHOICES: STATUS[sid] = request.form["status"]
    return redirect(url_for("kasus"))
@app.get("/sosiometri")
def sosio():
    from collections import Counter
    c = Counter(x for v in SOSIO for x in v["teman"])
    all_ids = [s["id"] for s in DATA["students"]]
    return render_template("sosiometri.html", students=DATA["students"], top=c.most_common(5),
        terisol=[i for i in all_ids if i not in c])
@app.post("/sosiometri")
def sosio_add():
    teman = request.form.getlist("teman")[:3]
    if request.form.get("pemilih") and len(teman) == 3:
        SOSIO.append({"pemilih": request.form["pemilih"], "teman": teman})
    return redirect(url_for("sosio"))
```

- [ ] **Step 2: Tulis 2 template** (kasus: tabel + select POST per baris; sosio: form pemilih + 3 select teman + hasil top/terisolasi)

- [ ] **Step 3: Verifikasi manual** (ubah 1 status → tampil; submit 1 sosiometri → agregat berubah; restart → kembali awal sesuai label)

- [ ] **Step 4: Tandai todo selesai**

### Task 4: /data upload + template + verifikasi akhir

**Files:**
- Create: `E:\AI Agent\bk_site\dataset_store.py`
- Modify: `E:\AI Agent\bk_site\app.py` (route `/data` GET+POST, `/template`, ganti DATA global + `set_active`)
- Create: `E:\AI Agent\bk_site\templates\data.html`

**Interfaces:**
- Consumes: `load_dataset` Task 1.
- Produces: `REQUIRED1 = [...]` (9 kolom), `REQUIRED2 = [...]` (4 kolom); `validate_xlsx(path) -> [errors]`; `list_datasets()`, `set_active(path)` reload DATA+STATUS reset; route `/data`, `/template` (bangun xlsx header via openpyxl, kirim file).

- [ ] **Step 1: Tulis dataset_store + route**

```python
import os
from werkzeug.utils import secure_filename
from bk_site.data_loader import load_dataset
UP = "E:/AI Agent/Riset_22Sep/bk_site/uploads"
REQUIRED1 = ["id","nama","kelas","nilai_ipas","nilai_bind","nilai_mtk","absensi harian","rata_nilai","poin_pelanggaran"]
REQUIRED2 = ["ID Siswa","Nama Siswa","Rata-rata K5 (Asli)","Tren Akhir"]
def validate_xlsx(path):
    import openpyxl
    errs = []
    try: w = openpyxl.load_workbook(path, read_only=True, data_only=True)
    except Exception as e: return ["File tak terbaca sebagai xlsx: %s" % e]
    for sh in ["Dataset_Format_Website", "Rekap_Per_Mapel_K1_sd_K5"]:
        if sh not in w.sheetnames: errs.append("Sheet '%s' hilang" % sh); continue
        head = [(c or "") for c in next(w[sh].iter_rows(values_only=True))]
        need = REQUIRED1 if sh == "Dataset_Format_Website" else REQUIRED2
        miss = [c for c in need if c not in head]
        if miss: errs.append("Sheet '%s' kurang kolom: %s" % (sh, ", ".join(miss)))
    return errs
```

Route `/data` POST: cek ekstensi `.xlsx`, size ≤5MB (`request.content_length`), secure_filename, simpan, `validate_xlsx`, bila error hapus + tampil error, bila lolos `set_active` (reload DATA global, reset STATUS/SOSIO). `/template`: bangun workbook 2 sheet header + 1 contoh baris, `send_file`.

- [ ] **Step 2: Tulis template data.html** (form upload, error list, tombol template, daftar file + aktif)

- [ ] **Step 3: Uji upload** (file salah kolom → ditolak + pesan kolom; salinan dataset asli nama lain → diterima + jadi aktif + radar tetap 24 baris)

- [ ] **Step 4: Verifikasi akhir semua route** (`/`, `/radar`, `/siswa/<id>`, `/tren`, `/kasus`, `/sosiometri`, `/data`, `/template`) + `pytest` Task 1 hijau.

- [ ] **Step 5: Tandai todo selesai**
