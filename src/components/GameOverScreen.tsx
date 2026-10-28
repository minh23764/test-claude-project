import type { RunStats } from '../game/Engine.ts'
import { formatTime } from '../format.ts'
import type { BestRecord } from '../storage.ts'

interface Props {
  stats: RunStats
  best: BestRecord
  isNewBest: boolean
  onRestart: () => void
  onMenu: () => void
}

export function GameOverScreen({ stats, best, isNewBest, onRestart, onMenu }: Props) {
  return (
    <div className="overlay">
      <div className="panel">
        <h2 className="title">Game Over</h2>
        {isNewBest && <p className="badge">New best!</p>}
        <dl className="stats">
          <div>
            <dt>Survived</dt>
            <dd>{formatTime(stats.time)}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{stats.score}</dd>
          </div>
          <div>
            <dt>Kills</dt>
            <dd>{stats.kills}</dd>
          </div>
        </dl>
        <button className="button" onClick={onRestart} autoFocus>
          Play again
        </button>
        <button className="button secondary" onClick={onMenu}>
          Menu
        </button>
        <p className="muted small">
          Best: {best.score} pts · {formatTime(best.time)}
        </p>
      </div>
    </div>
  )
}
