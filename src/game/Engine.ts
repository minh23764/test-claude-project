import { FIXED_DT } from './config.ts'
import { Game } from './Game.ts'
import { InputManager } from './input/InputManager.ts'
import { planSteps } from './loop.ts'
import { Renderer } from './render/Renderer.ts'
import type { InputState } from './types.ts'

/**
 * Owns the canvas, input listeners and the requestAnimationFrame loop. Lives outside React so
 * the simulation never triggers re-renders; React only creates, starts and destroys it.
 */
export class Engine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly renderer: Renderer
  private readonly input: InputManager
  private readonly inputState: InputState = {
    moveX: 0,
    moveY: 0,
    pointerX: 0,
    pointerY: 0,
    hasPointer: false,
  }
  readonly game: Game

  private rafId: number | null = null
  private lastTime = 0
  private accumulator = 0
  private running = false

  private fpsFrames = 0
  private fpsElapsed = 0
  private fpsValue = 0

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is not available')
    this.canvas = canvas
    this.ctx = ctx
    this.renderer = new Renderer(ctx)
    this.input = new InputManager(canvas)
    this.game = new Game(window.innerWidth, window.innerHeight)

    this.resize()
    window.addEventListener('resize', this.resize)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  start() {
    if (this.running) return
    this.running = true
    this.scheduleFrame()
  }

  stop() {
    this.running = false
    this.cancelFrame()
  }

  destroy() {
    this.stop()
    this.input.destroy()
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  private scheduleFrame() {
    // Reset the clock so time spent stopped or hidden isn't simulated on resume.
    this.lastTime = performance.now()
    this.accumulator = 0
    this.rafId = requestAnimationFrame(this.frame)
  }

  private cancelFrame() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.rafId = null
  }

  private frame = (now: number) => {
    const frameTime = (now - this.lastTime) / 1000
    this.lastTime = now

    const plan = planSteps(this.accumulator, frameTime)
    this.accumulator = plan.accumulator
    for (let i = 0; i < plan.steps; i++) this.update(FIXED_DT)
    this.game.events.length = 0

    this.trackFps(frameTime)
    this.render(plan.alpha)
    this.rafId = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    this.input.read(this.inputState)
    this.game.step(dt, this.inputState)
  }

  private render(alpha: number) {
    this.renderer.draw(this.game, alpha)
    if (import.meta.env.DEV) this.renderer.fps(this.fpsValue)
  }

  private trackFps(frameTime: number) {
    this.fpsFrames++
    this.fpsElapsed += frameTime
    if (this.fpsElapsed >= 0.5) {
      this.fpsValue = this.fpsFrames / this.fpsElapsed
      this.fpsFrames = 0
      this.fpsElapsed = 0
    }
  }

  private resize = () => {
    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight
    this.canvas.width = Math.floor(width * dpr)
    this.canvas.height = Math.floor(height * dpr)
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    // Draw in CSS pixels; the transform maps them onto the device-pixel backing store.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.game.resize(width, height)
    // Resizing clears the canvas, so repaint immediately rather than waiting for the next frame.
    this.render(1)
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.cancelFrame()
    } else if (this.running && this.rafId === null) {
      this.scheduleFrame()
    }
  }
}
