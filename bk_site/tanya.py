"""Tanya rekomendasi BK — rule-based di atas DATA, tanpa LLM/API.

jawab(q, DATA) -> str. Deterministik, offline, privasi aman (tak ada data keluar).
Gaya: manusiawi, kalimat natural, bukan dump data.
"""

import re

from bk_site.rekom import rekomendasi
from bk_site.risk import compute_risk


def _with_risk(DATA):
    return [(s, compute_risk(s)) for s in DATA["students"]]


def _akhir(DATA):
    return DATA["students"][0].get("kelas_akhir", "Kelas 5") if DATA["students"] else "Kelas 5"


def _kr(s, akhir):
    return s["kelas_rows"].get(s.get("kelas_akhir", akhir), {})


MAPEL = {"ipas": ("IPAS", "ipas"), "ipa": ("IPAS", "ipas"),
         "bind": ("B. Indonesia", "bind"), "indonesia": ("B. Indonesia", "bind"),
         "indo": ("B. Indonesia", "bind"), "mtk": ("Matematika", "mtk"),
         "matematika": ("Matematika", "mtk"), "mipa": None}


def _top_n(ql):
    m = re.search(r"(\d+)", ql)
    n = int(m.group(1)) if m else 3
    return max(1, min(n, 10))


def _find_mapel(ql, strict=False):
    """strict: alias harus kata utuh ('mtk terendah' ya, 'ipanya' bukan)."""
    pad = " %s " % ql
    for alias, info in MAPEL.items():
        if not info:
            continue
        if strict:
            if (" %s " % alias) in pad:
                return info
        elif alias in ql:
            return info
    return None


def _find_student(ql, rows):
    for s, r in rows:
        if s["nama"].lower() in ql or s["id"].lower() == ql:
            return s, r
    return None, None


STOPNAMA = {"nilai", "ipanya", "gimana", "bagaimana", "apakah", "siapa", "yang", "tren",
            "naik", "turun", "absensi", "absen", "mtk", "matematika", "ipas", "ipa", "bind",
            "indonesia", "kelas", "untuk", "rekomendasi", "kah", "memiliki", "dan", "atau",
            "anak", "siswa", "data", "berapa", "tolong", "lihat", "tampilkan", "guru",
            "bantuan", "contoh", "ringkasan", "keseluruhan", "semua", "pantau", "intervensi",
            "rajin", "terendah", "tertinggi", "terbaik", "tanya", "mohon", "coba", "ranking"}


def _level_label(DATA, ql):
    """'kelas 3' → label aktual ('Kelas 3 C'). None bila tak disebut."""
    m = re.search(r"kelas\s*(\d+)", ql)
    if not m or not DATA["students"]:
        return None
    for lab in DATA["students"][0].get("kelas_labels", []):
        if re.search(r"kelas\s*%s\b" % m.group(1), lab, re.I):
            return lab
    return None


def _krl(s, lvl):
    """Baris kelas level tertentu (hormati 'kelas 1'), bukan kelas akhir."""
    return s["kelas_rows"].get(lvl, {})


def _candidate_name(q0):
    """Tebak nama (2-4 kata berhuruf kapital) untuk pesan ups bila tak ketemu di dataset."""
    kata = r"(?:[A-Z][a-z.'-]+|[A-Z]{2,}(?:[.'-][A-Z]+)*)"
    for m in re.finditer(r"(%s(?:\s+%s){1,3})" % (kata, kata), q0):
        words = m.group(1).split()
        if (len(words) >= 2 and all(len(w.strip(".'-")) >= 3 for w in words)
                and all(w.lower() not in STOPNAMA for w in words)):
            return m.group(1).upper()
    return None


CONTOH = ("Yang biasa ditanyakan ke saya:\n"
          "- Kondisi umum: 'ringkasan kelas', 'berapa intervensi'\n"
          "- Kehadiran: 'siapa absensi terendah', 'paling rajin siapa'\n"
          "- Nilai: '3 nilai terendah', 'nilai tertinggi', 'mtk terendah'\n"
          "- Tren: 'siapa trennya naik', 'tren turun siapa saja'\n"
          "- Pelanggaran: 'poin tertinggi siapa'\n"
          "- Per siswa: 'rekomendasi untuk ALYA ZHAFIRAH'")


