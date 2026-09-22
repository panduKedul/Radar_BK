import { useState } from 'react'
import { computeRisk } from '../lib/risk.js'
import { loadState, saveState, STATUS_CHOICES } from '../lib/store.js'
import { useDataset } from '../lib/dataset.js'

export default function Kasus() {
  const students = useDataset()
  const [state, setState] = useState(() => loadState())
  const [pending, setPending] = useState(null)

  const rows = students
    .map((s) => ({ ...s, risk: computeRisk(s) }))
    .sort((a, b) => b.risk.skor - a.risk.skor)

  function onChange(id, value) {
    if (!STATUS_CHOICES.includes(value)) return
    if (value === (state.status[id] || 'observasi')) return
    const s = rows.find((r) => r.id === id)
    setPending({ id, value, nama: s ? s.nama : id })
  }

  function confirmYes() {
    if (!pending) return
    const next = { ...state.status, [pending.id]: pending.value }
    saveState(next, state.sosio)
    setState((prev) => ({ ...prev, status: next }))
    setPending(null)
  }

  function confirmNo() {
    setPending(null)
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
              <th className="p-2">Skor</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.nama}</td>
                <td
                  className="p-2 font-bold"
                  style={{
                    color:
                      r.risk.badge === 'Intervensi'
                        ? '#dc2626'
                        : r.risk.badge === 'Pantau'
                          ? '#d97706'
                          : '#059669',
                  }}
                >
                  {r.risk.skor}
                </td>
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
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi ganti status"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <p className="mb-1 font-semibold">Apakah ingin mengganti status siswa ini?</p>
            <p className="mb-4 text-sm text-slate-600">
              {pending.nama} → <strong>{pending.value}</strong>
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={confirmNo}
                autoFocus
                className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-100"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={confirmYes}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Iya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
