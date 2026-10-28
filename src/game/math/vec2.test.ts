import { describe, expect, it } from 'vitest'
import { clamp, distSq, length, lerp, normalize } from './vec2.ts'

describe('vec2', () => {
  it('computes length', () => {
    expect(length(3, 4)).toBe(5)
  })

  it('normalizes to unit length', () => {
    const v = normalize(10, 0)
    expect(v).toEqual({ x: 1, y: 0 })
    const d = normalize(1, 1)
    expect(length(d.x, d.y)).toBeCloseTo(1)
  })

  it('normalizes the zero vector to zero instead of NaN', () => {
    expect(normalize(0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('writes into the provided output vector', () => {
    const out = { x: 9, y: 9 }
    expect(normalize(0, -2, out)).toBe(out)
    expect(out).toEqual({ x: 0, y: -1 })
  })

  it('computes squared distance', () => {
    expect(distSq(0, 0, 3, 4)).toBe(25)
  })

  it('clamps and lerps', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
    expect(lerp(0, 10, 0.25)).toBe(2.5)
  })
})
