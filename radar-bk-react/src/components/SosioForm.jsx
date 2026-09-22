import { useEffect, useState } from 'react'

export function validateSosio(pemilih, teman) {
  if (!pemilih) return 'Pilih nama pengisi dulu.'
  if (!Array.isArray(teman) || teman.length !== 3) return 'Pilih tepat 3 teman.'
  if (teman.some((t) => !t)) return 'Lengkapi ketiga pilihan teman.'
  if (teman.includes(pemilih)) return 'Pemilih tak boleh memilih diri sendiri.'
  if (new Set(teman).size !== 3) return 'Ketiga pilihan harus teman berbeda (anti-duplikat).'
  return null
}

export default function SosioForm({ students, pemilih, setPemilih, submitted = {}, onSave }) {
  const isEdit = submitted[pemilih] !== undefined
  const [teman, setTeman] = useState(() => submitted[pemilih] || ['', '', ''])
  const [err, setErr] = useState(null)

  // Edit prefill: tiap ganti pemilih, muat jawaban lama bila ada
  useEffect(() => {
    setTeman(submitted[pemilih] || ['', '', ''])
    setErr(null)
  }, [pemilih]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    const msg = validateSosio(pemilih, teman)
    if (msg) {
      setErr(msg)
      return
    }
    setErr(null)
    onSave(pemilih, [...teman])
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 font-semibold">Formulir Sosiometri — pilih 3 teman terdekat</h2>
      {err && (
        <p role="alert" className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">
          {err}
        </p>
      )}
      <label className="mb-2 block text-sm">
        Nama pengisi
        <select
          aria-label="Nama pengisi"
          value={pemilih}
          onChange={(e) => setPemilih(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 p-2"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      </label>
      {[0, 1, 2].map((i) => (
        <label key={i} className="mb-2 block text-sm">
          Pilihan {i + 1}
          <select
            aria-label={`Pilihan ${i + 1}`}
            value={teman[i] || ''}
            onChange={(e) => {
              const next = [...teman]
              next[i] = e.target.value
              setTeman(next)
            }}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
          >
            <option value="">— pilih teman —</option>
            {students
              .filter((s) => s.id !== pemilih)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
          </select>
        </label>
      ))}
      <button
        type="button"
        onClick={handleSave}
        className="mt-2 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {isEdit ? 'Perbarui' : 'Simpan'}
      </button>
    </div>
  )
}
