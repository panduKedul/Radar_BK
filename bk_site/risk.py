"""Skor risiko rule-based transparan (0-100)."""


def compute_risk(s):
    kr = s["kelas_rows"].get(s.get("kelas_akhir", "Kelas 5"), {})
    skor, alasan = 0, []
    if kr.get("absensi", 100) < 95:
        skor += 40
        alasan.append("Absensi %.1f%% < 95" % kr["absensi"])
    if (kr.get("rata") or 100) < 85:
        skor += 30
        alasan.append("Rata %.1f < 85" % kr["rata"])
    if (kr.get("poin") or 0) > 0:
        skor += 20
        alasan.append("Poin pelanggaran %d" % kr["poin"])
    if str(s.get("tren") or "").strip().lower() == "turun":
        skor += 10
        alasan.append("Tren akhir Turun")
    badge = "Aman" if skor <= 20 else ("Pantau" if skor <= 50 else "Intervensi")
    return {"skor": skor, "badge": badge, "alasan": alasan or ["Semua indikator baik"]}
