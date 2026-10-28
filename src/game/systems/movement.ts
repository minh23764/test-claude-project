import { PLAYER_RESPONSIVENESS, PLAYER_SPEED } from '../config.ts'
import type { Enemy } from '../entities/Enemy.ts'
import type { Player } from '../entities/Player.ts'
import type { Pool } from '../entities/Pool.ts'
import { clamp, lerp, normalize, type Vec2 } from '../math/vec2.ts'

const dir: Vec2 = { x: 0, y: 0 }

/** Eases the player's velocity toward the WASD direction and keeps the player inside the arena. */
export function movePlayer(
  player: Player,
  moveX: number,
  moveY: number,
  dt: number,
  width: number,
  height: number,
) {
  // Normalizing keeps diagonal movement at the same speed as straight movement.
  normalize(moveX, moveY, dir)
  const t = Math.min(1, PLAYER_RESPONSIVENESS * dt)
  player.vx = lerp(player.vx, dir.x * PLAYER_SPEED, t)
  player.vy = lerp(player.vy, dir.y * PLAYER_SPEED, t)

  const r = player.radius
  const x = clamp(player.x + player.vx * dt, r, width - r)
  const y = clamp(player.y + player.vy * dt, r, height - r)
  // Kill velocity into walls so the player doesn't "stick" while easing away from them.
  if (x !== player.x + player.vx * dt) player.vx = 0
  if (y !== player.y + player.vy * dt) player.vy = 0
  player.x = x
  player.y = y
}

/** Moves every enemy straight toward the player's current position. */
export function moveEnemies(enemies: Pool<Enemy>, player: Player, dt: number) {
  for (const e of enemies.items) {
    if (!e.active) continue
    e.prevX = e.x
    e.prevY = e.y
    e.flash = Math.max(0, e.flash - dt)
    normalize(player.x - e.x, player.y - e.y, dir)
    e.vx = dir.x * e.speed
    e.vy = dir.y * e.speed
    e.x += e.vx * dt
    e.y += e.vy * dt
  }
}

/** Points the weapon at the target; keeps the previous direction when the target is on the player's center. */
export function aimPlayer(player: Player, targetX: number, targetY: number) {
  const dx = targetX - player.x
  const dy = targetY - player.y
  if (dx * dx + dy * dy < 1e-6) return
  normalize(dx, dy, dir)
  player.aimX = dir.x
  player.aimY = dir.y
}
