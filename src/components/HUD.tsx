import type { HudState } from '../game/Engine.ts'
import { formatTime } from '../format.ts'

export function HUD({ hud }: { hud: HudState }) {
  return (
    <div className="hud">
      <div className="hud-stats">
        <span className="hud-time">{formatTime(hud.time)}</span>
        <span>{hud.score} pts</span>
        <span className="muted">{hud.kills} kills</span>
      </div>
      <div className="hud-hp" aria-label={`Health ${hud.hp} of ${hud.maxHp}`}>
        {Array.from({ length: hud.maxHp }, (_, i) => (
          <span key={i} className={i < hud.hp ? 'pip full' : 'pip'} />
        ))}
      </div>
    </div>
  )
}
