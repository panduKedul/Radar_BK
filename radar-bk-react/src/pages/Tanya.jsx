import { useState } from 'react'
import { jawab } from '../lib/tanya.js'
import seed from '../data/students.json'
import { loadDatasets } from '../lib/xlsx-validate.js'
import ChatBubble from '../components/ChatBubble.jsx'

const KEY = 'radar-bk-tanya'
const CAP = 20

function loadRiwayat() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.slice(-CAP) : []
  } catch {
    return []
  }
}

function activeStudents() {
  try {
    const lib = loadDatasets()
    if (lib.active && lib.files[lib.active]) return lib.files[lib.active]
  } catch { /* fallback seed */ }
  return seed
}

export default function Tanya() {
  const [riwayat, setRiwayat] = useState(loadRiwayat)
  const [q, setQ] = useState('')

  function push(entry) {
    const next = [...riwayat, entry].slice(-CAP)
    setRiwayat(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch { /* storage penuh: tampil sesi ini saja */ }
  }

  function onSubmit(e) {
    e.preventDefault()
    const query = q.trim().slice(0, 300)
    if (!query) return
    push({ q: query, a: jawab(query, { students: activeStudents() }) })
    setQ('')
  }

  function onReset() {
    setRiwayat([])
    localStorage.removeItem(KEY)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tanya Radar BK</h1>
          <p className="text-sm text-gray-600">
            Rule-based offline — tanpa AI luar, privasi siswa aman.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Reset
        </button>
      </div>
      <div className="mb-3 flex flex-col gap-2 rounded-lg bg-[#f3f4f6] p-3">
        {riwayat.length === 0 && (
          <p className="text-sm text-gray-500">
            Belum ada pertanyaan. Coba: “bantuan”, “ranking 1”, atau “rekomendasi untuk ALYA ZHAFIRAH”.
          </p>
        )}
        {riwayat.map((r, i) => (
          <div key={i} className="flex flex-col gap-1">
            <ChatBubble role="q" text={r.q} />
            <ChatBubble role="a" text={r.a} />
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={300}
          placeholder="Tulis pertanyaan (maks 300 karakter)…"
          aria-label="Pertanyaan"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-indigo-600"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Tanya
        </button>
      </form>
    </div>
  )
}
