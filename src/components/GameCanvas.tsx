import { useEffect, useRef } from 'react'
import { Engine } from '../game/Engine.ts'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas)
    engine.start()
    // StrictMode mounts twice in dev; destroying here keeps exactly one loop alive.
    return () => engine.destroy()
  }, [])

  return <canvas ref={canvasRef} className="game-canvas" />
}
