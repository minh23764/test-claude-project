/** Simulation step in seconds. The game logic always advances in increments of this size. */
export const FIXED_DT = 1 / 60

/** Longest frame we'll simulate; anything longer (tab switch, breakpoint) is clamped to avoid a spiral of death. */
export const MAX_FRAME_TIME = 0.25

export const COLORS = {
  background: '#0b0d12',
  player: '#4fd1ff',
  debugText: '#6b7280',
} as const

export const PLAYER_RADIUS = 14
