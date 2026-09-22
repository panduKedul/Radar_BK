/** Rekomendasi prospek studi rule-based dari profil nilai. */
const RUMPUN = {
  ipas: 'Saintek & Kesehatan',
  bind: 'Hukum, Komunikasi & Pendidikan',
  mtk: 'Teknik, Informatika & Ekonomi',
}

export function rumpunTerkuat(s, akhir) {
  const kr = (s.kelas_rows || {})[s.kelas_akhir || akhir] || {}
  const cands = [
    ['ipas', kr.ipas],
    ['bind', kr.bind],
    ['mtk', kr.mtk],
  ].sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1))
  return { key: cands[0][0], rumpun: RUMPUN[cands[0][0]], nilai: cands[0][1] }
}

export function rekomendasiProspek(s, risk, akhir) {
  const kr = (s.kelas_rows || {})[s.kelas_akhir || akhir] || {}
  const rata = kr.rata ?? 0
  const kuat = rumpunTerkuat(s, akhir)
  const jalur = []
  const alasan = []
  if (rata >= 90 && risk.badge === 'Aman') {
    jalur.push('internasional', 'lokal')
    alasan.push(`Rata ${rata} + Aman → layakk kejar beasiswa LN & PTN top.`)
  } else if (rata >= 85) {
    jalur.push('lokal', 'kedinasan')
    alasan.push(`Rata ${rata} → PTN + kedinasan realistis.`)
    if (risk.badge === 'Aman') {
      jalur.push('internasional')
      alasan.push('Profil bersih → mulai siapkan bahasa Inggris untuk beasiswa.')
    }
  } else {
    jalur.push('vokasi', 'lokal')
    alasan.push(`Rata ${rata} < 85 → vokasi/PTS + bimbingan dulu, kejar praktik.`)
  }
  if ((kr.poin ?? 0) > 0) {
    alasan.push('Catatan: poin pelanggaran aktif — kedinasan/Akpol butuh disiplin bersih, bereskan dulu.')
  }
  if (s.tren === 'Turun') {
    alasan.push('Tren turun — stabilkan nilai sebelum daftar seleksi ketat.')
  }
  return { jalur: [...new Set(jalur)], rumpun: kuat.rumpun, mapelKuat: kuat.key, alasan }
}
