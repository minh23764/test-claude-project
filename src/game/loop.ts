import { FIXED_DT, MAX_FRAME_TIME } from './config.ts'

export interface StepPlan {
  /** Number of fixed updates to run this frame. */
  steps: number
  /** Leftover time carried into the next frame. */
  accumulator: number
  /** Fraction of a step left over, for interpolating rendered positions (0..1). */
  alpha: number
}

/** Fixed-timestep accumulator: turns a variable frame time into a whole number of fixed updates. */
export function planSteps(
  accumulator: number,
  frameTime: number,
  dt: number = FIXED_DT,
  maxFrameTime: number = MAX_FRAME_TIME,
): StepPlan {
  let acc = accumulator + Math.min(Math.max(frameTime, 0), maxFrameTime)
  let steps = 0
  while (acc >= dt) {
    acc -= dt
    steps++
  }
  return { steps, accumulator: acc, alpha: acc / dt }
}
