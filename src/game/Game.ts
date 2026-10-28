import { MAX_PROJECTILES } from './config.ts'
import { createPlayer, type Player } from './entities/Player.ts'
import { Pool } from './entities/Pool.ts'
import { createProjectile, type Projectile } from './entities/Projectile.ts'
import { clamp } from './math/vec2.ts'
import { aimPlayer, movePlayer } from './systems/movement.ts'
import { createWeapon, updateProjectiles, updateWeapon, type Weapon } from './systems/weapon.ts'
import type { InputState } from './types.ts'

/**
 * The whole simulation, with no DOM dependencies so it can be stepped headlessly in tests.
 * Engine feeds it input and draws its state.
 */
export class Game {
  width: number
  height: number
  player: Player
  weapon: Weapon
  readonly projectiles = new Pool<Projectile>(createProjectile, MAX_PROJECTILES)

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.player = createPlayer(width / 2, height / 2)
    this.weapon = createWeapon()
  }

  reset() {
    this.player = createPlayer(this.width / 2, this.height / 2)
    this.weapon = createWeapon()
    this.projectiles.clear()
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    const p = this.player
    p.x = p.prevX = clamp(p.x, p.radius, width - p.radius)
    p.y = p.prevY = clamp(p.y, p.radius, height - p.radius)
  }

  step(dt: number, input: InputState) {
    const p = this.player
    p.prevX = p.x
    p.prevY = p.y
    movePlayer(p, input.moveX, input.moveY, dt, this.width, this.height)
    if (input.hasPointer) aimPlayer(p, input.pointerX, input.pointerY)

    // Move existing bullets first so newly fired ones start at the muzzle this frame.
    updateProjectiles(this.projectiles, dt, this.width, this.height)
    updateWeapon(this.weapon, p, this.projectiles, dt)
  }
}
