import { computeRisk } from '../src/lib/risk.js'
import data from '../src/data/students.json'
test('24 siswa seed + sort desc', () => {
  expect(data.length).toBe(24)
  const rows = data.map(s=>({...s,risk:computeRisk(s)})).sort((a,b)=>b.risk.skor-a.risk.skor)
  expect(rows[0].risk.skor).toBeGreaterThanOrEqual(rows[23].risk.skor)
})
