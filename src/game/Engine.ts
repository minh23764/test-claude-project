import { Sound } from './audio/Sound.ts'
import { COLORS, ENEMY_TYPES, FIXED_DT, MAX_ENEMIES, MAX_FRAME_TIME } from './config.ts'
import { Game } from './Game.ts'
import { InputManager } from './input/InputManager.ts'
import { planSteps } from './loop.ts'
import { Effects } from './render/effects.ts'
import { Renderer } from './render/Renderer.ts'
import { spawnFromEdge } from './systems/spawner.ts'
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

interface PerfStats {
  frames: number
  totalFrameMs: number
  /** Time spent in update + render, excluding the browser's own work. */
  totalWorkMs: number
  maxWorkMs: number
  enemies: number
  projectiles: number
}

function readStressParam(): number {
  const value = new URLSearchParams(window.location.search).get('stress')
  if (value === null) return 0
  return Math.min(MAX_ENEMIES, Number(value) || 300)
}

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
  private readonly effects = new Effects()
  private readonly sound = new Sound()

  private rafId: number | null = null
  private lastTime = 0
  private accumulator = 0
  private running = false
  /** Whether the simulation advances. The loop keeps rendering either way, so menus sit over a live canvas. */
  private playing = false
  private hudTimer = 0

  /** Target enemy count when the page is opened with `?stress` or `?stress=N`; 0 = off. */
  private readonly stress = readStressParam()
  private readonly perf: PerfStats = {
    frames: 0,
    totalFrameMs: 0,
    totalWorkMs: 0,
    maxWorkMs: 0,
    enemies: 0,
    projectiles: 0,
  }

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
    this.sound.destroy()
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  setMuted(muted: boolean) {
    this.sound.muted = muted
  }

  newGame() {
    // Always reached from a click or key press, which is what browsers require before audio can start.
    this.sound.unlock()
    this.game.reset()
    this.effects.clear()
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

    const workStart = performance.now()
    const plan = planSteps(this.accumulator, frameTime)
    this.accumulator = plan.accumulator
    if (this.playing) {
      for (let i = 0; i < plan.steps; i++) this.update(FIXED_DT)
      this.handleEvents()
      this.hudTimer += frameTime
      if (this.hudTimer >= HUD_INTERVAL) this.pushHud()
    }
    this.game.events.length = 0
    // Effects freeze with the game when paused, but keep playing out behind the game-over screen.
    if (this.playing || this.game.over) this.effects.update(Math.min(frameTime, MAX_FRAME_TIME))

    this.trackFps(frameTime)
    // While paused, draw exactly where the last step left things instead of interpolating.
    this.render(this.playing ? plan.alpha : 1)
    if (this.stress && this.playing) this.recordPerf(frameTime, performance.now() - workStart)
    this.rafId = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    this.input.read(this.inputState)
    if (this.stress) this.topUpStress()
    this.game.step(dt, this.inputState)
  }

  /** Stress mode: hold the enemy count at the target and keep the player alive, for profiling. */
  private topUpStress() {
    const { game, stress } = this
    game.player.invulnerable = Infinity
    // Late-game mix so all three enemy types are on screen.
    while (game.enemies.size < stress) {
      if (!spawnFromEdge(game.enemies, 120, game.width, game.height, Math.random)) break
    }
  }

  private handleEvents() {
    const { effects, sound } = this
    for (const event of this.game.events) {
      switch (event.type) {
        case 'hit':
          sound.play('hit')
          break
        case 'kill':
          effects.burst(event.x, event.y, ENEMY_TYPES[event.enemy].color, 10, 260)
          sound.play('kill')
          break
        case 'hurt':
          effects.burst(event.x, event.y, COLORS.player, 18, 320)
          effects.addShake(0.7)
          sound.play('hurt')
          this.pushHud()
          break
        case 'gameOver': {
          const { player, time, score, kills } = this.game
          effects.burst(player.x, player.y, COLORS.player, 48, 440)
          effects.addShake(1)
          sound.play('gameOver')
          this.playing = false
          this.pushHud()
          this.callbacks.onGameOver({ time, score, kills })
          break
        }
      }
    }
  }

  private pushHud() {
    this.hudTimer = 0
    const { time, score, kills, player } = this.game
    this.callbacks.onHud({ time, score, kills, hp: player.hp, maxHp: player.maxHp })
  }

  private render(alpha: number) {
    this.renderer.draw(this.game, this.effects, alpha)
    if (import.meta.env.DEV) this.renderer.fps(this.fpsValue, this.game.height)
  }

  /** Exposes rolling frame stats on `window.__arenaPerf` for profiling scripts. */
  private recordPerf(frameTime: number, workMs: number) {
    const perf = this.perf
    perf.frames++
    perf.totalFrameMs += frameTime * 1000
    perf.totalWorkMs += workMs
    perf.maxWorkMs = Math.max(perf.maxWorkMs, workMs)
    perf.enemies = this.game.enemies.size
    perf.projectiles = this.game.projectiles.size
    ;(window as unknown as { __arenaPerf: PerfStats }).__arenaPerf = perf
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
