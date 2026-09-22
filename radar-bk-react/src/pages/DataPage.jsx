import { useState } from 'react'
import seed from '../data/students.json'
import { saveState } from '../lib/store.js'
import { notifyDatasetChanged } from '../lib/dataset.js'
import {
  SEED_NAME,
  validateWorkbook,
  parseDataset,
  downloadTemplate,
  loadDatasets,
  saveDatasets,
} from '../lib/xlsx-validate.js'
import UploadBox from '../components/UploadBox.jsx'

const ADMIN_PASSWORD = 'admin123'
const AUTH_KEY = 'radar-bk-data-auth'

function isAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export default function DataPage() {
  const [lib, setLib] = useState(loadDatasets)
  const [errors, setErrors] = useState([])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pw, setPw] = useState('')

  const files = [SEED_NAME, ...Object.keys(lib.files)]
  const active = lib.active || SEED_NAME
  const activeCount =
    active === SEED_NAME ? seed.length : (lib.files[active] || []).length

  function persist(nextActive, nextFiles) {
    saveDatasets(nextActive, nextFiles)
    setLib({ active: nextActive, files: nextFiles })
    notifyDatasetChanged()
  }

  function useActive(name, filesMap) {
    // Ganti dataset → reset status/sosio (samakan Flask data_upload/data_activate)
    saveState({}, {}, name)
    persist(name, filesMap)
    setErrors([])
  }

  function onLoaded(wb, filename) {
    const errs = validateWorkbook(wb)
    if (errs.length) {
      setErrors(errs)
      return
    }
    const ds = parseDataset(wb)
    const nextFiles = { ...lib.files, [filename]: ds.students }
    useActive(filename, nextFiles)
  }

  function onActivate(name) {
    useActive(name, lib.files)
  }

  function onDelete(name) {
    if (name === SEED_NAME) {
      setErrors(['Dataset bawaan tak boleh dihapus.'])
      return
    }
    if (name === active) {
      setErrors(["Aktifkan dataset lain dulu sebelum hapus '" + name + "'."])
      return
    }
    if (!isAuthed()) {
      setPendingDelete(name)
      setPw('')
      setErrors([])
      return
    }
    doDelete(name)
  }

  function doDelete(name) {
    const nextFiles = { ...lib.files }
    delete nextFiles[name]
    persist(active, nextFiles)
    setErrors([])
  }

  function confirmPassword(e) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(AUTH_KEY, '1')
      } catch { /* abaikan */ }
      const name = pendingDelete
      setPendingDelete(null)
      setPw('')
      if (name) doDelete(name)
    } else {
      setErrors(['Password salah.'])
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Data</h1>
      <p className="mb-3 text-sm text-gray-600">
        Dataset aktif: <strong>{active}</strong> ({activeCount} siswa). Header toleran:
        nama sheet & urutan kolom bebas; tren & rata K5 opsional (dihitung otomatis).
      </p>
      {errors.length > 0 && (
        <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 shadow">
          <ul className="list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mb-3">
        <UploadBox onLoaded={onLoaded} />
      </div>
      <div className="mb-3">
        <button
          type="button"
          onClick={downloadTemplate}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Unduh template
        </button>
      </div>
      {pendingDelete && (
        <form
          onSubmit={confirmPassword}
          className="mb-3 rounded-lg bg-amber-50 p-3 text-sm shadow"
        >
          <p className="mb-2 font-semibold">
            Hapus “{pendingDelete}” butuh password admin:
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password admin…"
              aria-label="Password admin"
              autoFocus
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 focus:outline-indigo-600"
            />
            <button
              type="submit"
              className="rounded bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">File</th>
              <th className="p-2">Siswa</th>
              <th className="p-2">Status</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f} className="border-t">
                <td className="p-2 font-medium">{f}</td>
                <td className="p-2">{f === SEED_NAME ? seed.length : (lib.files[f] || []).length}</td>
                <td className="p-2">
                  {f === active ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      Aktif
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="flex gap-2 p-2">
                  {f !== active && (
                    <button
                      type="button"
                      onClick={() => onActivate(f)}
                      className="rounded border border-indigo-600 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-50"
                    >
                      Aktifkan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(f)}
                    className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
