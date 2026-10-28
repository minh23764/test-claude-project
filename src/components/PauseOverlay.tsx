interface Props {
  onResume: () => void
  onQuit: () => void
}

export function PauseOverlay({ onResume, onQuit }: Props) {
  return (
    <div className="overlay">
      <div className="panel">
        <h2 className="title">Paused</h2>
        <button className="button" onClick={onResume} autoFocus>
          Resume
        </button>
        <button className="button secondary" onClick={onQuit}>
          Quit to menu
        </button>
        <p className="muted small">
          Press <kbd>Esc</kbd> to resume
        </p>
      </div>
    </div>
  )
}
