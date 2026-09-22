"""Radar BK Kelas 5 — Flask lokal."""
import os
from flask import Flask, abort, redirect, render_template, request, send_file, url_for

from bk_site.data_loader import load_dataset
from bk_site.risk import compute_risk
from bk_site import dataset_store as ds
from bk_site import tanya as tq
from bk_site.paths import FROZEN, UPLOADS, ensure_uploads, resource_path

DEFAULT = ensure_uploads()
SEED = "Data Kelas 5 lengkap.xlsx"

app = Flask(__name__, template_folder=resource_path(os.path.join("bk_site", "templates")),
            static_folder=resource_path(os.path.join("bk_site", "static")))
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
try:
    DATA = ds.load_active(DEFAULT)
except Exception:
    DATA = load_dataset(DEFAULT)
_STATE = ds.load_state()
STATUS = _STATE["status"]
SOSIO = _STATE["sosio"]
CHOICES = ["observasi", "dipanggil", "orangtua", "rujuk"]


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
def radar():
    return render_template("radar.html", rows=with_risk())


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


@app.get("/siswa/<path:sid>")
def siswa(sid):
    from bk_site.rekom import rekomendasi
    if sid not in DATA["by_id"]:
        abort(404)
    s = DATA["by_id"][sid]
    risk = compute_risk(s)
    return render_template("siswa.html", s=s, risk=risk, rekom=rekomendasi(s, risk),
                           labels=s["kelas_labels"])


@app.get("/tren")
def tren():
    labels = DATA["students"][0]["kelas_labels"] if DATA["students"] else []
    return render_template("tren.html", rows=DATA["students"], labels=labels)


@app.get("/kasus")
def kasus():
    rows = with_risk()
    for r in rows:
        r["status"] = STATUS.get(r["id"], "observasi")
    return render_template("kasus.html", rows=rows, choices=CHOICES)


@app.post("/kasus")
def kasus_set():
    sid = request.form.get("id", "")
    st = request.form.get("status", "")
    if sid in DATA["by_id"] and st in CHOICES:
        STATUS[sid] = st
        ds.save_state(STATUS, SOSIO)
    return redirect(url_for("kasus"))


@app.get("/sosiometri")
def sosio():
    from collections import Counter
    c = Counter(x for v in SOSIO.values() for x in v)
    all_ids = [s["id"] for s in DATA["students"]]
    names = {s["id"]: s["nama"] for s in DATA["students"]}
    sel = request.args.get("pemilih", all_ids[0] if all_ids else "")
    return render_template("sosiometri.html", students=DATA["students"],
                           top=c.most_common(5), names=names,
                           terisol=[i for i in all_ids if i not in c],
                           err=request.args.get("err"), submitted=SOSIO, sel=sel)


@app.post("/sosiometri")
def sosio_add():
    teman = request.form.getlist("teman")[:3]
    pemilih = request.form.get("pemilih")
    if (pemilih and len(teman) == 3 and pemilih not in teman
            and len(set(teman)) == 3):
        SOSIO[pemilih] = teman
        ds.save_state(STATUS, SOSIO)
        return redirect(url_for("sosio", pemilih=pemilih))
    return redirect(url_for("sosio", err="pemilih-tak-boleh-sama"))


TANYA = []


@app.get("/tanya")
def tanya():
    return render_template("tanya.html", riwayat=TANYA[-20:])


@app.post("/tanya")
def tanya_ask():
    q = (request.form.get("q", "") or "").strip()[:300]
    if q:
        TANYA.append({"q": q, "a": tq.jawab(q, DATA)})
        del TANYA[:-20]
    return redirect(url_for("tanya"))


@app.post("/tanya/reset")
def tanya_reset():
    TANYA.clear()
    return redirect(url_for("tanya"))


@app.get("/data")
def data():
    import os
    cur = ds.active_path(DEFAULT)
    return render_template("data.html", files=ds.list_datasets(),
                           active=os.path.basename(cur), errors=[])


