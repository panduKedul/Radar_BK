import { Link } from 'react-router-dom'
import Badge from './Badge.jsx'

export default function RiskTable({ rows }) {
  const sorted = [...rows].sort((a, b) => b.risk.skor - a.risk.skor)
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-600">
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">Kelas Akhir</th>
            <th className="px-3 py-2">Absensi</th>
            <th className="px-3 py-2">Rata</th>
            <th className="px-3 py-2">Poin</th>
            <th className="px-3 py-2">Tren</th>
            <th className="px-3 py-2">Badge</th>
            <th className="px-3 py-2">Skor</th>
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
