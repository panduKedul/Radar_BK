import * as XLSX from 'xlsx'

export const SEED_NAME = 'Data Kelas 5 lengkap.xlsx'
export const DATASETS_KEY = 'radar-bk-datasets'

const REQUIRED1 = [
  'id', 'nama', 'kelas', 'nilai_ipas', 'nilai_bind', 'nilai_mtk',
  'absensi harian', 'rata_nilai', 'poin_pelanggaran',
]
const REQUIRED2 = ['id siswa', 'nama siswa']

export const TEMPLATE1 = [
  'id', 'nama', 'kelas', 'nilai_ipas', 'nilai_bind', 'nilai_mtk',
  'absensi harian', 'rata_nilai', 'poin_pelanggaran',
]
export const TEMPLATE2 = [
  'No', 'ID Siswa', 'Nama Siswa', 'IPAS K1', 'IPAS K2', 'IPAS K3',
  'IPAS K4', 'IPAS K5 (Asli)', 'B.Ind K1', 'B.Ind K2', 'B.Ind K3',
  'B.Ind K4', 'B.Ind K5 (Asli)', 'MTK K1', 'MTK K2', 'MTK K3',
  'MTK K4', 'MTK K5 (Asli)', 'Rata-rata K5 (Asli)', 'Tren Akhir',
]

export function norm(h) {
  return String(h ?? '').trim().toLowerCase()
}

function sheetRows(wb, name) {
  const ws = wb.Sheets[name]
  if (!ws) return []
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
}

function detectSheets(wb) {
  const found = {}
  for (const name of wb.SheetNames) {
    const grid = sheetRows(wb, name)
    if (!grid.length) continue
    const head = grid[0].map(norm)
    if (REQUIRED1.every((c) => head.includes(c))) found.utama = name
    if (REQUIRED2.every((c) => head.includes(c))) found.rekap = name
  }
  return found
}

/** Validate workbook client-side. Return array pesan ramah (kosong = lolos). */
export function validateWorkbook(wb) {
  if (!wb || !wb.SheetNames || !wb.SheetNames.length) {
    return ['File tak terbaca sebagai xlsx. Unduh template lalu isi ulang.']
  }
  const found = detectSheets(wb)
  const errs = []
  if (!found.utama) {
    errs.push(
      'Bagian data nilai tak ketemu (butuh kolom: id, nama, kelas, nilai_ipas, nilai_bind, nilai_mtk, absensi harian, rata_nilai, poin_pelanggaran). Unduh template.'
    )
  }
  if (!found.rekap) {
    errs.push(
      'Bagian rekap tak ketemu (butuh kolom: ID Siswa, Nama Siswa; opsional: Rata-rata K5 (Asli), Tren Akhir — tren dihitung otomatis bila kosong). Unduh template.'
    )
  }
  if (!errs.length) {
    try {
      const ds = parseDataset(wb)
      if (!ds.students.length) errs.push('Isi tak terbaca: tak ada baris siswa valid (id + nama wajib).')
    } catch (e) {
      errs.push('Isi tak terbaca: ' + (e && e.message ? e.message : e))
    }
  }
  return errs
}

export function parsePct(v) {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return v
  const n = parseFloat(String(v).replace('%', '').trim())
  return Number.isNaN(n) ? 0 : n
}