def jawab(q, DATA):
    q0 = (q or "").strip()
    ql = q0.lower()
    if not ql:
        return "Halo! Tulis pertanyaan dulu ya. " + CONTOH
    if "bantuan" in ql or ql in ("help", "halo", "hai", "pagi", "siang", "sore", "malam"):
        return ("Halo! Saya asisten Radar BK. Saya baca data sekolah lalu jawab langsung — "
                "offline, tanpa AI luar, jadi privasi siswa aman.\n\n" + CONTOH +
                "\n\nSilakan, ada yang bisa saya bantu?")
    rows = _with_risk(DATA)
    akhir = _akhir(DATA)
    rendah = ("rendah" in ql or "terendah" in ql or "paling bawah" in ql or "terburuk" in ql
              or "jelek" in ql or "buruk" in ql)
    tinggi = ("tinggi" in ql or "tertinggi" in ql or "terbaik" in ql or "paling atas" in ql
              or "rajin" in ql or "bagus" in ql or "baik" in ql or "jago" in ql)
    # --- level kelas disebut? "kelas 1" → pakai rata Kelas 1, bukan kelas akhir ---
    lvl = _level_label(DATA, ql) or akhir
    ql_n = re.sub(r"kelas\s*\d+", " ", ql)

    # --- nama siswa didahulukan: "DIMAS ... nilai ipanya gimana?" = soal Dimas ---
    sn, rn = _find_student(ql, rows)
    if sn is not None:
        info = _find_mapel(ql)
        kr = _kr(sn, akhir)
        lvq = _level_label(DATA, ql)
        if lvq and lvq in sn["kelas_rows"]:
            kl = sn["kelas_rows"][lvq]
            saran = ("Bagus, di atas 85 — pertahankan." if (kl.get("rata") or 0) >= 85
                     else "Di bawah 85 — perlu bimbingan + pantau tugas 2 minggu.")
            return ("%s — %s: rata %s (IPAS %s, B. Indonesia %s, Matematika %s), "
                    "absensi %.1f%%, poin %d. %s" % (
                        sn["nama"], lvq, _fmt(kl.get("rata")), _fmt(kl.get("ipas")),
                        _fmt(kl.get("bind")), _fmt(kl.get("mtk")),
                        kl.get("absensi", 0) or 0, kl.get("poin") or 0, saran))
        if info:
            label, key = info
            seri = [v for v in {"ipas": sn.get("ip_k", []), "bind": sn.get("bi_k", []),
                                "mtk": sn.get("mtk_k", [])}.get(key, []) if v is not None]
            cur = kr.get(key)
            labels = sn.get("kelas_labels", [])
            trek = " — ".join("%s: %s" % (l, _fmt(v)) for l, v in zip(labels, seri)) or "-"
            if "tren" in ql or "naik" in ql or "turun" in ql:
                t_all = (sn.get("tren") or "-")
                arah = (seri[-1] >= seri[0]) if len(seri) >= 2 else None
                kata = ("naik" if arah else "turun") if arah is not None else "tak cukup data"
                ok = arah is True
                bukti = ("K1 (%s) → K5 (%s)" % (_fmt(seri[0]), _fmt(seri[-1]))) if len(seri) >= 2 else "-"
                saran = ("Pertahankan, minta jadi tutor sebaya." if ok
                         else "Perlu bimbingan %s + pantau tugas 2 minggu." % label)
                return ("%s. Tren %s %s: %s (%s). Tren keseluruhan: %s. %s" % (
                    "Ya" if ok else "Tidak", sn["nama"], label, kata, bukti, t_all, saran))
            saran = ("Bagus, di atas 85 — pertahankan." if (cur or 0) >= 85
                     else "Di bawah 85 — perlu bimbingan %s + pantau tugas 2 minggu." % label)
            return ("%s — nilai %s: %s. Terakhir (%s): %s. %s" % (
                sn["nama"], label, trek, sn.get("kelas_akhir", akhir), _fmt(cur), saran))
        if "tren" in ql or "naik" in ql or "turun" in ql:
            t_all = (sn.get("tren") or "-")
            ok = t_all.lower() == "naik"
            return ("%s. Tren %s keseluruhan: %s. %s" % (
                "Ya" if ok else "Tidak", sn["nama"], t_all,
                "Pertahankan momentum ini." if ok
                else "Saran: observasi 2 minggu, sandingkan dengan kehadiran."))
        recs = rekomendasi(sn, rn)
        kabar = ("Alhamdulillah aman" if rn["badge"] == "Aman" else "perlu perhatian")
        return ("%s kondisinya %s — badge %s (skor %d). Rata-rata %s, absensi %.1f%%. "
                "Yang saya sarankan:\n- %s" % (
                    sn["nama"], kabar, rn["badge"], rn["skor"],
                    _fmt(kr.get("rata")), kr.get("absensi", 0), "\n- ".join(recs)))

    # --- nama mirip tapi tak di dataset: "ILHAM ... gimana?" di data lain ---
    cand = _candidate_name(q0)
    if cand and not _find_mapel(ql, strict=True):
        return ("Ups, sepertinya %s tidak berada di data/kelas ini. "
                "Mohon pilih data kelas yang sesuai di menu Data, lalu tanya lagi ya." % cand)

    # --- mapel tertentu: "mtk terendah", "ipas tertinggi" (kata utuh; tanpa nama) ---
    info = _find_mapel(ql, strict=True)
    if info and ("nilai" in ql or rendah or tinggi or "ter" in ql):
            label, key = info
            vals = [(s, (_krl(s, lvl).get(key) if _krl(s, lvl).get(key) is not None else -1))
                    for s in DATA["students"]]
            vals = [(s, v) for s, v in vals if v is not None and v >= 0]
            if not vals:
                return "Datanya kosong untuk %s." % label
            n = _top_n(ql_n)
            vals.sort(key=lambda x: x[1], reverse=bool(tinggi and not rendah))
            arah = "tertinggi" if (tinggi and not rendah) else "terendah"
            pick = vals[:n]
            lines = ["%s (%s)" % (s["nama"], _fmt(v)) for s, v in pick]
            s0, v0 = pick[0]
            extra = (" Pertahankan momentum ini." if arah == "tertinggi"
                     else " Saran: bimbingan %s 2 minggu + cek tugas harian." % label)
            sebutm = "" if lvl == akhir else " %s" % lvl
            return ("Untuk %s %s%s: %s. Pemegang %s: %s (%s).%s" % (
                label, arah, sebutm, ", ".join(lines), arah, s0["nama"], _fmt(v0), extra))

    # --- absensi ---
    if "absensi" in ql or "absen" in ql or "hadir" in ql or "rajin" in ql:
        vals = sorted(((s, _krl(s, lvl).get("absensi", 100)) for s in DATA["students"]),
                      key=lambda x: x[1], reverse=bool(tinggi and not rendah))
        if tinggi and not rendah:
            s0, v0 = vals[0]
            return ("Paling rajin%s: %s (%.1f%%). "
                    "Beri apresiasi biar konsisten, jadikan contoh di kelas." % (
                        "" if lvl == akhir else " %s" % lvl, s0["nama"], v0))
        n = _top_n(ql_n)
        pick = vals[:n]
        s0, v0 = pick[0]
        lines = ["%s (%.1f%%)" % (s["nama"], v) for s, v in pick]
        return ("Pemilik absensi terendah: %s (%.1f%%). %s terendah: %s. "
                "Saran saya: ajak ngobrol santai dulu soal kendala kehadiran, "
                "koordinasi wali kelas; kalau berlanjut, kunjungan rumah." % (
                    s0["nama"], v0, n, ", ".join(lines)))

    # --- poin pelanggaran (sebelum nilai: "poin tertinggi" mengandung kata tertinggi) ---
    if "poin" in ql or "langgar" in ql or "nakal" in ql or "tata tertib" in ql:
        vals = sorted(((s, _kr(s, akhir).get("poin") or 0) for s in DATA["students"]),
                      key=lambda x: -x[1])
        top = [(s, v) for s, v in vals if v > 0]
        if not top:
            return "Alhamdulillah, nol pelanggaran tercatat. Iklim kelas sedang sehat — pertahankan."
        n = _top_n(ql)
        pick = top[:n]
        lines = ["%s (%d poin)" % (s["nama"], v) for s, v in pick]
        return ("Poin tertinggi: %s. Total %d siswa punya catatan. "
                "Saran saya: pembinaan bertahap sesuai tata tertib, catat di buku saku BK, "
                "tapi tetap ajak dialog — kadang poin tinggi itu sinyal masalah di rumah." % (
                    ", ".join(lines), len(top)))
    # --- nilai rata-rata terendah/tertinggi (level kelas dihormati: "kelas 1") ---
    if ("nilai" in ql or "rata" in ql or "ranking" in ql or "rangking" in ql
            or "terendah" in ql or "tertinggi" in ql or "bagus" in ql or "jelek" in ql):
        vals = sorted(((s, _krl(s, lvl).get("rata") if _krl(s, lvl).get("rata") is not None else 101)
                       for s in DATA["students"]), key=lambda x: x[1])
        if not vals:
            return "Datanya kosong."
        sebut = "" if lvl == akhir else " %s" % lvl
        m_rank = re.search(r"(?:ranking|rangking|peringkat|juara)\s*(\d+)?", ql)
        if m_rank:
            ordered = sorted(vals, key=lambda x: x[1], reverse=True)
            if m_rank.group(1):
                k = int(m_rank.group(1))
                if k < 1 or k > len(ordered):
                    return "Hanya ada %d siswa, jadi ranking %d tak ada." % (len(ordered), k)
                s, v = ordered[k - 1]
                return ("Ranking %d%s: %s (%s). Beri apresiasi, "
                        "minta jadi tutor sebaya biar menular." % (k, sebut, s["nama"], _fmt(v)))
            n = _top_n(ql_n)
            pick = ordered[:n]
            lines = ["%s (%s)" % (s["nama"], _fmt(v)) for s, v in pick]
            return ("Ranking%s: %s. Beri apresiasi, "
                    "minta mereka jadi tutor sebaya biar menular." % (sebut, ", ".join(lines)))
        if tinggi and not rendah:
            n = _top_n(ql_n)
            pick = list(reversed(vals[-n:]))
            lines = ["%s (%s)" % (s["nama"], _fmt(v)) for s, v in pick]
            return ("Nilai paling bagus%s: %s. Beri apresiasi, "
                    "minta mereka jadi tutor sebaya biar menular." % (sebut, ", ".join(lines)))
        n = _top_n(ql_n)
        pick = vals[:n]
        lines = []
        for s, v in pick:
            kr = _krl(s, lvl)
            lemah = min((("IPAS", kr.get("ipas")), ("B. Indonesia", kr.get("bind")),
                         ("Matematika", kr.get("mtk"))), key=lambda x: x[1] if x[1] is not None else 101)[0]
            lines.append("%s (rata %s, lemah di %s)" % (s["nama"], _fmt(v), lemah))
        return ("%d nilai terendah%s: %s. Fokus bimbingan ke mapel terlemah masing-masing, "
                "pantau tugas 2 minggu, dan cek apakah absensinya juga rendah." % (n, sebut, "; ".join(lines)))

    mod = "rendah" in ql or "jelek" in ql or "buruk" in ql or "bawah" in ql
    mod_hi = "tinggi" in ql or "bagus" in ql or "baik" in ql or "jago" in ql or "atas" in ql
    if "intervensi" in ql:
        hit = [(s, r) for s, r in rows if r["badge"] == "Intervensi"]
        if not hit:
            return "Kabar baik — tak ada siswa badge Intervensi saat ini. Pertahankan pemantauan rutin."
        if (mod or mod_hi) and "siapa" in ql or "paling" in ql:
            pick = (min(hit, key=lambda x: x[1]["skor"]) if (mod and not mod_hi)
                    else max(hit, key=lambda x: x[1]["skor"]))
            s, r = pick
            return ("Intervensi paling %s: %s (skor %d, karena %s). %s" % (
                "rendah" if (mod and not mod_hi) else "tinggi", s["nama"], r["skor"],
                r["alasan"][0] if r["alasan"] else "-",
                "Tetap pantau, tapi dahulukan yang skornya lebih tinggi." if (mod and not mod_hi)
                else "Ini prioritas utama minggu ini; panggil dan bila perlu undang orang tua."))
        hit.sort(key=lambda x: -x[1]["skor"])
        lines = ["%s (skor %d, karena %s)" % (s["nama"], r["skor"], r["alasan"][0] if r["alasan"] else "-")
                 for s, r in hit]
        return ("Ada %d siswa butuh perhatian segera: %s. "
                "Saran saya: panggil minggu ini satu per satu; "
                "kalau belum membaik, undang orang tua." % (len(hit), "; ".join(lines)))
    if "pantau" in ql:
        hit = [(s, r) for s, r in rows if r["badge"] == "Pantau"]
        if not hit:
            return "Tak ada siswa badge Pantau. Semua relatif aman."
        if (mod or mod_hi) and "siapa" in ql or "paling" in ql:
            pick = (min(hit, key=lambda x: x[1]["skor"]) if (mod and not mod_hi)
                    else max(hit, key=lambda x: x[1]["skor"]))
            s, r = pick
            return ("Pantau paling %s: %s (skor %d, karena %s). Cek berkala 2 minggu sekali cukup." % (
                "rendah" if (mod and not mod_hi) else "tinggi", s["nama"], r["skor"],
                r["alasan"][0] if r["alasan"] else "-"))
        return ("Perlu dipantau (%d siswa): %s. Cek berkala 2 minggu sekali cukup." % (
            len(hit), ", ".join(s["nama"] for s, _ in hit)))
    if "aman" in ql:
        hit = [s for s, r in rows if r["badge"] == "Aman"]
        if not hit:
            return "Tak ada siswa badge Aman saat ini."
        return ("Aman ada %d siswa, contoh: %s. Beri apresiasi biar konsisten." % (
            len(hit), ", ".join(s["nama"] for s in hit[:5])))
    if "turun" in ql or "tren" in ql or "naik" in ql:
        mau_naik = "naik" in ql and "turun" not in ql
        target = "Naik" if mau_naik else "Turun"
        hit = [s for s, _ in rows if (s.get("tren") or "") == target]
        if not hit:
            return "Tak ada siswa dengan tren %s. %s" % (
                target, "Bagus!" if target == "Turun" else "Cek lagi datanya.")
        if mau_naik:
            return ("Tren naik ada %d siswa: %s. Kabar baik — beri apresiasi biar menular ke yang lain." % (
                len(hit), ", ".join(s["nama"] for s in hit)))
        return ("Trennya turun ada %d siswa: %s. Coba sandingkan dengan absensi mereka — "
                "biasanya dua ini jalan bareng." % (len(hit), ", ".join(s["nama"] for s in hit)))
    if "berapa" in ql or "jumlah" in ql or "ringkas" in ql or "keseluruhan" in ql or "semua" in ql:
        from collections import Counter
        c = Counter(r["badge"] for _, r in rows)
        return ("Dari %d siswa: %d Intervensi, %d Pantau, %d Aman. %s" % (
            len(rows), c.get("Intervensi", 0), c.get("Pantau", 0), c.get("Aman", 0),
            "Fokus minggu ini ke yang Intervensi dulu." if c.get("Intervensi", 0) else
            "Kondisi kelas sehat, tinggal jaga yang Pantau."))
    if "rata-rata kelas" in ql or "rata2 kelas" in ql or "rata kelas" in ql:
        vals = [_kr(s, akhir).get("rata") for s in DATA["students"]]
        vals = [v for v in vals if v is not None]
        avg = sum(vals) / len(vals) if vals else 0
        return ("Rata-rata kelas: %.2f dari %d siswa. %s" % (
            avg, len(vals),
            "Bagus, di atas 85." if avg >= 85 else
            "Di bawah 85 — perlu penguatan belajar kolektif, mungkin remedial massal mapel terlemah."))
    return ("Hmm, saya kurang paham maksudnya. Saya cuma bisa jawab dari data radar — "
            "soal nilai, absensi, tren, dan saran BK. " + CONTOH)


def _fmt(v):
    if v is None:
        return "-"
    return ("%g" % v) if isinstance(v, float) else str(v)
