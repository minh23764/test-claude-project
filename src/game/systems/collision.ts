import { MAX_ENEMY_RADIUS, SEPARATION_STRENGTH } from '../config.ts'
import type { Enemy } from '../entities/Enemy.ts'
import type { Pool } from '../entities/Pool.ts'
import type { Projectile } from '../entities/Projectile.ts'
import type { SpatialGrid } from './SpatialGrid.ts'

interface Circle {
  x: number
  y: number
  radius: number
}

/** Circle–circle overlap using squared distance, avoiding a square root. */
export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const r = a.radius + b.radius
  return dx * dx + dy * dy < r * r
}

/** Pushes `a` out along the line between centers until it just touches `b`. */
export function pushApart(a: Circle, b: Circle, fraction = 1) {
  let dx = a.x - b.x
  let dy = a.y - b.y
  let dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1e-6) {
    // Exactly coincident: pick an arbitrary direction so they can separate.
    dx = 1
    dy = 0
    dist = 1
  }
  const overlap = a.radius + b.radius - dist
  if (overlap <= 0) return
  a.x += (dx / dist) * overlap * fraction
  a.y += (dy / dist) * overlap * fraction
}

const nearby: Enemy[] = []

/** Rebuilds the grid from active enemies. */
export function indexEnemies(enemies: Pool<Enemy>, grid: SpatialGrid<Enemy>) {
  grid.clear()
  for (const e of enemies.items) if (e.active) grid.insert(e)
}

/** Nudges overlapping enemies apart so the horde spreads out instead of collapsing into one circle. */
export function separateEnemies(enemies: Pool<Enemy>, grid: SpatialGrid<Enemy>) {
  for (const e of enemies.items) {
    if (!e.active) continue
    grid.query(e.x, e.y, e.radius + MAX_ENEMY_RADIUS, nearby)
    for (const o of nearby) {
      // Each pair is visited from both sides, so each side moves half the requested amount.
      if (o !== e && circlesOverlap(e, o)) pushApart(e, o, SEPARATION_STRENGTH * 0.5)
    }
  }
}

/**
 * Tests every live bullet against nearby enemies. On the first overlap, calls `onHit` and
 * recycles the bullet, so one bullet damages at most one enemy.
 */
export function resolveBulletHits(
  projectiles: Pool<Projectile>,
  grid: SpatialGrid<Enemy>,
  onHit: (enemy: Enemy, bullet: Projectile) => void,
) {
  for (const b of projectiles.items) {
    if (!b.active) continue
    grid.query(b.x, b.y, b.radius + MAX_ENEMY_RADIUS, nearby)
    for (const e of nearby) {
      // Enemies killed earlier this step stay in the grid until it's rebuilt, so check `active`.
      if (!e.active || !circlesOverlap(b, e)) continue
      onHit(e, b)
      projectiles.release(b)
      break
    }
  }
}

/** Calls `onTouch` for every active enemy overlapping `target`. */
export function forEachTouching(
  target: Circle,
  grid: SpatialGrid<Enemy>,
  onTouch: (enemy: Enemy) => void,
) {
  grid.query(target.x, target.y, target.radius + MAX_ENEMY_RADIUS, nearby)
  for (const e of nearby) if (e.active && circlesOverlap(target, e)) onTouch(e)
}
