import { rekomendasiProspek, rumpunTerkuat } from '../src/lib/prospek.js'

const mk = (ipas, bind, mtk, rata, poin = 0, tren = 'Naik') => ({
  kelas_akhir: 'Semester 5',
  tren,
  kelas_rows: { 'Semester 5': { ipas, bind, mtk, absensi: 98, rata, poin } },
})

test('rata 95 Aman → internasional + lokal', () => {
  const s = mk(95, 94, 96, 95)
  const r = rekomendasiProspek(s, { badge: 'Aman' }, 'Semester 5')
  expect(r.jalur).toContain('internasional')
  expect(r.jalur).toContain('lokal')
  expect(r.mapelKuat).toBe('mtk')
  expect(r.kampus[0]).toBe('Universitas Telkom')
})

test('rata 80 → vokasi + lokal, telkom ikut', () => {
  const s = mk(80, 85, 78, 80)
  const r = rekomendasiProspek(s, { badge: 'Pantau' }, 'Semester 5')
  expect(r.jalur).toContain('vokasi')
  expect(r.mapelKuat).toBe('bind')
  expect(r.kampus).toContain('Universitas Telkom')
})

test('poin aktif → catatan disiplin', () => {
  const s = mk(88, 87, 89, 88, 2)
  const r = rekomendasiProspek(s, { badge: 'Pantau' }, 'Semester 5')
  expect(r.alasan.join(' ')).toMatch(/disiplin/)
})

test('rumpun ipas → saintek', () => {
  expect(rumpunTerkuat(mk(95, 80, 82, 90)).rumpun).toMatch(/Saintek/)
})
