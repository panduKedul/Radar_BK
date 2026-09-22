import { computeRisk } from './risk.js'
import { rekomendasi } from './rekom.js'

function _withRisk(DATA) {
  return (DATA.students || []).map((s) => [s, computeRisk(s)])
}

function _akhir(DATA) {
  return DATA.students && DATA.students.length
    ? DATA.students[0].kelas_akhir || 'Kelas 5'
    : 'Kelas 5'
}

function _kr(s, akhir) {
  return (s.kelas_rows || {})[s.kelas_akhir || akhir] || {}
}

const MAPEL = {
  ipas: ['IPAS', 'ipas'],
  ipa: ['IPAS', 'ipas'],
  bind: ['B. Indonesia', 'bind'],
  indonesia: ['B. Indonesia', 'bind'],
  indo: ['B. Indonesia', 'bind'],
  mtk: ['Matematika', 'mtk'],
  matematika: ['Matematika', 'mtk'],
  mipa: null,
}

function _topN(ql) {
  const m = ql.match(/(\d+)/)
  const n = m ? parseInt(m[1], 10) : 3
  return Math.max(1, Math.min(n, 10))
}

function _findMapel(ql, strict = false) {
  const pad = ' ' + ql + ' '
  for (const [alias, info] of Object.entries(MAPEL)) {
    if (!info) continue
    if (strict) {
      if (pad.includes(' ' + alias + ' ')) return info
    } else if (ql.includes(alias)) return info
  }
  return null
}

function _findStudent(ql, rows) {
  for (const [s, r] of rows) {
    if (ql.includes(String(s.nama).toLowerCase()) || String(s.id).toLowerCase() === ql) return [s, r]
  }
  return [null, null]
}

const STOPNAMA = new Set([
  'nilai', 'ipanya', 'gimana', 'bagaimana', 'apakah', 'siapa', 'yang', 'tren',
  'naik', 'turun', 'absensi', 'absen', 'mtk', 'matematika', 'ipas', 'ipa', 'bind',
  'indonesia', 'kelas', 'untuk', 'rekomendasi', 'kah', 'memiliki', 'dan', 'atau',
  'anak', 'siswa', 'data', 'berapa', 'tolong', 'lihat', 'tampilkan', 'guru',
  'bantuan', 'contoh', 'ringkasan', 'keseluruhan', 'semua', 'pantau', 'intervensi',
  'rajin', 'terendah', 'tertinggi', 'terbaik', 'tanya', 'mohon', 'coba', 'ranking', 'semester',
])

function _levelLabel(DATA, ql) {
  const m = ql.match(/(?:kelas|semester)\s*(\d+)/)
  if (!m || !DATA.students || !DATA.students.length) return null
  for (const lab of DATA.students[0].kelas_labels || []) {
    if (new RegExp('kelas\\s*' + m[1] + '\\b', 'i').test(lab)) return lab
  }
  return null
}

function _krl(s, lvl) {
  return (s.kelas_rows || {})[lvl] || {}
}