function kelasNo(k) {
  const m = String(k || '').match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

function trenOtomatis(ratas) {
  const vals = ratas.filter((x) => x != null)
  if (vals.length < 2) return '-'
  return vals[vals.length - 1] >= vals[0] ? 'Naik' : 'Turun'
}

/** Build {students} setara load_dataset Python dari workbook SheetJS. */
export function parseDataset(wb) {
  const found = detectSheets(wb)
  if (!found.utama || !found.rekap) throw new Error('Sheet data nilai / rekap tak ketemu.')
  const g1 = sheetRows(wb, found.utama)
  const head1 = g1[0].map(norm)
  const col = (n) => head1.indexOf(n)
  const byId = {}
  for (const r of g1.slice(1)) {
    const sid = String(r[col('id')] ?? '').trim()
    const nama = String(r[col('nama')] ?? '').trim()
    if (!sid || !nama) continue
    const kelas = String(r[col('kelas')] ?? '').trim()
    if (!byId[sid]) byId[sid] = { id: sid, nama, kelas_rows: {} }
    byId[sid].kelas_rows[kelas] = {
      ipas: r[col('nilai_ipas')],
      bind: r[col('nilai_bind')],
      mtk: r[col('nilai_mtk')],
      absensi: parsePct(r[col('absensi harian')]),
      rata: r[col('rata_nilai')],
      poin: r[col('poin_pelanggaran')] || 0,
    }
  }
  const g2 = sheetRows(wb, found.rekap)
  const head2 = g2[0].map(norm)
  const row2 = (r) => Object.fromEntries(head2.map((h, i) => [h, r[i]]))
  const get = (row, ...names) => {
    for (const n of names) {
      const v = row[norm(n)]
      if (v != null && v !== '') return v
    }
    return null
  }
  const series = (row, ...prefixes) => {
    const out = []
    for (let i = 1; i <= 5; i++) {
      let v = null
      for (const p of prefixes) {
        const cands = i === 5 ? [p + ' k' + i + ' (asli)', p + ' k' + i] : [p + ' k' + i]
        for (const c of cands) {
          const gv = get(row, c)
          if (gv != null && gv !== '') { v = gv; break }
        }
        if (v != null) break
      }
      out.push(v)
    }
    return out
  }
  for (const r of g2.slice(1)) {
    const sid = String(r[head2.indexOf('id siswa')] ?? '').trim()
    if (!byId[sid]) continue
    const row = row2(r)
    byId[sid].ip_k = series(row, 'ipas')
    byId[sid].bi_k = series(row, 'b.ind', 'b. indonesia')
    byId[sid].mtk_k = series(row, 'mtk', 'matematika')
    byId[sid].rata_k5 = get(row, 'Rata-rata K5 (Asli)')
    byId[sid].tren = String(get(row, 'Tren Akhir') ?? '').trim()
  }
  for (const s of Object.values(byId)) {
    const order = Object.keys(s.kelas_rows).sort((a, b) => kelasNo(a) - kelasNo(b))
    s.kelas_labels = order
    s.kelas_akhir = order.length ? order[order.length - 1] : '-'
    if (!s.ip_k) {
      s.ip_k = order.map((k) => s.kelas_rows[k].ipas)
      s.bi_k = order.map((k) => s.kelas_rows[k].bind)
      s.mtk_k = order.map((k) => s.kelas_rows[k].mtk)
      s.rata_k5 = order.length ? s.kelas_rows[order[order.length - 1]].rata : null
      s.tren = ''
    }
    if (!s.tren) s.tren = trenOtomatis(order.map((k) => s.kelas_rows[k].rata))
  }
  return { students: Object.values(byId) }
}

/** Bangun workbook template client-side (2 sheet). */
export function buildTemplate() {
  const wb = XLSX.utils.book_new()
  const ws1 = XLSX.utils.aoa_to_sheet([
    TEMPLATE1,
    ['CONTOH-ID', 'Nama Contoh', 'Kelas 5', 90, 90, 90, '95%', 90, 0],
  ])
  XLSX.utils.book_append_sheet(wb, ws1, 'Dataset_Format_Website')
  const ws2 = XLSX.utils.aoa_to_sheet([TEMPLATE2])
  XLSX.utils.book_append_sheet(wb, ws2, 'Rekap_Per_Mapel_K1_sd_K5')
  return wb
}

export function downloadTemplate() {
  XLSX.writeFile(buildTemplate(), 'template_dataset.xlsx')
}

// --- dataset aktif di localStorage (ganti state.json + .aktif server) ---
function emptyLib() {
  return { active: null, files: {} }
}

export function loadDatasets() {
  try {
    const raw = localStorage.getItem(DATASETS_KEY)
    if (!raw) return emptyLib()
    const p = JSON.parse(raw)
    return {
      active: p.active ?? null,
      files: p.files && typeof p.files === 'object' ? p.files : {},
    }
  } catch {
    return emptyLib()
  }
}

export function saveDatasets(active, files) {
  localStorage.setItem(DATASETS_KEY, JSON.stringify({ active, files }))
  return { active, files }
}
