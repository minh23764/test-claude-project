export interface BestRecord {
  score: number
  time: number
}

const KEY = 'arena-survival:best'

/** Storage can be unavailable (private mode, blocked site data), so every access is guarded. */
export function loadBest(): BestRecord {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BestRecord>
      return { score: Number(parsed.score) || 0, time: Number(parsed.time) || 0 }
    }
  } catch {
    // Fall through to an empty record.
  }
  return { score: 0, time: 0 }
}

export function saveBest(best: BestRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(best))
  } catch {
    // Not persisting is acceptable.
  }
}

const MUTED_KEY = 'arena-survival:muted'

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0')
  } catch {
    // Not persisting is acceptable.
  }
}
