import type { RunStats } from './game/Engine.ts'
import type { BestRecord } from './storage.ts'

export type Status = 'menu' | 'playing' | 'paused' | 'gameover'

export interface AppState {
  status: Status
  /** Incremented to start a fresh run. */
  runId: number
  lastRun: RunStats | null
  best: BestRecord
  isNewBest: boolean
}

export type Action =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'togglePause' }
  | { type: 'menu' }
  | { type: 'gameOver'; stats: RunStats }

export function initialState(best: BestRecord): AppState {
  return { status: 'menu', runId: 0, lastRun: null, best, isNewBest: false }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'start':
      return { ...state, status: 'playing', runId: state.runId + 1, isNewBest: false }
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state
    case 'resume':
      return state.status === 'paused' ? { ...state, status: 'playing' } : state
    case 'togglePause':
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return state
    case 'menu':
      return { ...state, status: 'menu' }
    case 'gameOver': {
      const { stats } = action
      const isNewBest = stats.score > state.best.score
      const best = {
        score: Math.max(state.best.score, stats.score),
        time: Math.max(state.best.time, stats.time),
      }
      return { ...state, status: 'gameover', lastRun: stats, best, isNewBest }
    }
  }
}
