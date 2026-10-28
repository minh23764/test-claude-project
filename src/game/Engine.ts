import { FIXED_DT } from './config.ts'
import { Game } from './Game.ts'
import { InputManager } from './input/InputManager.ts'
import { planSteps } from './loop.ts'
import { Renderer } from './render/Renderer.ts'
import type { InputState } from './types.ts'

export interface HudState {
  time: number
  score: number
  kills: number
  hp: number
  maxHp: number
}

export interface RunStats {
  time: number
  score: number
  kills: number
}

export interface EngineCallbacks {
  /** Called ~10 times a second while playing, and immediately when HP changes. */
  onHud: (hud: HudState) => void
  onGameOver: (stats: RunStats) => void
}

/** Seconds between HUD pushes to React; keeps React out of the per-frame path. */
const HUD_INTERVAL = 0.1

/**
 * Owns the canvas, input listeners and the requestAnimationFrame loop. Lives outside React so
 * the simulation never triggers re-renders; React drives it through newGame/pause/resume and
 * hears back through callbacks.
 */
export class Engine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly renderer: Renderer
  private readonly input: InputManager
  private readonly callbacks: EngineCallbacks
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
  /** Whether the simulation advances. The loop keeps rendering either way, so menus sit over a live canvas. */
  private playing = false
  private hudTimer = 0

  private fpsFrames = 0
  private fpsElapsed = 0
  private fpsValue = 0

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas 2D context is not available')
    this.canvas = canvas
    this.ctx = ctx
    this.callbacks = callbacks
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

  newGame() {
    this.game.reset()
    this.playing = true
    this.accumulator = 0
    this.pushHud()
  }

  pause() {
    this.playing = false
  }

  resume() {
    if (this.game.over) return
    this.playing = true
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
    if (this.playing) {
      for (let i = 0; i < plan.steps; i++) this.update(FIXED_DT)
      this.handleEvents()
      this.hudTimer += frameTime
      if (this.hudTimer >= HUD_INTERVAL) this.pushHud()
    }
    this.game.events.length = 0

    this.trackFps(frameTime)
    // While paused, draw exactly where the last step left things instead of interpolating.
    this.render(this.playing ? plan.alpha : 1)
    this.rafId = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    this.input.read(this.inputState)
    this.game.step(dt, this.inputState)
  }

  private handleEvents() {
    for (const event of this.game.events) {
      if (event.type === 'hurt') {
        this.pushHud()
      } else if (event.type === 'gameOver') {
        this.playing = false
        this.pushHud()
        const { time, score, kills } = this.game
        this.callbacks.onGameOver({ time, score, kills })
      }
    }
  }

  private pushHud() {
    this.hudTimer = 0
    const { time, score, kills, player } = this.game
    this.callbacks.onHud({ time, score, kills, hp: player.hp, maxHp: player.maxHp })
  }

  private render(alpha: number) {
    this.renderer.draw(this.game, alpha)
    if (import.meta.env.DEV) this.renderer.fps(this.fpsValue, this.game.height)
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
