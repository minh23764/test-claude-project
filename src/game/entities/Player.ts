import { PLAYER_MAX_HP, PLAYER_RADIUS } from '../config.ts'
import type { Body } from '../types.ts'

export interface Player extends Body {
  /** Unit vector the weapon points along. */
  aimX: number
  aimY: number
  hp: number
  maxHp: number
  /** Seconds of remaining immunity after a hit. */
  invulnerable: number
}

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    prevX: x,
    prevY: y,
    vx: 0,
    vy: 0,
    radius: PLAYER_RADIUS,
    aimX: 1,
    aimY: 0,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    invulnerable: 0,
  }
}
