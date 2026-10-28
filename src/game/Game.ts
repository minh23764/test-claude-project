import { createPlayer, type Player } from './entities/Player.ts'
import { clamp } from './math/vec2.ts'
import { aimPlayer, movePlayer } from './systems/movement.ts'
import type { InputState } from './types.ts'

/**
 * The whole simulation, with no DOM dependencies so it can be stepped headlessly in tests.
 * Engine feeds it input and draws its state.
 */
export class Game {
  width: number
  height: number
  player: Player

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.player = createPlayer(width / 2, height / 2)
  }

  reset() {
    this.player = createPlayer(this.width / 2, this.height / 2)
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    const p = this.player
    p.x = p.prevX = clamp(p.x, p.radius, width - p.radius)
    p.y = p.prevY = clamp(p.y, p.radius, height - p.radius)
  }

  step(dt: number, input: InputState) {
    const p = this.player
    p.prevX = p.x
    p.prevY = p.y
    movePlayer(p, input.moveX, input.moveY, dt, this.width, this.height)
    if (input.hasPointer) aimPlayer(p, input.pointerX, input.pointerY)
  }
}
