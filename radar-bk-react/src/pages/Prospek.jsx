import { Link } from 'react-router-dom'
import { computeRisk } from '../lib/risk.js'
import { rekomendasiProspek } from '../lib/prospek.js'
import { useDataset } from '../lib/dataset.js'
import { sem } from '../lib/dataset.js'
import data from '../data/prospek.json'
import Badge from '../components/Badge.jsx'

const JALUR_STYLE = {
  lokal: 'bg-sky-100 text-sky-800',
  internasional: 'bg-violet-100 text-violet-800',
  vokasi: 'bg-emerald-100 text-emerald-800',
  kedinasan: 'bg-amber-100 text-amber-800',
}

const JALUR_LABEL = { lokal: 'Lokal', internasional: 'Internasional', vokasi: 'Vokasi', kedinasan: 'Kedinasan' }

export default function Prospek() {
  const students = useDataset()
  const akhir = students.length ? students[0].kelas_akhir : ''
  const rows = students.map((s) => {
    const risk = computeRisk(s)
    return { ...s, risk, pros: rekomendasiProspek(s, risk, akhir) }
  })

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-xl font-bold">Prospek Studi</h1>
        <p className="text-sm text-slate-600">
          Arah rekomendasi per siswa dari nilai (mapel terkuat + rata + badge). Data jalur kurasi {data.kurasi} ({data.sumber}) — cek situs resmi sebelum daftar.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Rumpun Kuat</th>
              <th className="px-3 py-2">Badge</th>
              <th className="px-3 py-2">Jalur Rekomendasi</th>
              <th className="px-3 py-2">Alasan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link to={`/siswa/${encodeURIComponent(r.id)}`} className="font-medium text-indigo-700 hover:underline">
                    {r.nama}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.pros.rumpun}</td>
                <td className="px-3 py-2"><Badge value={r.risk.badge} /></td>
                <td className="px-3 py-2">
                  <span className="flex flex-wrap gap-1">
                    {r.pros.jalur.map((j) => (
                      <span key={j} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${JALUR_STYLE[j]}`}>
                        {JALUR_LABEL[j]}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.pros.alasan.join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.kategori.map((k) => (
        <div key={k.id} className="rounded-2xl bg-white p-4 shadow">
          <h2 className="font-bold">{k.nama}</h2>
          <p className="mb-3 text-sm text-slate-600">{k.deskripsi}</p>
          {k.items.some((it) => it.unggulan) && (
            <div className="mb-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 p-[2px]">
              {k.items.filter((it) => it.unggulan).map((it) => (
                <a key={it.nama} href={it.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[10px] bg-white p-3 hover:bg-red-50">
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">UNGGULAN</span>
                  <span>
                    <span className="block font-bold text-red-700">{it.nama} ↗</span>
                    <span className="block text-sm">{it.fokus}</span>
                    <span className="block text-xs text-slate-500">{it.info}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {k.items.filter((it) => !it.unggulan).map((it) => (
              <a key={it.nama} href={it.link} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-3 hover:border-indigo-400 hover:shadow">
                <div className="font-semibold text-indigo-700">{it.nama} ↗</div>
                <div className="text-sm">{it.fokus}</div>
                <div className="text-xs text-slate-500">{it.info}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500">
        Semester aktif: {sem(akhir)}. Rekomendasi ini pembantu BK, bukan vonis — gabungkan dengan minat & kondisi siswa.
      </p>
    </div>
  )
}
