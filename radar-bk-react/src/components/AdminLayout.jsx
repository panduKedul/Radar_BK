import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Beranda' },
  { to: '/radar', label: 'Radar' },
  { to: '/tren', label: 'Tren' },
  { to: '/kasus', label: 'Kasus' },
  { to: '/sosiometri', label: 'Sosiometri' },
  { to: '/data', label: 'Data' },
  { to: '/tanya', label: 'Tanya' },
]

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const title =
    NAV.find((n) => n.to !== '/' && location.pathname.startsWith(n.to))?.label ??
    (location.pathname === '/' ? 'Beranda' : 'RADAR BK')

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      {/* Sidebar desktop */}
      <aside className="w-60 shrink-0 bg-[#1e2a3a] text-white p-4 hidden md:flex md:flex-col">
        <div className="text-xl font-bold tracking-wide">RADAR BK</div>
        <p className="text-xs text-slate-300 mb-4">Sinyal dini siswa, cepat tanggap BK</p>
        <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Kolom kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header sticky + hamburger HP */}
        <header className="bg-[#1e2a3a] text-white px-4 py-3 flex items-center gap-3">
          <button
            className="md:hidden rounded border border-white/30 px-2 py-1 text-sm"
            onClick={() => setOpen((v) => !v)}
            aria-label="Buka tutup menu"
            aria-expanded={open}
          >
            ☰
          </button>
          <div>
            <div className="font-bold leading-tight">RADAR BK</div>
            <div className="text-xs text-slate-300 leading-tight">
              {title} · Sinyal dini siswa, cepat tanggap BK
            </div>
          </div>
        </header>

        {/* Nav HP dropdown */}
        {open && (
          <nav
            className="md:hidden bg-[#1e2a3a] text-white px-4 pb-3 flex flex-col gap-1"
            aria-label="Navigasi seluler"
          >
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4">{children}</main>

        <footer className="bg-[#1e2a3a] text-white text-center text-sm p-3">
          Muhammad Pandu Wirakusuma · Telkom University Jakarta · © 2026
        </footer>
      </div>
    </div>
  )
}
