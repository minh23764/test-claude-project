import { PLAYER_RADIUS } from '../config.ts'
import type { Body } from '../types.ts'

export interface Player extends Body {
  /** Unit vector the weapon points along. */
  aimX: number
  aimY: number
}

export function createPlayer(x: number, y: number): Player {
  return { x, y, prevX: x, prevY: y, vx: 0, vy: 0, radius: PLAYER_RADIUS, aimX: 1, aimY: 0 }
}
