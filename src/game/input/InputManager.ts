import type { InputState } from '../types.ts'

// Physical key codes, so movement stays on the same keys with AZERTY and other layouts.
const MOVE_KEYS: Record<string, readonly [number, number]> = {
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
}

/** Tracks held movement keys and the pointer position relative to the canvas. */
export class InputManager {
  private readonly canvas: HTMLCanvasElement
  private readonly keys = new Set<string>()
  private pointerX = 0
  private pointerY = 0
  private hasPointer = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    // Listen on window so aiming keeps working while the cursor is over UI overlays.
    window.addEventListener('mousemove', this.onMouseMove)
  }

  read(out: InputState): InputState {
    let x = 0
    let y = 0
    for (const code of this.keys) {
      const axis = MOVE_KEYS[code]
      x += axis[0]
      y += axis[1]
    }
    out.moveX = x
    out.moveY = y
    out.pointerX = this.pointerX
    out.pointerY = this.pointerY
    out.hasPointer = this.hasPointer
    return out
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    window.removeEventListener('mousemove', this.onMouseMove)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code in MOVE_KEYS) this.keys.add(e.code)
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code)
  }

  // Keyup events are lost while the window is unfocused, so drop everything to avoid stuck keys.
  private onBlur = () => {
    this.keys.clear()
  }

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointerX = e.clientX - rect.left
    this.pointerY = e.clientY - rect.top
    this.hasPointer = true
  }
}
