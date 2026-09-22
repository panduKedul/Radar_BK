// tests/risk.test.js
import { computeRisk } from '../src/lib/risk.js'
test('absensi 94 + rata 80 + poin 1 + turun = 100 Intervensi', () => {
  const s = { kelas_akhir:'Kelas 5', tren:'Turun', kelas_rows:{'Kelas 5':{absensi:94,rata:80,poin:1,ipas:80,bind:80,mtk:80}} }
  const r = computeRisk(s)
  expect(r.skor).toBe(100); expect(r.badge).toBe('Intervensi')
})
test('semua baik = 0 Aman', () => {
  const s = { kelas_akhir:'Kelas 5', tren:'Naik', kelas_rows:{'Kelas 5':{absensi:100,rata:90,poin:0,ipas:90,bind:90,mtk:90}} }
  expect(computeRisk(s).badge).toBe('Aman')
})
