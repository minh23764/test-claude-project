import {
  ENEMY_TYPES,
  GRID_CELL_SIZE,
  GRID_MARGIN,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  PLAYER_INVULNERABILITY,
} from './config.ts'
import { createEnemy, type Enemy } from './entities/Enemy.ts'
import { createPlayer, type Player } from './entities/Player.ts'
import { Pool } from './entities/Pool.ts'
import { createProjectile, type Projectile } from './entities/Projectile.ts'
import { clamp } from './math/vec2.ts'
import {
  forEachTouching,
  indexEnemies,
  pushApart,
  resolveBulletHits,
  separateEnemies,
} from './systems/collision.ts'
import { aimPlayer, moveEnemies, movePlayer } from './systems/movement.ts'
import { SpatialGrid } from './systems/SpatialGrid.ts'
import { createSpawner, updateSpawner, type Rng, type Spawner } from './systems/spawner.ts'
import { createWeapon, updateProjectiles, updateWeapon, type Weapon } from './systems/weapon.ts'
import type { GameEvent, InputState } from './types.ts'

/** Events beyond this are dropped if nobody drains the queue (e.g. headless tests). */
const MAX_QUEUED_EVENTS = 256

/**
 * The whole simulation, with no DOM dependencies so it can be stepped headlessly in tests.
 * Engine feeds it input and draws its state.
 */
export class Game {
  width: number
  height: number
  /** Seconds survived this run. */
  time = 0
  score = 0
  kills = 0
  over = false
  player: Player
  weapon: Weapon
  spawner: Spawner
  readonly projectiles = new Pool<Projectile>(createProjectile, MAX_PROJECTILES)
  readonly enemies = new Pool<Enemy>(createEnemy, MAX_ENEMIES)
  /** Events since the consumer last emptied this array. */
  readonly events: GameEvent[] = []
  private readonly grid = new SpatialGrid<Enemy>(GRID_CELL_SIZE)
  private readonly rng: Rng

  constructor(width: number, height: number, rng: Rng = Math.random) {
    this.width = width
    this.height = height
    this.rng = rng
    this.player = createPlayer(width / 2, height / 2)
    this.weapon = createWeapon()
    this.spawner = createSpawner()
    this.grid.resize(width, height, GRID_MARGIN)
  }

  reset() {
    this.time = 0
    this.score = 0
    this.kills = 0
    this.over = false
    this.player = createPlayer(this.width / 2, this.height / 2)
    this.weapon = createWeapon()
    this.spawner = createSpawner()
    this.projectiles.clear()
    this.enemies.clear()
    this.events.length = 0
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.grid.resize(width, height, GRID_MARGIN)
    const p = this.player
    p.x = p.prevX = clamp(p.x, p.radius, width - p.radius)
    p.y = p.prevY = clamp(p.y, p.radius, height - p.radius)
  }

  step(dt: number, input: InputState) {
    if (this.over) return
    this.time += dt
    const p = this.player
    p.prevX = p.x
    p.prevY = p.y
    p.invulnerable = Math.max(0, p.invulnerable - dt)
    movePlayer(p, input.moveX, input.moveY, dt, this.width, this.height)
    if (input.hasPointer) aimPlayer(p, input.pointerX, input.pointerY)

    // Move existing bullets first so newly fired ones start at the muzzle this frame.
    updateProjectiles(this.projectiles, dt, this.width, this.height)
    updateWeapon(this.weapon, p, this.projectiles, dt)

    moveEnemies(this.enemies, p, dt)
    updateSpawner(this.spawner, this.enemies, this.time, dt, this.width, this.height, this.rng)

    indexEnemies(this.enemies, this.grid)
    separateEnemies(this.enemies, this.grid)
    resolveBulletHits(this.projectiles, this.grid, this.onBulletHit)
    forEachTouching(p, this.grid, this.onPlayerTouch)
  }

  private emit(event: GameEvent) {
    if (this.events.length < MAX_QUEUED_EVENTS) this.events.push(event)
  }

  private onBulletHit = (e: Enemy, b: Projectile) => {
    e.hp -= b.damage
    if (e.hp > 0) {
      this.emit({ type: 'hit', x: e.x, y: e.y, enemy: e.type })
      return
    }
    this.score += ENEMY_TYPES[e.type].score
    this.kills++
    this.emit({ type: 'kill', x: e.x, y: e.y, enemy: e.type })
    this.enemies.release(e)
  }

  private onPlayerTouch = (e: Enemy) => {
    const p = this.player
    if (this.over || p.invulnerable > 0) {
      // Immune: shove the enemy out so it doesn't sit inside the player waiting for immunity to end.
      pushApart(e, p)
      return
    }
    // Enemies sacrifice themselves on contact; no score for those.
    p.hp = Math.max(0, p.hp - ENEMY_TYPES[e.type].damage)
    p.invulnerable = PLAYER_INVULNERABILITY
    this.enemies.release(e)
    this.emit({ type: 'hurt', x: p.x, y: p.y })
    if (p.hp === 0) {
      this.over = true
      this.emit({ type: 'gameOver' })
    }
  }
}
