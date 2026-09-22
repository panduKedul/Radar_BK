"""Rekomendasi BK template — deterministik, tanpa model/LLM."""


def rekomendasi(s, risk):
    kr = s["kelas_rows"].get(s.get("kelas_akhir", "Kelas 5"), {})
    out = []
    if (kr.get("rata") or 100) < 85 or (kr.get("absensi", 100)) < 95 or (kr.get("poin") or 0) > 0 or s.get("tren") == "Turun":
        if risk["badge"] == "Intervensi":
            out.append("Prioritas: panggil siswa minggu ini; bila tak membaik, undang orang tua.")
    if kr.get("absensi", 100) < 95:
        out.append("Konseling individu soal kehadiran; koordinasi wali kelas; bila berlanjut, kunjungan rumah.")
    if (kr.get("rata") or 100) < 85:
        lemah = min((("IPAS", kr.get("ipas")), ("B.Indonesia", kr.get("bind")),
                     ("Matematika", kr.get("mtk"))), key=lambda x: x[1] or 100)[0]
        out.append("Bimbingan belajar mapel terlemah (%s); pantau tugas 2 minggu." % lemah)
    if (kr.get("poin") or 0) > 0:
        out.append("Pembinaan bertahap sesuai tata tertib; catat di buku saku BK.")
    if s.get("tren") == "Turun":
        out.append("Observasi 2 minggu: sandingkan tren nilai dengan kehadiran.")
    if not out:
        out.append("Pertahankan; beri apresiasi agar konsisten.")
    return out
