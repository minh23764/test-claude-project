import { describe, expect, it } from 'vitest'
import { createEnemy, initEnemy, type Enemy } from '../entities/Enemy.ts'
import { Pool } from '../entities/Pool.ts'
import { createProjectile } from '../entities/Projectile.ts'
import {
  circlesOverlap,
  indexEnemies,
  pushApart,
  resolveBulletHits,
  separateEnemies,
} from './collision.ts'
import { SpatialGrid } from './SpatialGrid.ts'

function setup() {
  const enemies = new Pool(createEnemy, 16)
  const projectiles = new Pool(createProjectile, 16)
  const grid = new SpatialGrid<Enemy>(48)
  grid.resize(500, 500, 64)
  const spawn = (x: number, y: number) => {
    const e = enemies.acquire()!
    initEnemy(e, 'grunt', x, y, 1)
    return e
  }
  const fire = (x: number, y: number) => {
    const b = projectiles.acquire()!
    b.x = x
    b.y = y
    b.radius = 4
    return b
  }
  return { enemies, projectiles, grid, spawn, fire }
}

describe('circlesOverlap', () => {
  it('detects overlap and treats exact touching as no overlap', () => {
    expect(circlesOverlap({ x: 0, y: 0, radius: 5 }, { x: 9, y: 0, radius: 5 })).toBe(true)
    expect(circlesOverlap({ x: 0, y: 0, radius: 5 }, { x: 10, y: 0, radius: 5 })).toBe(false)
  })
})

describe('pushApart', () => {
  it('moves a circle out until it just touches', () => {
    const a = { x: 6, y: 0, radius: 5 }
    pushApart(a, { x: 0, y: 0, radius: 5 })
    expect(a.x).toBeCloseTo(10)
  })

  it('separates exactly coincident circles', () => {
    const a = { x: 0, y: 0, radius: 5 }
    pushApart(a, { x: 0, y: 0, radius: 5 })
    expect(a.x).not.toBe(0)
  })
})

describe('resolveBulletHits', () => {
  it('hits an overlapping enemy once and recycles the bullet', () => {
    const { enemies, projectiles, grid, spawn, fire } = setup()
    const e = spawn(100, 100)
    fire(105, 100)
    fire(300, 300)
    indexEnemies(enemies, grid)
    const hits: Enemy[] = []
    resolveBulletHits(projectiles, grid, (enemy) => hits.push(enemy))
    expect(hits).toEqual([e])
    expect(projectiles.size).toBe(1)
  })

  it('skips enemies killed earlier in the same step', () => {
    const { enemies, projectiles, grid, spawn, fire } = setup()
    spawn(100, 100)
    fire(100, 100)
    fire(101, 100)
    indexEnemies(enemies, grid)
    let hits = 0
    resolveBulletHits(projectiles, grid, (enemy) => {
      hits++
      enemies.release(enemy)
    })
    expect(hits).toBe(1)
    expect(projectiles.size).toBe(1)
  })
})

describe('separateEnemies', () => {
  it('spreads stacked enemies apart over a few steps', () => {
    const { enemies, grid, spawn } = setup()
    const a = spawn(200, 200)
    const b = spawn(202, 200)
    for (let i = 0; i < 20; i++) {
      indexEnemies(enemies, grid)
      separateEnemies(enemies, grid)
    }
    expect(circlesOverlap({ ...a, radius: a.radius - 0.5 }, b)).toBe(false)
  })
})
