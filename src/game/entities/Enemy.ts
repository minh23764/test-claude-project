import { ENEMY_TYPES, type EnemyTypeId } from '../config.ts'
import type { Body } from '../types.ts'
import type { Poolable } from './Pool.ts'

export interface Enemy extends Body, Poolable {
  type: EnemyTypeId
  hp: number
  speed: number
}

export function createEnemy(): Enemy {
  return {
    active: false,
    type: 'grunt',
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    hp: 0,
    speed: 0,
  }
}

/** Initializes a pooled enemy as a fresh instance of `type`. */
export function initEnemy(e: Enemy, type: EnemyTypeId, x: number, y: number, speedScale: number) {
  const spec = ENEMY_TYPES[type]
  e.type = type
  e.x = e.prevX = x
  e.y = e.prevY = y
  e.vx = 0
  e.vy = 0
  e.radius = spec.radius
  e.hp = spec.hp
  e.speed = spec.speed * speedScale
}
