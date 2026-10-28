import { Pool, type Poolable } from '../entities/Pool.ts'

export interface Particle extends Poolable {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  radius: number
  life: number
  maxLife: number
  color: string
}

function createParticle(): Particle {
  return {
    active: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    life: 0,
    maxLife: 0,
    color: '',
  }
}

const MAX_PARTICLES = 800
/** Fraction of velocity kept per second; particles coast to a stop. */
const PARTICLE_DRAG = 0.02
/** Seconds for a full-strength shake to settle. */
const SHAKE_DURATION = 0.35
/** Largest shake offset in px. */
export const SHAKE_MAX = 9

/**
 * Purely visual state (particles, screen shake). Kept out of Game so the simulation
 * stays deterministic and testable without caring about cosmetics.
 */
export class Effects {
  readonly particles = new Pool<Particle>(createParticle, MAX_PARTICLES)
  /** 0..1 shake strength, decaying to 0. */
  shake = 0
  private readonly rng: () => number

  constructor(rng: () => number = Math.random) {
    this.rng = rng
  }

  burst(x: number, y: number, color: string, count: number, speed: number) {
    const { rng } = this
    for (let i = 0; i < count; i++) {
      const p = this.particles.acquire()
      if (!p) return
      const angle = rng() * Math.PI * 2
      const v = speed * (0.35 + rng() * 0.65)
      p.x = p.prevX = x
      p.y = p.prevY = y
      p.vx = Math.cos(angle) * v
      p.vy = Math.sin(angle) * v
      p.radius = 1.5 + rng() * 2
      p.maxLife = p.life = 0.3 + rng() * 0.4
      p.color = color
    }
  }

  addShake(amount: number) {
    this.shake = Math.min(1, this.shake + amount)
  }

  update(dt: number) {
    const drag = PARTICLE_DRAG ** dt
    for (const p of this.particles.items) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        this.particles.release(p)
        continue
      }
      p.prevX = p.x
      p.prevY = p.y
      p.vx *= drag
      p.vy *= drag
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    this.shake = Math.max(0, this.shake - dt / SHAKE_DURATION)
  }

  clear() {
    this.particles.clear()
    this.shake = 0
  }
}
