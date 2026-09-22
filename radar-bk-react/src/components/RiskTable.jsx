import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge.jsx'

const BADGE_RANK = { Intervensi: 3, Pantau: 2, Aman: 1 }

function val(row, key) {
  const kr = (row.kelas_rows || {})[row.kelas_akhir] || {}
  switch (key) {
    case 'nama': return (row.nama || '').toLowerCase()
    case 'absensi': return kr.absensi ?? -1
    case 'rata': return kr.rata ?? -1
    case 'poin': return kr.poin ?? -1
    case 'tren': return (row.tren || '').toLowerCase()
    case 'badge': return BADGE_RANK[row.risk.badge] ?? 0
    case 'skor': return row.risk.skor ?? 0
    default: return 0
  }
}

const COLUMNS = [
  { key: 'nama', label: 'Nama' },
  { key: null, label: 'Kelas Akhir' },
  { key: 'absensi', label: 'Absensi' },
  { key: 'rata', label: 'Rata' },
  { key: 'poin', label: 'Poin' },
  { key: 'tren', label: 'Tren' },
  { key: 'badge', label: 'Badge' },
  { key: 'skor', label: 'Skor' },
]

export default function RiskTable({ rows }) {
  const [sort, setSort] = useState({ key: 'badge', dir: 'desc' })

  function onSort(key) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      return { key, dir: key === 'nama' || key === 'tren' ? 'asc' : 'desc' }
    })
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    const { key, dir } = sort
    const m = dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const va = val(a, key)
      const vb = val(b, key)
      if (va < vb) return -m
      if (va > vb) return m
      return a.nama.localeCompare(b.nama)
    })
    return arr
  }, [rows, sort])

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-600">
            {COLUMNS.map((c) => (
              <th key={c.label} className="px-3 py-2">
                {c.key ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className="inline-flex items-center gap-1 font-semibold hover:text-indigo-700"
                    aria-label={`Urutkan ${c.label}`}
                  >
                    {c.label}
                    <span className={sort.key === c.key ? 'text-indigo-700' : 'text-slate-300'}>
                      {sort.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const kr = (s.kelas_rows || {})[s.kelas_akhir] || {}
            return (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2"><Link to={`/siswa/${encodeURIComponent(s.id)}`} className="font-medium text-indigo-700 hover:underline">{s.nama}</Link></td>
                <td className="px-3 py-2">{s.kelas_akhir}</td>
                <td className="px-3 py-2">{kr.absensi ?? '-'}</td>
                <td className="px-3 py-2">{kr.rata ?? '-'}</td>
                <td className="px-3 py-2">{kr.poin ?? '-'}</td>
                <td className="px-3 py-2">{s.tren ?? '-'}</td>
                <td className="px-3 py-2"><Badge value={s.risk.badge} /></td>
                <td className="px-3 py-2 font-semibold">{s.risk.skor}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
