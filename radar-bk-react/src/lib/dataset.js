import { useEffect, useState } from 'react'
import seed from '../data/students.json'
import { loadDatasets } from './xlsx-validate.js'

export const DATASET_EVENT = 'radar-dataset-changed'

/** Display: 'Kelas 5' → 'Semester 5'. */
export function sem(label) {
  return String(label ?? '').replace(/^Kelas/, 'Semester')
}

/** Display pendek sumbu: 'Kelas 5' → 'S5'. */
export function semShort(label) {
  return String(label ?? '').replace(/^Kelas\s*/, 'S')
}

/** Dataset aktif: file pilihan di /data, fallback seed bawaan. */
export function getActiveStudents() {
  try {
    const lib = loadDatasets()
    if (lib.active && lib.files[lib.active]) return lib.files[lib.active]
  } catch { /* fallback seed */ }
  return seed
}

export function notifyDatasetChanged() {
  window.dispatchEvent(new Event(DATASET_EVENT))
}

/** Hook: re-render semua halaman saat dataset diaktifkan di /data. */
export function useDataset() {
  const [ds, setDs] = useState(getActiveStudents)
  useEffect(() => {
    const refresh = () => setDs(getActiveStudents())
    window.addEventListener(DATASET_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(DATASET_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return ds
}
