import { getActiveStudents } from '../src/lib/dataset.js'
import seed from '../src/data/students.json'

test('fallback seed bila belum ada dataset aktif', () => {
  localStorage.clear()
  expect(getActiveStudents()).toEqual(seed)
  expect(getActiveStudents().length).toBe(24)
})

test('baca dataset aktif dari localStorage', () => {
  const mini = [{ id: 'X1', nama: 'Tes', kelas_labels: [], kelas_rows: {}, tren: 'Naik' }]
  localStorage.setItem('radar-bk-datasets', JSON.stringify({ active: 'mini.xlsx', files: { 'mini.xlsx': mini } }))
  expect(getActiveStudents()).toEqual(mini)
  localStorage.clear()
})
