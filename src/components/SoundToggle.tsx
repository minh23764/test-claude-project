interface Props {
  muted: boolean
  onToggle: () => void
}

export function SoundToggle({ muted, onToggle }: Props) {
  return (
    <button className="link-button" onClick={onToggle} aria-pressed={!muted}>
      Sound: {muted ? 'Off' : 'On'} <kbd>M</kbd>
    </button>
  )
}