function _candidateName(q0) {
  const kata = "(?:[A-Z][a-z.'-]+|[A-Z]{2,}(?:[.'-][A-Z]+)*)"
  const re = new RegExp('(' + kata + '(?:\\s+' + kata + '){1,3})', 'g')
  let m
  while ((m = re.exec(q0)) !== null) {
    const words = m[1].split(/\s+/)
    if (
      words.length >= 2 &&
      words.every((w) => w.replace(/[.:\-']/g, '').length >= 3) &&
      words.every((w) => !STOPNAMA.has(w.toLowerCase()))
    ) return m[1].toUpperCase()
  }
  return null
}

function sem(label) {
  return String(label ?? '').replace(/^Kelas/, 'Semester')
}

export const CONTOH =
  'Yang biasa ditanyakan ke saya:\n' +
  "- Kondisi umum: 'ringkasan semester', 'berapa intervensi'\n" +
  "- Kehadiran: 'siapa absensi terendah', 'paling rajin siapa'\n" +
  "- Nilai: '3 nilai terendah', 'nilai tertinggi', 'mtk terendah'\n" +
  "- Tren: 'siapa trennya naik', 'tren turun siapa saja'\n" +
  "- Pelanggaran: 'poin tertinggi siapa'\n" +
  "- Per siswa: 'rekomendasi untuk ALYA ZHAFIRAH'"

export function jawab(q, DATA) {
  const q0 = String(q || '').trim().slice(0, 300)
  const ql = q0.toLowerCase()
  if (!ql) return 'Halo! Tulis pertanyaan dulu ya. ' + CONTOH
  if (
    ql.includes('bantuan') ||
    ['help', 'halo', 'hai', 'pagi', 'siang', 'sore', 'malam'].includes(ql)
  ) {
    return (
      'Halo! Saya asisten Radar BK. Saya baca data sekolah lalu jawab langsung — ' +
      'offline, tanpa AI luar, jadi privasi siswa aman.\n\n' +
      CONTOH +
      '\n\nSilakan, ada yang bisa saya bantu?'
    )
  }
  const rows = _withRisk(DATA)
  const akhir = _akhir(DATA)
  const rendah =
    ql.includes('rendah') || ql.includes('terendah') || ql.includes('paling bawah') ||
    ql.includes('terburuk') || ql.includes('jelek') || ql.includes('buruk')
  const tinggi =
    ql.includes('tinggi') || ql.includes('tertinggi') || ql.includes('terbaik') ||
    ql.includes('paling atas') || ql.includes('rajin') || ql.includes('bagus') ||
    ql.includes('baik') || ql.includes('jago')
  const lvl = _levelLabel(DATA, ql) || akhir
  const ql_n = ql.replace(/(?:kelas|semester)\s*\d+/g, ' ')

  // --- nama siswa didahulukan ---
  const [sn, rn] = _findStudent(ql, rows)
  if (sn != null) {
    const info = _findMapel(ql)
    const kr = _kr(sn, akhir)
    const lvq = _levelLabel(DATA, ql)
    if (lvq && sn.kelas_rows && sn.kelas_rows[lvq]) {
      const kl = sn.kelas_rows[lvq]
      const saran =
        (kl.rata || 0) >= 85
          ? 'Bagus, di atas 85 — pertahankan.'
          : 'Di bawah 85 — perlu bimbingan + pantau tugas 2 minggu.'
      return (
        sn.nama + ' — ' + sem(lvq) + ': rata ' + _fmt(kl.rata) +
        ' (IPAS ' + _fmt(kl.ipas) + ', B. Indonesia ' + _fmt(kl.bind) +
        ', Matematika ' + _fmt(kl.mtk) + '), absensi ' +
        Number(kl.absensi || 0).toFixed(1) + '%, poin ' + (kl.poin || 0) + '. ' + saran
      )
    }
    if (info) {
      const [label, key] = info
      const seriesMap = { ipas: sn.ip_k || [], bind: sn.bi_k || [], mtk: sn.mtk_k || [] }
      const seri = (seriesMap[key] || []).filter((v) => v != null)
      const cur = kr[key]
      const labels = sn.kelas_labels || []
      const trek = seri.map((v, i) => (labels[i] || '') + ': ' + _fmt(v)).join(' — ') || '-'
      if (ql.includes('tren') || ql.includes('naik') || ql.includes('turun')) {
        const t_all = sn.tren || '-'
        const arah = seri.length >= 2 ? seri[seri.length - 1] >= seri[0] : null
        const kata = arah == null ? 'tak cukup data' : arah ? 'naik' : 'turun'
        const ok = arah === true
        const bukti = seri.length >= 2 ? 'K1 (' + _fmt(seri[0]) + ') → K5 (' + _fmt(seri[seri.length - 1]) + ')' : '-'
        const saran = ok
          ? 'Pertahankan, minta jadi tutor sebaya.'
          : 'Perlu bimbingan ' + label + ' + pantau tugas 2 minggu.'
        return (ok ? 'Ya' : 'Tidak') + '. Tren ' + sn.nama + ' ' + label + ': ' + kata +
          ' (' + bukti + '). Tren keseluruhan: ' + t_all + '. ' + saran
      }
      const saran =
        (cur || 0) >= 85
          ? 'Bagus, di atas 85 — pertahankan.'
          : 'Di bawah 85 — perlu bimbingan ' + label + ' + pantau tugas 2 minggu.'
      return sn.nama + ' — nilai ' + label + ': ' + trek + '. Terakhir (' +
        (sem(sn.kelas_akhir) || sem(akhir)) + '): ' + _fmt(cur) + '. ' + saran
    }
    if (ql.includes('tren') || ql.includes('naik') || ql.includes('turun')) {
      const t_all = sn.tren || '-'
      const ok = String(t_all).toLowerCase() === 'naik'
      return (ok ? 'Ya' : 'Tidak') + '. Tren ' + sn.nama + ' keseluruhan: ' + t_all + '. ' +
        (ok ? 'Pertahankan momentum ini.' : 'Saran: observasi 2 minggu, sandingkan dengan kehadiran.')
    }
    const recs = rekomendasi(sn, rn)
    const kabar = rn.badge === 'Aman' ? 'Alhamdulillah aman' : 'perlu perhatian'
    return sn.nama + ' kondisinya ' + kabar + ' — badge ' + rn.badge + ' (skor ' + rn.skor +
      '). Rata-rata ' + _fmt(kr.rata) + ', absensi ' + Number(kr.absensi || 0).toFixed(1) +
      '%. Yang saya sarankan:\n- ' + recs.join('\n- ')
  }

  // --- nama mirip tapi tak di dataset ---
  const cand = _candidateName(q0)
  if (cand && !_findMapel(ql, true)) {
      return 'Ups, sepertinya ' + cand + ' tidak berada di data/semester ini. ' +
        'Mohon pilih data semester yang sesuai di menu Data, lalu tanya lagi ya.'
  }

  // --- mapel tertentu (kata utuh; tanpa nama) ---
  const infoS = _findMapel(ql, true)
  if (infoS && (ql.includes('nilai') || rendah || tinggi || ql.includes('ter'))) {
    const [label, key] = infoS
    let vals = (DATA.students || []).map((s) => {
      const v = _krl(s, lvl)[key]
      return [s, v != null ? v : -1]
    })
    vals = vals.filter(([, v]) => v != null && v >= 0)
    if (!vals.length) return 'Datanya kosong untuk ' + label + '.'
    const n = _topN(ql_n)
    vals.sort((a, b) => (tinggi && !rendah ? b[1] - a[1] : a[1] - b[1]))
    const arah = tinggi && !rendah ? 'tertinggi' : 'terendah'
    const pick = vals.slice(0, n)
    const lines = pick.map(([s, v]) => s.nama + ' (' + _fmt(v) + ')')
    const [s0, v0] = pick[0]
    const extra =
      arah === 'tertinggi'
        ? ' Pertahankan momentum ini.'
        : ' Saran: bimbingan ' + label + ' 2 minggu + cek tugas harian.'
    const sebutm = lvl === akhir ? '' : ' ' + lvl
    return 'Untuk ' + label + ' ' + arah + sebutm + ': ' + lines.join(', ') +
      '. Pemegang ' + arah + ': ' + s0.nama + ' (' + _fmt(v0) + ').' + extra
  }

  // --- absensi ---
  if (ql.includes('absensi') || ql.includes('absen') || ql.includes('hadir') || ql.includes('rajin')) {
    const vals = (DATA.students || [])
      .map((s) => [s, _krl(s, lvl).absensi ?? 100])
      .sort((a, b) => (tinggi && !rendah ? b[1] - a[1] : a[1] - b[1]))
    if (tinggi && !rendah) {
      const [s0, v0] = vals[0]
      return 'Paling rajin' + (lvl === akhir ? '' : ' ' + lvl) + ': ' + s0.nama +
        ' (' + Number(v0).toFixed(1) + '%). Beri apresiasi biar konsisten, jadikan contoh di semester.'
    }
    const n = _topN(ql_n)
    const pick = vals.slice(0, n)
    const [s0, v0] = pick[0]
    const lines = pick.map(([s, v]) => s.nama + ' (' + Number(v).toFixed(1) + '%)')
    return 'Pemilik absensi terendah: ' + s0.nama + ' (' + Number(v0).toFixed(1) + '%). ' +
      n + ' terendah: ' + lines.join(', ') +
      '. Saran saya: ajak ngobrol santai dulu soal kendala kehadiran, ' +
      'koordinasi wali kelas; kalau berlanjut, kunjungan rumah.'
  }

  // --- poin pelanggaran (sebelum nilai) ---
  if (ql.includes('poin') || ql.includes('langgar') || ql.includes('nakal') || ql.includes('tata tertib')) {
    const vals = (DATA.students || [])
      .map((s) => [s, _kr(s, akhir).poin || 0])
      .sort((a, b) => b[1] - a[1])
    const top = vals.filter(([, v]) => v > 0)
    if (!top.length) {
      return 'Alhamdulillah, nol pelanggaran tercatat. Iklim semester sedang sehat — pertahankan.'
    }
    const n = _topN(ql)
    const pick = top.slice(0, n)
    const lines = pick.map(([s, v]) => s.nama + ' (' + v + ' poin)')
    return 'Poin tertinggi: ' + lines.join(', ') + '. Total ' + top.length +
      ' siswa punya catatan. Saran saya: pembinaan bertahap sesuai tata tertib, ' +
      'catat di buku saku BK, tapi tetap ajak dialog — kadang poin tinggi itu sinyal masalah di rumah.'
  }

  // --- nilai rata-rata terendah/tertinggi ---
  if (
    ql.includes('nilai') || ql.includes('rata') || ql.includes('ranking') ||
    ql.includes('rangking') || ql.includes('terendah') || ql.includes('tertinggi') ||
    ql.includes('bagus') || ql.includes('jelek')
  ) {
    const vals = (DATA.students || [])
      .map((s) => {
        const v = _krl(s, lvl).rata
        return [s, v != null ? v : 101]
      })
      .sort((a, b) => a[1] - b[1])
    if (!vals.length) return 'Datanya kosong.'
    const sebut = lvl === akhir ? '' : ' ' + sem(lvl)
    const m_rank = ql.match(/(?:ranking|rangking|peringkat|juara)\s*(\d+)?/)
    if (m_rank) {
      const ordered = [...vals].sort((a, b) => b[1] - a[1])
      if (m_rank[1]) {
        const k = parseInt(m_rank[1], 10)
        if (k < 1 || k > ordered.length) {
          return 'Hanya ada ' + ordered.length + ' siswa, jadi ranking ' + k + ' tak ada.'
        }
        const [s, v] = ordered[k - 1]
        return 'Ranking ' + k + sebut + ': ' + s.nama + ' (' + _fmt(v) +
          '). Beri apresiasi, minta jadi tutor sebaya biar menular.'
      }
      const n = _topN(ql_n)
      const pick = ordered.slice(0, n)
      const lines = pick.map(([s, v]) => s.nama + ' (' + _fmt(v) + ')')
      return 'Ranking' + sebut + ': ' + lines.join(', ') +
        '. Beri apresiasi, minta mereka jadi tutor sebaya biar menular.'
    }
    if (tinggi && !rendah) {
      const n = _topN(ql_n)
      const pick = vals.slice(-n).reverse()
      const lines = pick.map(([s, v]) => s.nama + ' (' + _fmt(v) + ')')
      return 'Nilai paling bagus' + sebut + ': ' + lines.join(', ') +
        '. Beri apresiasi, minta mereka jadi tutor sebaya biar menular.'
    }
    const n = _topN(ql_n)
    const pick = vals.slice(0, n)
    const lines = pick.map(([s, v]) => {
      const kr = _krl(s, lvl)
      const lemah = [
        ['IPAS', kr.ipas],
        ['B. Indonesia', kr.bind],
        ['Matematika', kr.mtk],
      ].reduce((a, b) => ((b[1] ?? 101) < (a[1] ?? 101) ? b : a))[0]
      return s.nama + ' (rata ' + _fmt(v) + ', lemah di ' + lemah + ')'
    })
    return n + ' nilai terendah' + sebut + ': ' + lines.join('; ') +
      '. Fokus bimbingan ke mapel terlemah masing-masing, pantau tugas 2 minggu, ' +
      'dan cek apakah absensinya juga rendah.'
  }

  const mod = ql.includes('rendah') || ql.includes('jelek') || ql.includes('buruk') || ql.includes('bawah')
  const mod_hi =
    ql.includes('tinggi') || ql.includes('bagus') || ql.includes('baik') ||
    ql.includes('jago') || ql.includes('atas')
  if (ql.includes('intervensi')) {
    const hit = rows.filter(([, r]) => r.badge === 'Intervensi')
    if (!hit.length) {
      return 'Kabar baik — tak ada siswa badge Intervensi saat ini. Pertahankan pemantauan rutin.'
    }
    if (((mod || mod_hi) && ql.includes('siapa')) || ql.includes('paling')) {
      const [s, r] =
        mod && !mod_hi
          ? hit.reduce((a, b) => (b[1].skor < a[1].skor ? b : a))
          : hit.reduce((a, b) => (b[1].skor > a[1].skor ? b : a))
      return 'Intervensi paling ' + (mod && !mod_hi ? 'rendah' : 'tinggi') + ': ' +
        s.nama + ' (skor ' + r.skor + ', karena ' + (r.alasan[0] || '-') + '). ' +
        (mod && !mod_hi
          ? 'Tetap pantau, tapi dahulukan yang skornya lebih tinggi.'
          : 'Ini prioritas utama minggu ini; panggil dan bila perlu undang orang tua.')
    }
    const sorted = [...hit].sort((a, b) => b[1].skor - a[1].skor)
    const lines = sorted.map(([s, r]) => s.nama + ' (skor ' + r.skor + ', karena ' + (r.alasan[0] || '-') + ')')
    return 'Ada ' + hit.length + ' siswa butuh perhatian segera: ' + lines.join('; ') +
      '. Saran saya: panggil minggu ini satu per satu; kalau belum membaik, undang orang tua.'
  }
  if (ql.includes('pantau')) {
    const hit = rows.filter(([, r]) => r.badge === 'Pantau')
    if (!hit.length) return 'Tak ada siswa badge Pantau. Semua relatif aman.'
    if (((mod || mod_hi) && ql.includes('siapa')) || ql.includes('paling')) {
      const [s, r] =
        mod && !mod_hi
          ? hit.reduce((a, b) => (b[1].skor < a[1].skor ? b : a))
          : hit.reduce((a, b) => (b[1].skor > a[1].skor ? b : a))
      return 'Pantau paling ' + (mod && !mod_hi ? 'rendah' : 'tinggi') + ': ' +
        s.nama + ' (skor ' + r.skor + ', karena ' + (r.alasan[0] || '-') +
        '). Cek berkala 2 minggu sekali cukup.'
    }
    return 'Perlu dipantau (' + hit.length + ' siswa): ' +
      hit.map(([s]) => s.nama).join(', ') + '. Cek berkala 2 minggu sekali cukup.'
  }
  if (ql.includes('aman')) {
    const hit = rows.filter(([, r]) => r.badge === 'Aman').map(([s]) => s)
    if (!hit.length) return 'Tak ada siswa badge Aman saat ini.'
    return 'Aman ada ' + hit.length + ' siswa, contoh: ' +
      hit.slice(0, 5).map((s) => s.nama).join(', ') + '. Beri apresiasi biar konsisten.'
  }
  if (ql.includes('turun') || ql.includes('tren') || ql.includes('naik')) {
    const mau_naik = ql.includes('naik') && !ql.includes('turun')
    const target = mau_naik ? 'Naik' : 'Turun'
    const hit = rows.filter(([s]) => (s.tren || '') === target).map(([s]) => s)
    if (!hit.length) {
      return 'Tak ada siswa dengan tren ' + target + '. ' +
        (target === 'Turun' ? 'Bagus!' : 'Cek lagi datanya.')
    }
    if (mau_naik) {
      return 'Tren naik ada ' + hit.length + ' siswa: ' + hit.map((s) => s.nama).join(', ') +
        '. Kabar baik — beri apresiasi biar menular ke yang lain.'
    }
    return 'Trennya turun ada ' + hit.length + ' siswa: ' + hit.map((s) => s.nama).join(', ') +
      '. Coba sandingkan dengan absensi mereka — biasanya dua ini jalan bareng.'
  }
  if (
    ql.includes('berapa') || ql.includes('jumlah') || ql.includes('ringkas') ||
    ql.includes('keseluruhan') || ql.includes('semua')
  ) {
    const c = {}
    for (const [, r] of rows) c[r.badge] = (c[r.badge] || 0) + 1
    return 'Dari ' + rows.length + ' siswa: ' + (c.Intervensi || 0) + ' Intervensi, ' +
      (c.Pantau || 0) + ' Pantau, ' + (c.Aman || 0) + ' Aman. ' +
      (c.Intervensi
        ? 'Fokus minggu ini ke yang Intervensi dulu.'
        : 'Kondisi semester sehat, tinggal jaga yang Pantau.')
  }
  if (ql.includes('rata-rata kelas') || ql.includes('rata2 kelas') || ql.includes('rata kelas') || ql.includes('rata-rata semester') || ql.includes('rata semester')) {
    const vals = (DATA.students || [])
      .map((s) => _kr(s, akhir).rata)
      .filter((v) => v != null)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return 'Rata-rata semester: ' + avg.toFixed(2) + ' dari ' + vals.length + ' siswa. ' +
      (avg >= 85
        ? 'Bagus, di atas 85.'
        : 'Di bawah 85 — perlu penguatan belajar kolektif, mungkin remedial massal mapel terlemah.')
  }
  return 'Hmm, saya kurang paham maksudnya. Saya cuma bisa jawab dari data radar — ' +
    'soal nilai, absensi, tren, dan saran BK. ' + CONTOH
}

export function _fmt(v) {
  if (v == null) return '-'
  return typeof v === 'number' ? String(v) : String(v)
}
