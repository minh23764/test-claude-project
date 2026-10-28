export interface Vec2 {
  x: number
  y: number
}

export function length(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

/** Writes the unit vector of (x, y) into `out`; a zero-length input yields (0, 0). */
export function normalize(x: number, y: number, out: Vec2 = { x: 0, y: 0 }): Vec2 {
  const len = length(x, y)
  if (len < 1e-9) {
    out.x = 0
    out.y = 0
  } else {
    out.x = x / len
    out.y = y / len
  }
  return out
}

export function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  return dx * dx + dy * dy
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
