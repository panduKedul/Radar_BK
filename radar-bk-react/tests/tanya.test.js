import { jawab } from '../src/lib/tanya.js'
import data from '../src/data/students.json'

const DATA = { students: data }

test('bantuan list 6 kategori', () => {
  // CONTOH tulis "Kehadiran" kapital → match case-insensitive
  expect(jawab('bantuan', DATA)).toMatch(/kehadiran/i)
})

test('nama asing ramah', () => {
  // tanya.py: Ups hanya bila kandidat 2-4 kata kapital DAN tanpa alias mapel
  // kata-utuh ("Zzz nilai mtk" = 1 kata + alias mtk → dijawab sebagai ranking mapel, benar 1:1)
  expect(jawab('Zzz Qqqq gimana kabarnya?', DATA)).toMatch(/Ups/)
})

test('ranking 1', () => {
  expect(jawab('ranking 1', DATA)).toMatch(/Ranking/)
})
