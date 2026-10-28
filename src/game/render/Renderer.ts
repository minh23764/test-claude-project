import { COLORS } from '../config.ts'

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  clear(width: number, height: number) {
    this.ctx.fillStyle = COLORS.background
    this.ctx.fillRect(0, 0, width, height)
  }

  circle(x: number, y: number, radius: number, color: string) {
    const { ctx } = this
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  fps(fps: number) {
    const { ctx } = this
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillStyle = COLORS.debugText
    ctx.textBaseline = 'top'
    ctx.fillText(`${Math.round(fps)} fps`, 8, 8)
  }
}
