import { MAX_ENEMIES, MAX_PROJECTILES } from './config.ts'
import { createEnemy, type Enemy } from './entities/Enemy.ts'
import { createPlayer, type Player } from './entities/Player.ts'
import { Pool } from './entities/Pool.ts'
import { createProjectile, type Projectile } from './entities/Projectile.ts'
import { clamp } from './math/vec2.ts'
import { aimPlayer, moveEnemies, movePlayer } from './systems/movement.ts'
import { createSpawner, updateSpawner, type Rng, type Spawner } from './systems/spawner.ts'
import { createWeapon, updateProjectiles, updateWeapon, type Weapon } from './systems/weapon.ts'
import type { InputState } from './types.ts'

/**
 * The whole simulation, with no DOM dependencies so it can be stepped headlessly in tests.
 * Engine feeds it input and draws its state.
 */
export class Game {
  width: number
  height: number
  /** Seconds survived this run. */
  time = 0
  player: Player
  weapon: Weapon
  spawner: Spawner
  readonly projectiles = new Pool<Projectile>(createProjectile, MAX_PROJECTILES)
  readonly enemies = new Pool<Enemy>(createEnemy, MAX_ENEMIES)
  private readonly rng: Rng

  constructor(width: number, height: number, rng: Rng = Math.random) {
    this.width = width
    this.height = height
    this.rng = rng
    this.player = createPlayer(width / 2, height / 2)
    this.weapon = createWeapon()
    this.spawner = createSpawner()
  }

  reset() {
    this.time = 0
    this.player = createPlayer(this.width / 2, this.height / 2)
    this.weapon = createWeapon()
    this.spawner = createSpawner()
    this.projectiles.clear()
    this.enemies.clear()
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    const p = this.player
    p.x = p.prevX = clamp(p.x, p.radius, width - p.radius)
    p.y = p.prevY = clamp(p.y, p.radius, height - p.radius)
  }

  step(dt: number, input: InputState) {
    this.time += dt
    const p = this.player
    p.prevX = p.x
    p.prevY = p.y
    movePlayer(p, input.moveX, input.moveY, dt, this.width, this.height)
    if (input.hasPointer) aimPlayer(p, input.pointerX, input.pointerY)

    // Move existing bullets first so newly fired ones start at the muzzle this frame.
    updateProjectiles(this.projectiles, dt, this.width, this.height)
    updateWeapon(this.weapon, p, this.projectiles, dt)

    moveEnemies(this.enemies, p, dt)
    updateSpawner(this.spawner, this.enemies, this.time, dt, this.width, this.height, this.rng)
  }
}
