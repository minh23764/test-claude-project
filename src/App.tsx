import { useCallback, useEffect, useReducer, useState } from 'react'
import { initialState, reducer } from './appState.ts'
import { GameCanvas } from './components/GameCanvas.tsx'
import { GameOverScreen } from './components/GameOverScreen.tsx'
import { HUD } from './components/HUD.tsx'
import { PauseOverlay } from './components/PauseOverlay.tsx'
import { StartScreen } from './components/StartScreen.tsx'
import { PLAYER_MAX_HP } from './game/config.ts'
import type { HudState, RunStats } from './game/Engine.ts'
import { loadBest, loadMuted, saveBest, saveMuted } from './storage.ts'

const emptyHud: HudState = { time: 0, score: 0, kills: 0, hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(loadBest()))
  const [hud, setHud] = useState(emptyHud)
  const [muted, setMuted] = useState(loadMuted)
  const { status } = state

  const onGameOver = useCallback((stats: RunStats) => dispatch({ type: 'gameOver', stats }), [])
  const toggleMuted = useCallback(() => setMuted((m) => !m), [])

  useEffect(() => {
    saveBest(state.best)
  }, [state.best])

  useEffect(() => {
    saveMuted(muted)
  }, [muted])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') dispatch({ type: 'togglePause' })
      else if (e.code === 'KeyM') toggleMuted()
    }
    // Losing focus means keys and the mouse stop reaching us, so pause rather than let the player die.
    const onLeave = () => dispatch({ type: 'pause' })
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onLeave()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [toggleMuted])

  return (
    <main className="app">
      <GameCanvas
        active={status === 'playing'}
        runId={state.runId}
        muted={muted}
        onHud={setHud}
        onGameOver={onGameOver}
      />
      {(status === 'playing' || status === 'paused') && <HUD hud={hud} />}
      {status === 'menu' && (
        <StartScreen
          best={state.best}
          muted={muted}
          onToggleMuted={toggleMuted}
          onStart={() => dispatch({ type: 'start' })}
        />
      )}
      {status === 'paused' && (
        <PauseOverlay
          muted={muted}
          onToggleMuted={toggleMuted}
          onResume={() => dispatch({ type: 'resume' })}
          onQuit={() => dispatch({ type: 'menu' })}
        />
      )}
      {status === 'gameover' && state.lastRun && (
        <GameOverScreen
          stats={state.lastRun}
          best={state.best}
          isNewBest={state.isNewBest}
          onRestart={() => dispatch({ type: 'start' })}
          onMenu={() => dispatch({ type: 'menu' })}
        />
      )}
    </main>
  )
}

export default App
