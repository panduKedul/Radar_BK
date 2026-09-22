import { useEffect, useMemo, useState } from 'react'
import { loadState, saveState } from '../lib/store.js'
import { useDataset } from '../lib/dataset.js'
import SosioForm from '../components/SosioForm.jsx'

export default function Sosiometri() {
  const students = useDataset()
  const [state, setState] = useState(() => loadState())
  const [pemilih, setPemilih] = useState('')

  useEffect(() => {
    if (!pemilih && students.length) setPemilih(students[0].id)
  }, [pemilih, students])

  const names = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.nama])), [students])

  const { top5, bottom5, terisol } = useMemo(() => {
    const counts = {}
    Object.values(state.sosio).forEach((arr) => (arr || []).forEach((id) => {
      counts[id] = (counts[id] || 0) + 1
    }))
    const top5 = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    const bottom5 = Object.entries(counts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
    const terisol = students.map((s) => s.id).filter((id) => !counts[id])
    return { top5, bottom5, terisol }
  }, [state.sosio, students])

  function handleSave(id, teman) {
    const next = { ...state.sosio, [id]: teman }
    saveState(state.status, next)
    setState((prev) => ({ ...prev, sosio: next }))
    setPemilih(id)
  }

  const sudah = Object.keys(state.sosio)

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Sosiometri</h1>
      <p className="mb-3 text-sm text-gray-600">
        Setiap siswa memilih 3 teman. Counter top 5 + daftar terisol otomatis.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SosioForm
          students={students}
          pemilih={pemilih}
          setPemilih={setPemilih}
          submitted={state.sosio}
          onSave={handleSave}
        />
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 font-semibold">Top 5 paling dipilih</h2>
            {top5.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada data.</p>
            ) : (
              <ol className="list-decimal pl-5 text-sm">
                {top5.map(([id, n]) => (
                  <li key={id}>
                    {names[id] || id} — {n} suara
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 font-semibold">Top 5 paling jarang dipilih</h2>
            {bottom5.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada data.</p>
            ) : (
              <ol className="list-decimal pl-5 text-sm">
                {bottom5.map(([id, n]) => (
                  <li key={id}>
                    {names[id] || id} — {n} suara
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 font-semibold">Terisol (0 suara)</h2>
            {terisol.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada — semua pernah dipilih.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {terisol.map((id) => (
                  <li key={id}>{names[id] || id}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 font-semibold">Sudah mengisi ({sudah.length})</h2>
            {sudah.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {sudah.map((id) => (
                  <li key={id}>
                    {names[id] || id} → {(state.sosio[id] || []).map((t) => names[t] || t).join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
