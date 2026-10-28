import { describe, expect, it } from 'vitest'
import { SPAWN_GRACE, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START } from '../config.ts'
import { createEnemy } from '../entities/Enemy.ts'
import { Pool } from '../entities/Pool.ts'
import { mulberry32 } from '../math/random.ts'
import {
  createSpawner,
  edgePosition,
  pickType,
  spawnInterval,
  speedScale,
  updateSpawner,
} from './spawner.ts'

const W = 800
const H = 600
const seeded = mulberry32

describe('edgePosition', () => {
  it('places circles fully outside each edge', () => {
    const r = 10
    expect(edgePosition(0, 0.5, W, H, r)).toEqual({ x: 400, y: -10 })
    expect(edgePosition(1, 0.5, W, H, r)).toEqual({ x: 810, y: 300 })
    expect(edgePosition(2, 0.5, W, H, r)).toEqual({ x: 400, y: 610 })
    expect(edgePosition(3, 0.5, W, H, r)).toEqual({ x: -10, y: 300 })
  })
})

describe('difficulty ramp', () => {
  it('shortens the spawn interval over time down to a floor', () => {
    expect(spawnInterval(0)).toBe(SPAWN_INTERVAL_START)
    expect(spawnInterval(60)).toBeLessThan(spawnInterval(30))
    expect(spawnInterval(10_000)).toBe(SPAWN_INTERVAL_MIN)
  })

  it('speeds enemies up over time, capped', () => {
    expect(speedScale(0)).toBe(1)
    expect(speedScale(10_000)).toBe(speedScale(100_000))
    expect(speedScale(10_000)).toBeGreaterThan(1)
  })

  it('only spawns grunts early on', () => {
    for (const r of [0, 0.3, 0.99]) expect(pickType(5, r)).toBe('grunt')
  })

  it('mixes in runners and tanks later', () => {
    const rng = seeded(1)
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(pickType(120, rng()))
    expect(seen).toEqual(new Set(['grunt', 'runner', 'tank']))
  })
})

describe('updateSpawner', () => {
  it('waits out the grace period, then spawns off screen from every edge', () => {
    const pool = new Pool(createEnemy, 200)
    const spawner = createSpawner()
    const rng = seeded(42)
    const dt = 1 / 60

    let spawned = 0
    for (let t = 0; t < SPAWN_GRACE - dt; t += dt) {
      spawned += updateSpawner(spawner, pool, t, dt, W, H, rng)
    }
    expect(spawned).toBe(0)

    for (let i = 0; i < 60 * 30; i++) updateSpawner(spawner, pool, 0, dt, W, H, rng)
    const active = pool.items.filter((e) => e.active)
    expect(active.length).toBeGreaterThan(20)

    const edges = new Set<string>()
    for (const e of active) {
      const outside = e.x < 0 || e.x > W || e.y < 0 || e.y > H
      expect(outside).toBe(true)
      edges.add(e.y < 0 ? 'top' : e.y > H ? 'bottom' : e.x < 0 ? 'left' : 'right')
    }
    expect(edges.size).toBe(4)
  })

  it('stops at the enemy cap', () => {
    const pool = new Pool(createEnemy, 5)
    const spawner = createSpawner()
    for (let i = 0; i < 60 * 60; i++) updateSpawner(spawner, pool, 0, 1 / 60, W, H, seeded(7))
    expect(pool.size).toBe(5)
  })
})
