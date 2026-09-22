import { Link, useParams } from 'react-router-dom'
import { computeRisk } from '../lib/risk.js'
import { rekomendasi } from '../lib/rekom.js'
import { useDataset } from '../lib/dataset.js'
import Badge from '../components/Badge.jsx'
import { sem } from '../lib/dataset.js'
import { StudentLine } from '../components/TrendChart.jsx'
import NotFound from './NotFound.jsx'

export default function Siswa() {
  const students = useDataset()
  const { id } = useParams()
  const sid = decodeURIComponent(id || '')
  const s = students.find((x) => x.id === sid)
  if (!s) return <NotFound />
  const risk = computeRisk(s)
  const rekom = rekomendasi(s, risk)
  const kr = (s.kelas_rows || {})[s.kelas_akhir] || {}
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/radar" className="mb-3 inline-block rounded-lg bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300">← Kembali</Link>
      <div className="rounded-xl bg-white p-5 shadow">
        <h1 className="text-xl font-bold">{s.nama}</h1>
        <p className="mb-2 text-sm text-slate-500">{s.id}</p>
        <p className="mb-3"><Badge value={risk.badge} /> <span className="ml-2 text-sm font-semibold">Skor {risk.skor}</span></p>
        <p className="text-sm text-slate-600">Semester akhir: {sem(s.kelas_akhir)} · Absensi {kr.absensi ?? '-'}% · Rata {kr.rata ?? '-'} · Poin {kr.poin ?? '-'} · Tren {s.tren ?? '-'}</p>
        <h2 className="mt-4 font-semibold">Alasan</h2>
        <ul className="list-disc pl-5 text-sm">
          {risk.alasan.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
        <h2 className="mt-4 font-semibold">Rekomendasi</h2>
        <ul className="list-disc pl-5 text-sm">
          {rekom.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      <div className="mt-4">
        <StudentLine student={s} labels={s.kelas_labels || []} />
      </div>
    </div>
  )
}
