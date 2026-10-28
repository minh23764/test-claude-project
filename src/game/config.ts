/** Simulation step in seconds. The game logic always advances in increments of this size. */
export const FIXED_DT = 1 / 60

/** Longest frame we'll simulate; anything longer (tab switch, breakpoint) is clamped to avoid a spiral of death. */
export const MAX_FRAME_TIME = 0.25

export const COLORS = {
  background: '#0b0d12',
  player: '#4fd1ff',
  bullet: '#e6f7ff',
  flash: '#ffffff',
  grid: 'rgba(79, 209, 255, 0.05)',
  debugText: '#6b7280',
} as const

export const PLAYER_RADIUS = 14
/** Top speed in px/s. */
export const PLAYER_SPEED = 260
/** How quickly velocity eases toward the input direction (1/s); higher feels snappier. */
export const PLAYER_RESPONSIVENESS = 18
export const PLAYER_MAX_HP = 5
/** Seconds of immunity after taking a hit. */
export const PLAYER_INVULNERABILITY = 1

/** Shots per second. */
export const FIRE_RATE = 8
export const BULLET_SPEED = 720
export const BULLET_RADIUS = 4
/** Seconds before a bullet despawns, even if still on screen. */
export const BULLET_LIFETIME = 1.6
export const BULLET_DAMAGE = 1
export const MAX_PROJECTILES = 256

/** Enemy archetypes. Speed is px/s before the difficulty ramp; damage is HP removed on contact. */
export const ENEMY_TYPES = {
  grunt: { radius: 12, speed: 105, hp: 1, damage: 1, score: 10, color: '#ff5c7a' },
  runner: { radius: 8, speed: 185, hp: 1, damage: 1, score: 15, color: '#ffd166' },
  tank: { radius: 22, speed: 60, hp: 6, damage: 2, score: 50, color: '#b388ff' },
} as const
export type EnemyTypeId = keyof typeof ENEMY_TYPES
export const ENEMY_TYPE_IDS = Object.keys(ENEMY_TYPES) as EnemyTypeId[]
export const MAX_ENEMY_RADIUS = Math.max(...ENEMY_TYPE_IDS.map((id) => ENEMY_TYPES[id].radius))
export const MAX_ENEMIES = 400
/** Seconds an enemy flashes white after a non-lethal hit. */
export const ENEMY_HIT_FLASH = 0.08
/** Fraction of overlap resolved per step when enemies bump into each other (0..1). */
export const SEPARATION_STRENGTH = 0.5
/** Broad-phase cell size; roughly the largest enemy diameter. */
export const GRID_CELL_SIZE = 48
/** How far outside the arena the collision grid extends, covering just-spawned enemies. */
export const GRID_MARGIN = 64

/** Seconds of calm before the first enemy appears. */
export const SPAWN_GRACE = 1
export const SPAWN_INTERVAL_START = 0.9
export const SPAWN_INTERVAL_MIN = 0.1
/** Seconds of survival for the spawn interval to halve. */
export const SPAWN_INTERVAL_HALF_LIFE = 40
/** Enemies move up to this much faster (as a fraction) late in a run. */
export const ENEMY_SPEED_RAMP_MAX = 0.6
/** Seconds of survival to reach the full speed ramp. */
export const ENEMY_SPEED_RAMP_TIME = 240
