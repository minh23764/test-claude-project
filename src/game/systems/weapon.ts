import {
  BULLET_DAMAGE,
  BULLET_LIFETIME,
  BULLET_RADIUS,
  BULLET_SPEED,
  FIRE_RATE,
} from '../config.ts'
import type { Player } from '../entities/Player.ts'
import type { Pool } from '../entities/Pool.ts'
import type { Projectile } from '../entities/Projectile.ts'

export interface Weapon {
  /** Seconds until the next shot. */
  cooldown: number
}

export function createWeapon(): Weapon {
  return { cooldown: 0 }
}

/** Fires automatically along the player's aim at FIRE_RATE shots per second. Returns shots fired. */
export function updateWeapon(
  weapon: Weapon,
  player: Player,
  projectiles: Pool<Projectile>,
  dt: number,
): number {
  weapon.cooldown -= dt
  let shots = 0
  // Adding the interval (rather than resetting to it) keeps the fire rate exact regardless of dt.
  while (weapon.cooldown <= 0) {
    weapon.cooldown += 1 / FIRE_RATE
    const b = projectiles.acquire()
    if (!b) continue
    b.x = b.prevX = player.x + player.aimX * player.radius
    b.y = b.prevY = player.y + player.aimY * player.radius
    b.vx = player.aimX * BULLET_SPEED
    b.vy = player.aimY * BULLET_SPEED
    b.radius = BULLET_RADIUS
    b.life = BULLET_LIFETIME
    b.damage = BULLET_DAMAGE
    shots++
  }
  return shots
}

/** Advances projectiles and recycles any that expire or leave the arena. */
export function updateProjectiles(
  projectiles: Pool<Projectile>,
  dt: number,
  width: number,
  height: number,
) {
  for (const b of projectiles.items) {
    if (!b.active) continue
    b.prevX = b.x
    b.prevY = b.y
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.life -= dt
    const m = b.radius
    if (b.life <= 0 || b.x < -m || b.y < -m || b.x > width + m || b.y > height + m) {
      projectiles.release(b)
    }
  }
}
