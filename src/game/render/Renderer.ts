import { COLORS, ENEMY_TYPE_IDS, ENEMY_TYPES } from '../config.ts'
import type { Game } from '../Game.ts'
import { lerp } from '../math/vec2.ts'

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /** Draws the game, interpolating moving bodies `alpha` of the way from their previous to current step. */
  draw(game: Game, alpha: number) {
    const { ctx } = this
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, game.width, game.height)

    // All bullets share a color, so draw them as one path with a single fill.
    ctx.beginPath()
    for (const b of game.projectiles.items) {
      if (!b.active) continue
      const bx = lerp(b.prevX, b.x, alpha)
      const by = lerp(b.prevY, b.y, alpha)
      ctx.moveTo(bx + b.radius, by)
      ctx.arc(bx, by, b.radius, 0, Math.PI * 2)
    }
    ctx.fillStyle = COLORS.bullet
    ctx.fill()

    // One path per enemy type keeps fill calls constant no matter how many enemies are alive.
    for (const type of ENEMY_TYPE_IDS) {
      ctx.beginPath()
      for (const e of game.enemies.items) {
        if (!e.active || e.type !== type) continue
        const ex = lerp(e.prevX, e.x, alpha)
        const ey = lerp(e.prevY, e.y, alpha)
        ctx.moveTo(ex + e.radius, ey)
        ctx.arc(ex, ey, e.radius, 0, Math.PI * 2)
      }
      ctx.fillStyle = ENEMY_TYPES[type].color
      ctx.fill()
    }

    const p = game.player
    const x = lerp(p.prevX, p.x, alpha)
    const y = lerp(p.prevY, p.y, alpha)

    ctx.beginPath()
    ctx.moveTo(x + p.aimX * p.radius * 0.5, y + p.aimY * p.radius * 0.5)
    ctx.lineTo(x + p.aimX * (p.radius + 10), y + p.aimY * (p.radius + 10))
    ctx.strokeStyle = COLORS.player
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.stroke()

    this.circle(x, y, p.radius, COLORS.player)
  }

  fps(fps: number) {
    const { ctx } = this
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillStyle = COLORS.debugText
    ctx.textBaseline = 'top'
    ctx.fillText(`${Math.round(fps)} fps`, 8, 8)
  }

  private circle(x: number, y: number, radius: number, color: string) {
    const { ctx } = this
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
}
