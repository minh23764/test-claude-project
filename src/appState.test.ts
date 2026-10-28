import { describe, expect, it } from 'vitest'
import { initialState, reducer, type AppState } from './appState.ts'

const fresh = () => initialState({ score: 100, time: 30 })
const playing = (): AppState => reducer(fresh(), { type: 'start' })

describe('app state', () => {
  it('starts in the menu and increments the run on start', () => {
    expect(fresh().status).toBe('menu')
    const s = playing()
    expect(s.status).toBe('playing')
    expect(s.runId).toBe(1)
    expect(reducer(s, { type: 'start' }).runId).toBe(2)
  })

  it('toggles pause only while playing or paused', () => {
    const paused = reducer(playing(), { type: 'togglePause' })
    expect(paused.status).toBe('paused')
    expect(reducer(paused, { type: 'togglePause' }).status).toBe('playing')
    expect(reducer(fresh(), { type: 'togglePause' }).status).toBe('menu')
    expect(reducer(fresh(), { type: 'pause' }).status).toBe('menu')
  })

  it('records a new best score', () => {
    const s = reducer(playing(), { type: 'gameOver', stats: { score: 250, time: 20, kills: 9 } })
    expect(s.status).toBe('gameover')
    expect(s.isNewBest).toBe(true)
    expect(s.best).toEqual({ score: 250, time: 30 })
    expect(s.lastRun?.kills).toBe(9)
  })

  it('keeps the old best when beaten on neither score nor time', () => {
    const s = reducer(playing(), { type: 'gameOver', stats: { score: 50, time: 10, kills: 2 } })
    expect(s.isNewBest).toBe(false)
    expect(s.best).toEqual({ score: 100, time: 30 })
  })

  it('clears the new-best flag on the next run', () => {
    const over = reducer(playing(), { type: 'gameOver', stats: { score: 999, time: 1, kills: 1 } })
    expect(reducer(over, { type: 'start' }).isNewBest).toBe(false)
  })
})
