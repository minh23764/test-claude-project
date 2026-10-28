# Arena Survival

A minimalist top-down arena survival shooter for the browser. Every entity is a circle. Enemies pour in from all four edges and home in on you; your gun fires automatically at the mouse cursor. Survive as long as you can.

## Controls

| Input   | Action           |
| ------- | ---------------- |
| W A S D | Move             |
| Mouse   | Aim (fires automatically) |
| Esc / P | Pause / resume   |
| M       | Toggle sound     |

## Development

Requires Node 20+.

```sh
npm install
npm run dev        # dev server with hot reload and an FPS counter
npm test           # unit tests (Vitest)
npm run lint       # oxlint
npm run format     # Prettier
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
```

### Stress mode

Open the game with `?stress` (300 enemies) or `?stress=N` (up to 400) to hold the arena at a fixed enemy count with the player immune to damage. Frame stats are exposed on `window.__arenaPerf`. On a headless Chrome run at 400 enemies, update + render averaged about 0.5 ms per frame.

## Architecture

React owns only the app shell; the game runs outside React so it never re-renders per frame.

- `src/App.tsx`, `src/appState.ts` — menu / playing / paused / game-over state machine, best score (localStorage), keyboard shortcuts.
- `src/components/` — `GameCanvas` (creates and drives the engine), `HUD`, and the start, pause and game-over overlays.
- `src/game/Engine.ts` — canvas setup (HiDPI, resize), `requestAnimationFrame` loop with a fixed 60 Hz timestep, input, effects and sound. Pushes HUD updates to React at ~10 Hz.
- `src/game/Game.ts` — the simulation itself. No DOM dependencies, so tests step whole runs headlessly with a seeded RNG.
- `src/game/systems/` — movement, auto-fire weapon, edge spawner with difficulty ramp, spatial-grid collision.
- `src/game/entities/` — player, enemies, projectiles, and the object pool that keeps spawning garbage-free.
- `src/game/render/` — batched canvas drawing, particles and screen shake.
- `src/game/config.ts` — every gameplay tunable (speeds, fire rate, enemy types, spawn curve).

## Deployment

The project is configured for [Vercel](https://vercel.com) via `vercel.json`. Import the GitHub repository in the Vercel dashboard; it builds with `npm run build` and serves `dist/`. Every push to `master` then deploys automatically.
