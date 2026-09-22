import { Link } from 'react-router-dom'
import { computeRisk } from '../lib/risk.js'
import { useDataset } from '../lib/dataset.js'

const CARDS = [
  {
    to: '/radar', label: 'Radar', desc: 'Papan risiko siswa, sortir semua kolom',
    bg: 'bg-rose-50', ring: 'hover:ring-rose-300', iconBg: 'bg-rose-500',
    icon: (<path d="M12 9a3 3 0 100 6 3 3 0 000-6zm-7 3a7 7 0 0114 0c0 2-1 3.5-2 4.5-.5.5-1 1.5-1 2.5H8c0-1-.5-2-1-2.5-1-1-2-2.5-2-4.5z" />),
  },
  {
    to: '/tren', label: 'Tren', desc: 'Grafik bar + garis + tabel nilai',
    bg: 'bg-indigo-50', ring: 'hover:ring-indigo-300', iconBg: 'bg-indigo-500',
    icon: (<path d="M3 17l5-6 4 3 6-8 3 4" />),
  },
  {
    to: '/kasus', label: 'Kasus', desc: 'Catat tindak lanjut penanganan',
    bg: 'bg-amber-50', ring: 'hover:ring-amber-300', iconBg: 'bg-amber-500',
    icon: (<path d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01" />),
  },
  {
    to: '/sosiometri', label: 'Sosiometri', desc: 'Peta pertemanan + top 5',
    bg: 'bg-emerald-50', ring: 'hover:ring-emerald-300', iconBg: 'bg-emerald-500',
    icon: (<path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8zm6-3a3 3 0 11-2 2.82M6 9a3 3 0 102-2.82" />),
  },
  {
    to: '/data', label: 'Data', desc: 'Upload & kelola dataset',
    bg: 'bg-sky-50', ring: 'hover:ring-sky-300', iconBg: 'bg-sky-500',
    icon: (<path d="M4 7c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zm0 0v10c0 1.1 3.6 2 8 2s8-.9 8-2V7M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" />),
  },
  {
    to: '/tanya', label: 'Tanya', desc: 'Tanya jawab data, offline',
    bg: 'bg-violet-50', ring: 'hover:ring-violet-300', iconBg: 'bg-violet-500',
    icon: (<path d="M8 10h8M8 14h5M21 12a9 9 0 01-13.2 7.9L3 21l1.1-4.8A9 9 0 1121 12z" />),
  },
  {
    to: '/prospek', label: 'Prospek', desc: 'Arah studi: lokal, LN, vokasi, kedinasan',
    bg: 'bg-orange-50', ring: 'hover:ring-orange-300', iconBg: 'bg-orange-500',
    icon: (<path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />),
  },
]

export default function Landing() {
  const students = useDataset()
  const rows = students.map((s) => ({ ...s, risk: computeRisk(s) }))
  const n = rows.length
  const badge = (b) => rows.filter((r) => r.risk.badge === b).length

  return (
    <div className="grid gap-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-600 to-sky-500 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-10 -bottom-14 h-36 w-36 rounded-full bg-black/10" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Sistem dini BK</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">RADAR BK</h1>
        <p className="mt-1 max-w-xl text-sm text-white/85">
          Baca sinyal siswa sejak dini — satu radar untuk absensi, nilai, poin, dan tren.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">{n} siswa terpantau</span>
          <Link to="/radar" className="rounded-full bg-red-500/90 px-3 py-1 font-semibold hover:bg-red-500">{badge('Intervensi')} intervensi</Link>
          <Link to="/radar" className="rounded-full bg-amber-400/90 px-3 py-1 font-semibold text-amber-950 hover:bg-amber-400">{badge('Pantau')} pantau</Link>
          <Link to="/radar" className="rounded-full bg-emerald-400/90 px-3 py-1 font-semibold text-emerald-950 hover:bg-emerald-400">{badge('Aman')} aman</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`group rounded-2xl ${c.bg} p-4 shadow ring-1 ring-transparent transition hover:shadow-md hover:ring-2 ${c.ring}`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg} text-white`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  {c.icon}
                </svg>
              </span>
              <div className="font-bold">{c.label}</div>
              <span className="ml-auto text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600">→</span>
            </div>
            <div className="mt-2 text-sm text-slate-600">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
