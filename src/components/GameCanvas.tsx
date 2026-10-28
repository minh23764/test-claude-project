import { useEffect, useRef } from 'react'
import { Engine, type HudState, type RunStats } from '../game/Engine.ts'

interface Props {
  /** Whether the simulation should be advancing. */
  active: boolean
  /** Incrementing this starts a fresh run. 0 means no run has started yet. */
  runId: number
  muted: boolean
  onHud: (hud: HudState) => void
  onGameOver: (stats: RunStats) => void
}

export function GameCanvas({ active, runId, muted, onHud, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  // The engine is created once; refs let it always call the latest callbacks.
  const onHudRef = useRef(onHud)
  const onGameOverRef = useRef(onGameOver)

  useEffect(() => {
    onHudRef.current = onHud
    onGameOverRef.current = onGameOver
  }, [onHud, onGameOver])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, {
      onHud: (hud) => onHudRef.current(hud),
      onGameOver: (stats) => onGameOverRef.current(stats),
    })
    engineRef.current = engine
    engine.start()
    // StrictMode mounts twice in dev; destroying here keeps exactly one loop alive.
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (runId > 0) engineRef.current?.newGame()
  }, [runId])

  useEffect(() => {
    if (active) engineRef.current?.resume()
    else engineRef.current?.pause()
  }, [active])

  useEffect(() => {
    engineRef.current?.setMuted(muted)
  }, [muted])

  return <canvas ref={canvasRef} className="game-canvas" />
}
