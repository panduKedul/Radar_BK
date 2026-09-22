const KEY = 'radar-bk-v1'

export const STATUS_CHOICES = ['observasi', 'dipanggil', 'orangtua', 'rujuk']

function emptyState() {
  return { status: {}, sosio: {}, active: null }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return {
      status: parsed.status && typeof parsed.status === 'object' ? parsed.status : {},
      sosio: parsed.sosio && typeof parsed.sosio === 'object' ? parsed.sosio : {},
      active: parsed.active ?? null,
    }
  } catch {
    return emptyState()
  }
}

export function saveState(status, sosio, active) {
  const prev = loadState()
  const next = {
    status: status ?? {},
    sosio: sosio ?? {},
    active: active !== undefined ? active : (prev.active ?? null),
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export const STORE_KEY = KEY
