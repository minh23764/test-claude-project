import { describe, expect, it } from 'vitest'
import { PLAYER_SPEED } from '../config.ts'
import { createEnemy, initEnemy } from '../entities/Enemy.ts'
import { createPlayer } from '../entities/Player.ts'
import { Pool } from '../entities/Pool.ts'
import { length } from '../math/vec2.ts'
import { aimPlayer, moveEnemies, movePlayer } from './movement.ts'

const dt = 1 / 60
const W = 1000
const H = 1000

function runSteps(moveX: number, moveY: number, steps: number) {
  const p = createPlayer(W / 2, H / 2)
  for (let i = 0; i < steps; i++) movePlayer(p, moveX, moveY, dt, W, H)
  return p
}

describe('movePlayer', () => {
  it('accelerates up to player speed', () => {
    const p = runSteps(1, 0, 30)
    expect(p.vx).toBeCloseTo(PLAYER_SPEED, 0)
    expect(p.vy).toBe(0)
  })

  it('does not move faster diagonally', () => {
    const p = runSteps(1, 1, 30)
    expect(length(p.vx, p.vy)).toBeCloseTo(PLAYER_SPEED, 0)
  })

  it('decelerates when no keys are held', () => {
    const p = runSteps(1, 0, 30)
    for (let i = 0; i < 30; i++) movePlayer(p, 0, 0, dt, W, H)
    expect(Math.abs(p.vx)).toBeLessThan(1)
  })

  it('stays inside the arena', () => {
    const p = runSteps(-1, -1, 600)
    expect(p.x).toBe(p.radius)
    expect(p.y).toBe(p.radius)
    expect(p.vx).toBe(0)
    expect(p.vy).toBe(0)
  })
})

describe('moveEnemies', () => {
  it('moves enemies straight toward the player at their speed', () => {
    const pool = new Pool(createEnemy, 1)
    const e = pool.acquire()!
    initEnemy(e, 'grunt', 0, 0, 1)
    const player = createPlayer(300, 400)
    moveEnemies(pool, player, 1)
    expect(e.x).toBeCloseTo((300 / 500) * e.speed)
    expect(e.y).toBeCloseTo((400 / 500) * e.speed)
    expect(e.prevX).toBe(0)
  })

  it('skips inactive enemies', () => {
    const pool = new Pool(createEnemy, 1)
    moveEnemies(pool, createPlayer(100, 100), 1)
    expect(pool.items[0].x).toBe(0)
  })
})

describe('aimPlayer', () => {
  it('aims at the target as a unit vector', () => {
    const p = createPlayer(0, 0)
    aimPlayer(p, 0, 50)
    expect(p.aimX).toBeCloseTo(0)
    expect(p.aimY).toBeCloseTo(1)
  })

  it('keeps the last direction when the target is on the player', () => {
    const p = createPlayer(10, 10)
    aimPlayer(p, 10, 0)
    aimPlayer(p, 10, 10)
    expect(p.aimX).toBeCloseTo(0)
    expect(p.aimY).toBeCloseTo(-1)
  })
})
