import { describe, expect, it } from 'vitest'
import { ENEMY_TYPES, FIXED_DT, PLAYER_MAX_HP } from './config.ts'
import { initEnemy } from './entities/Enemy.ts'
import { Game } from './Game.ts'
import { mulberry32 } from './math/random.ts'
import type { InputState } from './types.ts'

const idle: InputState = { moveX: 0, moveY: 0, pointerX: 0, pointerY: 0, hasPointer: false }

function run(game: Game, seconds: number, input: InputState = idle) {
  for (let i = 0; i < seconds / FIXED_DT && !game.over; i++) game.step(FIXED_DT, input)
}

describe('Game', () => {
  it('ends the run when a stationary player is overrun', () => {
    const game = new Game(800, 600, mulberry32(1))
    run(game, 300)
    expect(game.over).toBe(true)
    expect(game.player.hp).toBe(0)
    expect(game.events.some((e) => e.type === 'gameOver')).toBe(true)
  })

  it('stops simulating once over', () => {
    const game = new Game(800, 600, mulberry32(1))
    run(game, 300)
    const time = game.time
    game.step(FIXED_DT, idle)
    expect(game.time).toBe(time)
  })

  it('kills enemies and scores while auto-firing', () => {
    const game = new Game(800, 600, mulberry32(2))
    run(game, 20)
    expect(game.kills).toBeGreaterThan(0)
    expect(game.score).toBeGreaterThan(0)
  })

  it('damages the player on contact, then grants immunity', () => {
    const game = new Game(800, 600, mulberry32(3))
    const p = game.player
    // Tanks survive the point-blank auto-fire that would kill a grunt before it touches the player.
    const spawnOnPlayer = () => initEnemy(game.enemies.acquire()!, 'tank', p.x, p.y, 0)
    const damage = ENEMY_TYPES.tank.damage

    spawnOnPlayer()
    game.step(FIXED_DT, idle)
    expect(p.hp).toBe(PLAYER_MAX_HP - damage)
    expect(p.invulnerable).toBeGreaterThan(0)
    expect(game.events.some((e) => e.type === 'hurt')).toBe(true)

    spawnOnPlayer()
    game.step(FIXED_DT, idle)
    expect(p.hp).toBe(PLAYER_MAX_HP - damage)
  })

  it('is deterministic for a given seed', () => {
    const a = new Game(800, 600, mulberry32(9))
    const b = new Game(800, 600, mulberry32(9))
    run(a, 30)
    run(b, 30)
    expect([a.time, a.kills, a.score, a.player.hp]).toEqual([b.time, b.kills, b.score, b.player.hp])
  })

  it('resets to a fresh run', () => {
    const game = new Game(800, 600, mulberry32(4))
    run(game, 300)
    game.reset()
    expect(game.over).toBe(false)
    expect([game.time, game.kills, game.score]).toEqual([0, 0, 0])
    expect(game.player.hp).toBe(PLAYER_MAX_HP)
    expect(game.enemies.size).toBe(0)
    expect(game.projectiles.size).toBe(0)
    expect(game.events).toHaveLength(0)
  })
})
