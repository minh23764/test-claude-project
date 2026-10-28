/** Simulation step in seconds. The game logic always advances in increments of this size. */
export const FIXED_DT = 1 / 60

/** Longest frame we'll simulate; anything longer (tab switch, breakpoint) is clamped to avoid a spiral of death. */
export const MAX_FRAME_TIME = 0.25

export const COLORS = {
  background: '#0b0d12',
  player: '#4fd1ff',
  bullet: '#e6f7ff',
  debugText: '#6b7280',
} as const

export const PLAYER_RADIUS = 14
/** Top speed in px/s. */
export const PLAYER_SPEED = 260
/** How quickly velocity eases toward the input direction (1/s); higher feels snappier. */
export const PLAYER_RESPONSIVENESS = 18

/** Shots per second. */
export const FIRE_RATE = 8
export const BULLET_SPEED = 720
export const BULLET_RADIUS = 4
/** Seconds before a bullet despawns, even if still on screen. */
export const BULLET_LIFETIME = 1.6
export const BULLET_DAMAGE = 1
export const MAX_PROJECTILES = 256
