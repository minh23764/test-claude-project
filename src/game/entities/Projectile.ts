import type { Body } from '../types.ts'
import type { Poolable } from './Pool.ts'

export interface Projectile extends Body, Poolable {
  /** Seconds until the projectile expires. */
  life: number
  damage: number
}

export function createProjectile(): Projectile {
  return {
    active: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    life: 0,
    damage: 0,
  }
}