@app.post("/data")
def data_upload():
    import os
    from werkzeug.utils import secure_filename
    f = request.files.get("file")
    raw = os.path.basename((f.filename if f else "") or "")
    if not f or not raw.endswith(".xlsx"):
        return render_template("data.html", files=ds.list_datasets(),
                               active=os.path.basename(ds.active_path(DEFAULT)),
                               errors=["Pilih file .xlsx dulu."])
    fn = raw
    path = os.path.join(ds.UP, fn)
    f.save(path)
    errs = ds.validate_xlsx(path)
    if errs:
        os.remove(path)
        return render_template("data.html", files=ds.list_datasets(),
                               active=os.path.basename(ds.active_path(DEFAULT)),
                               errors=errs)
    global DATA
    DATA = load_dataset(ds.set_active(fn))
    STATUS.clear()
    SOSIO.clear()
    ds.reset_state()
    return redirect(url_for("data"))


@app.post("/data/aktifkan")
def data_activate():
    global DATA
    try:
        DATA = load_dataset(ds.set_active(request.form.get("file", "")))
    except (ValueError, KeyError) as e:
        import os as _os
        return render_template("data.html", files=ds.list_datasets(),
                               active=_os.path.basename(ds.active_path(DEFAULT)),
                               errors=[str(e)])
    STATUS.clear()
    SOSIO.clear()
    ds.reset_state()
    return redirect(url_for("data"))


@app.post("/data/hapus")
def data_delete():
    import os as _os
    base = _os.path.basename(request.form.get("file", ""))
    aktive = _os.path.basename(ds.active_path(DEFAULT))
    files = ds.list_datasets()
    if base == SEED:
        return render_template("data.html", files=files, active=aktive,
                               errors=["Dataset bawaan tak boleh dihapus."])
    if base == aktive:
        return render_template("data.html", files=files, active=aktive,
                               errors=["Aktifkan dataset lain dulu sebelum hapus '%s'." % base])
    p = _os.path.join(ds.UP, base)
    if not base.endswith(".xlsx") or not _os.path.exists(p):
        return render_template("data.html", files=files, active=aktive,
                               errors=["File tak ketemu."])
    _os.remove(p)
    return redirect(url_for("data"))


@app.get("/template")
def template():
    import io
    import openpyxl
    w = openpyxl.Workbook()
    s1 = w.active
    s1.title = "Dataset_Format_Website"
    s1.append(ds.REQUIRED1)
    s1.append(["CONTOH-ID", "Nama Contoh", "Kelas 5", 90, 90, 90, "95%", 90, 0])
    s2 = w.create_sheet("Rekap_Per_Mapel_K1_sd_K5")
    s2.append(["No", "ID Siswa", "Nama Siswa", "IPAS K1", "IPAS K2", "IPAS K3",
               "IPAS K4", "IPAS K5 (Asli)", "B.Ind K1", "B.Ind K2", "B.Ind K3",
               "B.Ind K4", "B.Ind K5 (Asli)", "MTK K1", "MTK K2", "MTK K3",
               "MTK K4", "MTK K5 (Asli)", "Rata-rata K5 (Asli)", "Tren Akhir"])
    buf = io.BytesIO()
    w.save(buf)
    buf.seek(0)
    return send_file(buf, as_attachment=True, download_name="template_dataset.xlsx")


if __name__ == "__main__":
    import argparse
    _p = argparse.ArgumentParser(description="Radar BK — Flask lokal + tunnel sidang")
    _p.add_argument("--host", default="127.0.0.1")
    _p.add_argument("--port", type=int, default=5000)
    _p.add_argument("--public-url", default="")
    _a = _p.parse_args()
    if _a.public_url:
        print("PUBLIC_URL=%s" % _a.public_url, flush=True)
    if FROZEN:
        import webbrowser
        webbrowser.open("http://%s:%d/" % (_a.host, _a.port))
        app.run(host=_a.host, port=_a.port, debug=False, use_reloader=False)
    else:
        app.run(host=_a.host, port=_a.port, debug=True)
