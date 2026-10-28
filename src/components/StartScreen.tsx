import { formatTime } from '../format.ts'
import type { BestRecord } from '../storage.ts'

interface Props {
  best: BestRecord
  onStart: () => void
}

export function StartScreen({ best, onStart }: Props) {
  return (
    <div className="overlay">
      <div className="panel">
        <h1 className="title">Arena Survival</h1>
        <p className="subtitle">Survive the swarm. Your gun fires on its own.</p>
        <ul className="controls">
          <li>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
            <span>Move</span>
          </li>
          <li>
            <kbd>Mouse</kbd>
            <span>Aim</span>
          </li>
          <li>
            <kbd>Esc</kbd>
            <span>Pause</span>
          </li>
        </ul>
        <button className="button" onClick={onStart} autoFocus>
          Play
        </button>
        {best.score > 0 && (
          <p className="muted">
            Best: {best.score} pts · {formatTime(best.time)}
          </p>
        )}
        <p className="muted small">Keyboard and mouse required.</p>
      </div>
    </div>
  )
}
