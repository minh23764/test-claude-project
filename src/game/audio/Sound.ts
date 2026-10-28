type Voice = {
  type: OscillatorType
  from: number
  to: number
  duration: number
  gain: number
}

const VOICES = {
  hit: { type: 'square', from: 520, to: 380, duration: 0.04, gain: 0.04 },
  kill: { type: 'triangle', from: 660, to: 140, duration: 0.12, gain: 0.12 },
  hurt: { type: 'sawtooth', from: 160, to: 50, duration: 0.25, gain: 0.18 },
  gameOver: { type: 'triangle', from: 440, to: 55, duration: 0.9, gain: 0.2 },
} satisfies Record<string, Voice>

export type SoundName = keyof typeof VOICES

/** Don't retrigger the same sound faster than this; a wave of kills would otherwise clip. */
const MIN_GAP = 0.03

/** Tiny Web Audio synth: every sound is a single pitch-swept oscillator, so there are no asset files. */
export class Sound {
  muted = false
  private ctx: AudioContext | null = null
  private readonly lastPlayed = new Map<SoundName, number>()

  /**
   * Creates or resumes the AudioContext. Browsers only allow this after the user has
   * interacted with the page, so call it from a flow that follows a click or key press.
   */
  unlock() {
    try {
      this.ctx ??= new AudioContext()
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      this.ctx = null
    }
  }

  play(name: SoundName) {
    const { ctx } = this
    if (this.muted || !ctx || ctx.state !== 'running') return
    const now = ctx.currentTime
    if (now - (this.lastPlayed.get(name) ?? -1) < MIN_GAP) return
    this.lastPlayed.set(name, now)

    const v = VOICES[name]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = v.type
    osc.frequency.setValueAtTime(v.from, now)
    osc.frequency.exponentialRampToValueAtTime(v.to, now + v.duration)
    gain.gain.setValueAtTime(v.gain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + v.duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + v.duration)
  }

  destroy() {
    void this.ctx?.close()
    this.ctx = null
  }
}
