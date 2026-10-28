import {
  ENEMY_SPEED_RAMP_MAX,
  ENEMY_SPEED_RAMP_TIME,
  ENEMY_TYPES,
  SPAWN_GRACE,
  SPAWN_INTERVAL_HALF_LIFE,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_START,
  type EnemyTypeId,
} from '../config.ts'
import { initEnemy, type Enemy } from '../entities/Enemy.ts'
import type { Pool } from '../entities/Pool.ts'
import { clamp, type Vec2 } from '../math/vec2.ts'

/** Returns a uniform random number in [0, 1). Injected so tests can be deterministic. */
export type Rng = () => number

export interface Spawner {
  /** Seconds until the next spawn. */
  timer: number
}

export function createSpawner(): Spawner {
  return { timer: SPAWN_GRACE }
}

/** Seconds between spawns after `t` seconds of survival: halves every half-life, floored at the minimum. */
export function spawnInterval(t: number): number {
  return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START * 0.5 ** (t / SPAWN_INTERVAL_HALF_LIFE))
}

export function speedScale(t: number): number {
  return 1 + ENEMY_SPEED_RAMP_MAX * clamp(t / ENEMY_SPEED_RAMP_TIME, 0, 1)
}

/** Relative spawn weights: only grunts at first, runners from 15s, tanks from 30s. */
export function typeWeights(t: number): Record<EnemyTypeId, number> {
  return {
    grunt: 1,
    runner: clamp((t - 15) / 60, 0, 0.8),
    tank: clamp((t - 30) / 90, 0, 0.5),
  }
}

export function pickType(t: number, r: number): EnemyTypeId {
  const weights = typeWeights(t)
  let total = 0
  for (const id in weights) total += weights[id as EnemyTypeId]
  let pick = r * total
  for (const id in weights) {
    pick -= weights[id as EnemyTypeId]
    if (pick < 0) return id as EnemyTypeId
  }
  return 'grunt'
}

/**
 * Places a point just outside one arena edge (0 top, 1 right, 2 bottom, 3 left), `along` (0..1)
 * of the way along it, so a circle of `radius` there is fully off screen.
 */
export function edgePosition(
  edge: number,
  along: number,
  width: number,
  height: number,
  radius: number,
  out: Vec2 = { x: 0, y: 0 },
): Vec2 {
  switch (edge) {
    case 0:
      out.x = along * width
      out.y = -radius
      break
    case 1:
      out.x = width + radius
      out.y = along * height
      break
    case 2:
      out.x = along * width
      out.y = height + radius
      break
    default:
      out.x = -radius
      out.y = along * height
  }
  return out
}

const spawnPos: Vec2 = { x: 0, y: 0 }

/** Spawns enemies from random edges on a timer that shortens as `elapsed` grows. Returns how many spawned. */
export function updateSpawner(
  spawner: Spawner,
  enemies: Pool<Enemy>,
  elapsed: number,
  dt: number,
  width: number,
  height: number,
  rng: Rng,
): number {
  spawner.timer -= dt
  let spawned = 0
  while (spawner.timer <= 0) {
    spawner.timer += spawnInterval(elapsed)
    const e = enemies.acquire()
    if (!e) continue
    const type = pickType(elapsed, rng())
    edgePosition(Math.floor(rng() * 4), rng(), width, height, ENEMY_TYPES[type].radius, spawnPos)
    initEnemy(e, type, spawnPos.x, spawnPos.y, speedScale(elapsed))
    spawned++
  }
  return spawned
}
