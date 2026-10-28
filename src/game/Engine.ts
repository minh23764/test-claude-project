import { COLORS, FIXED_DT, PLAYER_RADIUS } from './config.ts'
import { planSteps } from './loop.ts'
import { Renderer } from './render/Renderer.ts'

/**
 * Owns the canvas and the requestAnimationFrame loop. Lives outside React so the
 * simulation never triggers re-renders; React only creates, starts and destroys it.
 */
export class Engine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly renderer: Renderer

  /** Arena size in CSS pixels. */
  width = 0
  height = 0

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

    this.trackFps(frameTime)
    this.render()
    this.rafId = requestAnimationFrame(this.frame)
  }

  private update(_dt: number) {
    // Game systems plug in here from Phase 2 onward.
  }

  private render() {
    const { renderer, width, height } = this
    renderer.clear(width, height)
    renderer.circle(width / 2, height / 2, PLAYER_RADIUS, COLORS.player)
    if (import.meta.env.DEV) renderer.fps(this.fpsValue)
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
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = Math.floor(this.width * dpr)
    this.canvas.height = Math.floor(this.height * dpr)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    // Draw in CSS pixels; the transform maps them onto the device-pixel backing store.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Resizing clears the canvas, so repaint immediately rather than waiting for the next frame.
    this.render()
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.cancelFrame()
    } else if (this.running && this.rafId === null) {
      this.scheduleFrame()
    }
  }
}
