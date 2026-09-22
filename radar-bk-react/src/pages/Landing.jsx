import { Link } from 'react-router-dom'
import { computeRisk } from '../lib/risk.js'
import students from '../data/students.json'

const CARDS = [
  { to: '/radar', label: 'Radar', desc: 'Papan risiko siswa' },
  { to: '/tren', label: 'Tren', desc: 'Grafik tren nilai' },
  { to: '/kasus', label: 'Kasus', desc: 'Catat tindak lanjut' },
  { to: '/sosiometri', label: 'Sosiometri', desc: 'Peta pertemanan' },
  { to: '/data', label: 'Data', desc: 'Kelola dataset' },
  { to: '/tanya', label: 'Tanya', desc: 'Tanya jawab data' },
]

export default function Landing() {
  const rows = students.map((s) => ({ ...s, risk: computeRisk(s) }))
  const n = rows.length
  const n_int = rows.filter((r) => r.risk.badge === 'Intervensi').length
  return (
    <div>
      <div className="mb-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 p-6 text-white">
        <h1 className="text-2xl font-bold">RADAR BK</h1>
        <p className="text-sm">Sinyal dini siswa, cepat tanggap BK</p>
        <p className="mt-2 text-sm">{n} siswa terpantau · {n_int} perlu intervensi</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-xl bg-white p-4 shadow hover:shadow-md">
            <div className="font-semibold">{c.label}</div>
            <div className="text-sm text-slate-600">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
