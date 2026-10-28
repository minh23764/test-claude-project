/** Anything that moves and is drawn as a circle. `prevX/prevY` hold the last step's position for render interpolation. */
export interface Body {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  radius: number
}

/** Snapshot of player input for one simulation step, in arena (CSS pixel) coordinates. */
export interface InputState {
  /** Raw movement axis from WASD, each component -1, 0 or 1. */
  moveX: number
  moveY: number
  pointerX: number
  pointerY: number
  /** False until the mouse has moved over the page at least once. */
  hasPointer: boolean
}
