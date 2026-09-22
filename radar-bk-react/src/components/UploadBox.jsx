import { useState } from 'react'
import * as XLSX from 'xlsx'

const MAX_BYTES = 5 * 1024 * 1024

export default function UploadBox({ onLoaded }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function handleFile(f) {
    setErr('')
    if (!f) return
    if (!/\.xlsx$/i.test(f.name)) {
      setErr('Pilih file .xlsx dulu.')
      return
    }
    if (f.size > MAX_BYTES) {
      setErr('File kebesaran (maks 5MB).')
      return
    }
    setBusy(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        onLoaded && onLoaded(wb, f.name)
      } catch (ex) {
        setErr('File tak terbaca sebagai xlsx: ' + (ex && ex.message ? ex.message : ex))
      } finally {
        setBusy(false)
      }
    }
    reader.onerror = () => {
      setErr('Gagal membaca file.')
      setBusy(false)
    }
    reader.readAsArrayBuffer(f)
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <label className="mb-1 block text-sm font-semibold" htmlFor="xlsx-upload">
        Unggah dataset (.xlsx, maks 5MB)
      </label>
      <input
        id="xlsx-upload"
        type="file"
        accept=".xlsx"
        disabled={busy}
        onChange={(e) => handleFile(e.target.files && e.target.files[0])}
        className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
      />
      {busy && <p className="mt-1 text-sm text-gray-500">Membaca file…</p>}
      {err && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {err}
        </p>
      )}
    </div>
  )
}
