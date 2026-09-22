import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset.js'
import TrendChart from '../components/TrendChart.jsx'
import { computeRisk } from '../lib/risk.js'

export default function Tren() {
  const students = useDataset()
  const labels = students.length ? students[0].kelas_labels : []
  const rows = students.map((s) => ({ ...s, risk: computeRisk(s) }))
  const nNaik = rows.filter((r) => r.tren === 'Naik').length
  const nTurun = rows.filter((r) => r.tren === 'Turun').length
  const rataAkhir = rows.length
    ? (rows.reduce((a, r) => a + (((r.kelas_rows[r.kelas_akhir] || {}).rata) ?? 0), 0) / rows.length).toFixed(1)
    : '-'
  const avgKelas = (i) => {
    const vals = rows.map((r) => {
      const [a, b, c] = [(r.ip_k || [])[i], (r.bi_k || [])[i], (r.mtk_k || [])[i]]
      return a != null && b != null && c != null ? (a + b + c) / 3 : null
    }).filter((v) => v != null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-'
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Tren Nilai</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-slate-500">Siswa</div><div className="text-2xl font-bold">{rows.length}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-slate-500">Rata kelas akhir</div><div className="text-2xl font-bold">{rataAkhir}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-slate-500">Tren Naik</div><div className="text-2xl font-bold text-emerald-600">{nNaik}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow"><div className="text-sm text-slate-500">Tren Turun</div><div className="text-2xl font-bold text-red-600">{nTurun}</div></div>
      </div>
      <TrendChart students={students} labels={labels} />
      <div className="overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-100">
            <tr><th className="p-2 text-left">Nama</th>{labels.map((lb) => <th key={lb} className="p-2">{lb.replace('Kelas ', 'K')}</th>)}<th className="p-2">Tren</th></tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className={idx % 2 ? 'bg-slate-50' : ''}>
                <td className="p-2"><Link className="text-indigo-600 hover:underline" to={`/siswa/${r.id}`}>{r.nama}</Link></td>
                {labels.map((_, i) => {
                  const [a, b, c] = [(r.ip_k || [])[i], (r.bi_k || [])[i], (r.mtk_k || [])[i]]
                  return <td key={i} className="p-2 text-center">{a != null && b != null && c != null ? ((a + b + c) / 3).toFixed(1) : '-'}</td>
                })}
                <td className="p-2 text-center font-bold" style={{ color: r.tren === 'Naik' ? '#059669' : '#dc2626' }}>{r.tren}</td>
              </tr>
            ))}
            <tr className="bg-indigo-50 font-bold">
              <td className="p-2">Rata kelas</td>
              {labels.map((_, i) => <td key={i} className="p-2 text-center">{avgKelas(i)}</td>)}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
