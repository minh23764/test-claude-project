import { describe, expect, it } from 'vitest'
import { planSteps } from './loop.ts'

const dt = 1 / 60

describe('planSteps', () => {
  it('runs one step for exactly one frame of time', () => {
    const plan = planSteps(0, dt, dt)
    expect(plan.steps).toBe(1)
    expect(plan.accumulator).toBeCloseTo(0)
  })

  it('runs no steps and accumulates time when the frame is shorter than dt', () => {
    const plan = planSteps(0, dt / 2, dt)
    expect(plan.steps).toBe(0)
    expect(plan.accumulator).toBeCloseTo(dt / 2)
    expect(plan.alpha).toBeCloseTo(0.5)
  })

  it('produces ~60 steps per second at 144 Hz', () => {
    let acc = 0
    let total = 0
    for (let i = 0; i < 144; i++) {
      const plan = planSteps(acc, 1 / 144, dt)
      acc = plan.accumulator
      total += plan.steps
    }
    expect(total).toBeGreaterThanOrEqual(59)
    expect(total).toBeLessThanOrEqual(60)
  })

  it('clamps very long frames', () => {
    expect(planSteps(0, 5, dt, 0.25).steps).toBe(15)
  })

  it('ignores negative frame times', () => {
    expect(planSteps(0, -1, dt).steps).toBe(0)
  })
})
