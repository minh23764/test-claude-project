import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../math/random.ts'
import { Effects } from './effects.ts'

describe('Effects', () => {
  it('bursts particles that slow down and expire', () => {
    const fx = new Effects(mulberry32(1))
    fx.burst(100, 100, '#fff', 12, 300)
    expect(fx.particles.size).toBe(12)

    const p = fx.particles.items.find((i) => i.active)!
    const speed0 = Math.hypot(p.vx, p.vy)
    fx.update(0.1)
    expect(Math.hypot(p.vx, p.vy)).toBeLessThan(speed0)

    for (let i = 0; i < 60; i++) fx.update(1 / 60)
    expect(fx.particles.size).toBe(0)
  })

  it('caps and decays screen shake', () => {
    const fx = new Effects()
    fx.addShake(0.8)
    fx.addShake(0.8)
    expect(fx.shake).toBe(1)
    fx.update(10)
    expect(fx.shake).toBe(0)
  })

  it('clears everything', () => {
    const fx = new Effects()
    fx.burst(0, 0, '#fff', 5, 100)
    fx.addShake(1)
    fx.clear()
    expect(fx.particles.size).toBe(0)
    expect(fx.shake).toBe(0)
  })
})
