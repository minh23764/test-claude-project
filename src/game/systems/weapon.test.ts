import { describe, expect, it } from 'vitest'
import { BULLET_SPEED, FIRE_RATE } from '../config.ts'
import { createPlayer } from '../entities/Player.ts'
import { Pool } from '../entities/Pool.ts'
import { createProjectile } from '../entities/Projectile.ts'
import { createWeapon, updateProjectiles, updateWeapon } from './weapon.ts'

const dt = 1 / 60

describe('updateWeapon', () => {
  it('fires FIRE_RATE shots per second with no input', () => {
    const pool = new Pool(createProjectile, 256)
    const weapon = createWeapon()
    const player = createPlayer(0, 0)
    let shots = 0
    for (let i = 0; i < 60; i++) shots += updateWeapon(weapon, player, pool, dt)
    // The first shot fires immediately, so one second yields FIRE_RATE shots (+1 at the boundary).
    expect(shots).toBeGreaterThanOrEqual(FIRE_RATE)
    expect(shots).toBeLessThanOrEqual(FIRE_RATE + 1)
  })

  it('fires along the aim direction from the edge of the player', () => {
    const pool = new Pool(createProjectile, 4)
    const player = createPlayer(100, 100)
    player.aimX = 0
    player.aimY = -1
    updateWeapon(createWeapon(), player, pool, dt)
    const b = pool.items.find((i) => i.active)!
    expect(b.x).toBeCloseTo(100)
    expect(b.y).toBeCloseTo(100 - player.radius)
    expect(b.vx).toBeCloseTo(0)
    expect(b.vy).toBeCloseTo(-BULLET_SPEED)
  })

  it('does not fire when the pool is exhausted', () => {
    const pool = new Pool(createProjectile, 0)
    expect(updateWeapon(createWeapon(), createPlayer(0, 0), pool, dt)).toBe(0)
  })
})

describe('updateProjectiles', () => {
  it('releases projectiles that leave the arena', () => {
    const pool = new Pool(createProjectile, 4)
    const player = createPlayer(10, 10)
    updateWeapon(createWeapon(), player, pool, dt)
    expect(pool.size).toBe(1)
    for (let i = 0; i < 120; i++) updateProjectiles(pool, dt, 200, 200)
    expect(pool.size).toBe(0)
  })
})
