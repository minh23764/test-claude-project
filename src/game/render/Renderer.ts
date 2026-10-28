import { COLORS, ENEMY_TYPE_IDS, ENEMY_TYPES } from '../config.ts'
import type { Game } from '../Game.ts'
import { lerp } from '../math/vec2.ts'
import { SHAKE_MAX, type Effects } from './effects.ts'

const GRID_SPACING = 48
const TAU = Math.PI * 2

interface Drawable {
  active: boolean
  x: number
  y: number
  prevX: number
  prevY: number
  radius: number
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /** Draws the game, interpolating moving bodies `alpha` of the way from their previous to current step. */
  draw(game: Game, effects: Effects, alpha: number) {
    const { ctx } = this
    const { width, height } = game
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    if (effects.shake > 0) {
      // Squaring makes the shake fall off quickly rather than linearly.
      const s = effects.shake * effects.shake * SHAKE_MAX
      ctx.translate((Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s)
    }

    this.grid(width, height)

    this.glow(COLORS.bullet, 8)
    this.batch(game.projectiles.items, alpha, COLORS.bullet)

    // One path per enemy type keeps fill calls constant no matter how many enemies are alive.
    for (const type of ENEMY_TYPE_IDS) {
      const color = ENEMY_TYPES[type].color
      this.glow(color, 10)
      this.batch(game.enemies.items, alpha, color, (e) => e.type === type && e.flash <= 0)
    }
    this.glow(COLORS.flash, 10)
    this.batch(game.enemies.items, alpha, COLORS.flash, (e) => e.flash > 0)

    if (!game.over) this.player(game, alpha)
    ctx.shadowBlur = 0

    this.particles(effects, alpha)
    ctx.restore()
  }

  /** Dev-only frame rate readout, bottom-left so it stays clear of the HUD. */
  fps(fps: number, height: number) {
    const { ctx } = this
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillStyle = COLORS.debugText
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${Math.round(fps)} fps`, 8, height - 8)
  }

  private glow(color: string, blur: number) {
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = blur
  }

  private grid(width: number, height: number) {
    const { ctx } = this
    ctx.beginPath()
    // Extend past the edges so screen shake never reveals a gap.
    for (let x = -GRID_SPACING; x <= width + GRID_SPACING; x += GRID_SPACING) {
      ctx.moveTo(x + 0.5, -GRID_SPACING)
      ctx.lineTo(x + 0.5, height + GRID_SPACING)
    }
    for (let y = -GRID_SPACING; y <= height + GRID_SPACING; y += GRID_SPACING) {
      ctx.moveTo(-GRID_SPACING, y + 0.5)
      ctx.lineTo(width + GRID_SPACING, y + 0.5)
    }
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 1
    ctx.stroke()
  }

  /** Fills every matching active circle as a single path. */
  private batch<T extends Drawable>(
    items: readonly T[],
    alpha: number,
    color: string,
    filter?: (item: T) => boolean,
  ) {
    const { ctx } = this
    ctx.beginPath()
    for (const item of items) {
      if (!item.active || (filter && !filter(item))) continue
      const x = lerp(item.prevX, item.x, alpha)
      const y = lerp(item.prevY, item.y, alpha)
      ctx.moveTo(x + item.radius, y)
      ctx.arc(x, y, item.radius, 0, TAU)
    }
    ctx.fillStyle = color
    ctx.fill()
  }

  private player(game: Game, alpha: number) {
    const { ctx } = this
    const p = game.player
    const x = lerp(p.prevX, p.x, alpha)
    const y = lerp(p.prevY, p.y, alpha)
    // Blink while immune after a hit.
    const blink = p.invulnerable > 0 && Math.floor(p.invulnerable * 12) % 2 === 0
    ctx.globalAlpha = blink ? 0.3 : 1
    this.glow(COLORS.player, 16)

    ctx.beginPath()
    ctx.moveTo(x + p.aimX * p.radius * 0.5, y + p.aimY * p.radius * 0.5)
    ctx.lineTo(x + p.aimX * (p.radius + 10), y + p.aimY * (p.radius + 10))
    ctx.strokeStyle = COLORS.player
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x, y, p.radius, 0, TAU)
    ctx.fillStyle = COLORS.player
    ctx.fill()
    ctx.globalAlpha = 1
  }

  private particles(effects: Effects, alpha: number) {
    const { ctx } = this
    // Additive blending makes overlapping sparks bloom.
    ctx.globalCompositeOperation = 'lighter'
    for (const p of effects.particles.items) {
      if (!p.active) continue
      ctx.globalAlpha = p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(lerp(p.prevX, p.x, alpha), lerp(p.prevY, p.y, alpha), p.radius, 0, TAU)
      ctx.fillStyle = p.color
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}
