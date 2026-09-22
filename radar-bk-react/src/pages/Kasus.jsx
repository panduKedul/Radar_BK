import { useState } from 'react'
import { computeRisk } from '../lib/risk.js'
import { loadState, saveState, STATUS_CHOICES } from '../lib/store.js'
import students from '../data/students.json'
import Badge from '../components/Badge.jsx'

export default function Kasus() {
  const [state, setState] = useState(() => loadState())

  const rows = students
    .map((s) => ({ ...s, risk: computeRisk(s) }))
    .sort((a, b) => b.risk.skor - a.risk.skor)

  function onChange(id, value) {
    if (!STATUS_CHOICES.includes(value)) return
    const next = { ...state.status, [id]: value }
    saveState(next, state.sosio)
    setState((prev) => ({ ...prev, status: next }))
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Penanganan Kasus</h1>
      <p className="mb-3 text-sm text-gray-600">
        Ubah status per baris — otomatis tersimpan di perangkat (kunci radar-bk-v1).
      </p>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Nama</th>
              <th className="p-2">Badge</th>
              <th className="p-2">Skor</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.nama}</td>
                <td className="p-2">
                  <Badge label={r.risk.badge} />
                </td>
                <td className="p-2">{r.risk.skor}</td>
                <td className="p-2">
                  <select
                    aria-label={`Status ${r.nama}`}
                    value={state.status[r.id] || 'observasi'}
                    onChange={(e) => onChange(r.id, e.target.value)}
                    className="rounded border border-gray-300 bg-white p-1"
                  >
                    {STATUS_CHOICES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
