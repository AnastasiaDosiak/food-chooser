# CLAUDE.md — Wheel of Dinner

## Project quick facts

- **What it is:** "Where do we eat?" decision wheel — a choice wizard (solo/company → food/restaurants → selection or votes) feeding a rigged casino wheel. Intentionally funny: drag-to-flick spin, near-miss drama, generated music, confetti. The house always decides.
- **Stack:** React 19 + Vite 7 + TypeScript SPA. **No backend, no router** — one screen. Persistence is `localStorage` only.
- **How to run:** `npm run dev` → http://localhost:5173. No env vars, no docker, no services.
- **Verify:** `npm run build` (runs `tsc -b && vite build`) and `npm test` (Vitest). Both must pass before a task is done.
- **Demo target:** desktop browser. Responsive/mobile is not a goal yet.
- **Design spec:** `docs/specs/2026-06-11-wheel-of-dinner-design.md` (approved v3). App logic will be refined in further iterations — check the spec's Open Questions before assuming behavior.

## Product requirements (binding — confirmed with the product owner 2026-06-11)

The full register is `.claude/requirements.md` (R1–R7); read it before changing behavior. The non-negotiables:

- **Wizard journey:** mode (solo / company with party size 2–8) → choice (food types / restaurants) → selection (solo multi-select ≥2; company vote tally, votes per option ≤ party size) → wheel → result + persisted history. Solo+food skips selection; a unanimous vote skips the wheel; zero-vote options never ride the wheel.
- **Drag-to-flick only — the illusion of control:** no SPIN button. The wheel follows the cursor 1:1; on release the winner is chosen instantly. The flick controls direction and drama (2–8 revolutions) — **never the outcome**. The animation must launch at the hand's release velocity (no visible snap). Weak flicks: wobble back + sad trombone + taunt copy.
- **Chain rule:** a food-type wheel landing flips (3D) into that type's restaurant wheel; the second spin is final.
- **Confetti is a requirement, not a flourish:** burst at every wheel landing + cannonade on the final result, with food-emoji particles (the 10 food types) mixed into every burst.
- **All sound is generated:** Web Audio synthesis only (ticks, oompah spin loop whose tempo tracks wheel speed, win fanfare, sad trombone). Zero audio files.
- **Look — Retro Game-Show Pop:** cream stage, rotating sunburst rays, orange/yellow/pink/teal accents with espresso outlines, chunky sticker typography. Funny through copy, motion, and sound — visuals stay stylish, never clownish.
- **Offline always:** no runtime network access of any kind; demo must survive wifi down.

## Plans

- Implementation plans live in `.claude/plans/` — one file per user-journey milestone, numbered in implementation order (`NN-slug.md`). Conventions and the plan template: `.claude/plans/README.md`.
- Pick up work from the lowest-numbered plan not marked `Done`. Its **Work log** says exactly where the previous session stopped — resume from there instead of re-deriving.
- **Always record where you leave off:** before stopping work (end of session, interruption, or task switch), tick the plan's completed steps, update its **Status**, and append a Work log entry with the current stage, what was completed, the next action, and any files left mid-change.

## Architecture

- One screen hosting the wizard state machine (`useWizard` hook): `mode → choiceType → selection → wheel → result`. Components: `StepShell` (wizard chrome), `ModeStep`, `ChoiceTypeStep`, `SelectionBoard` (one component, `select` + `tally` modes), `Wheel` (SVG, drag-to-flick, flip transition), `ResultOverlay` (winner + confetti), `HistoryPanel` (past winners, newest first).
- Spin logic lives in hooks, not components: `useWheelSpin` (rAF phase machine `idle → dragging → spinning | rebounding`; winner chosen at flick time, near-miss target computed up front), `useCasinoAudio` (one AudioContext for ticks, spin music, fanfare, sad trombone — Web Audio, no audio files).
- Pure math (segment angles, winner calculation, easing) lives in `src/utils/wheelMath.ts` — keep it free of React so it stays unit-testable.
- State: plain React state in hooks + `localStorage` (keys in `src/common/constants.ts`). No React Query, no context providers beyond what genuinely recurs.

## Project structure

```
src/
  main.tsx              # Entry: StrictMode + createRoot
  App.tsx / App.scss    # Screen layout
  components/           # One folder per component: <Name>/<Name>.tsx + <Name>.scss
  hooks/                # useXxx hooks (spin engine, sounds, localStorage)
  utils/                # Pure functions only — no React imports
  common/               # Constants and enums only — no components
  types/                # Shared TypeScript types (@shared-types)
  styles/               # variables.scss (design tokens), global.scss
  assets/               # Static assets (SVGs), if any — bundled, never CDN
```

- **Path aliases are required for cross-folder imports:** `@components`, `@hooks`, `@utils`, `@common`, `@shared-types`, `@styles`, `@assets`. Relative paths only within the same folder (or component-local files).
- Components get a folder with collocated `.tsx` + `.scss` once they exist; promote feature-local helpers only when reused.

## React conventions

- Functional components and hooks only. React 19 features welcome where they fit.
- Naming: components `PascalCase`; hooks `useXxx`; constants `UPPER_SNAKE_CASE`; booleans `is/has/should/can`; handlers `handleXxx`; callback props `onXxx`. No abbreviations (`btn`, `msg`, `prev`) — full words.
- No magic strings/numbers in logic — add to `src/common/constants.ts` or a typed enum/`as const` object.
- No `any`. Strict mode is on (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`) — use `import type` for types.
- Always clean up in `useEffect`: every `requestAnimationFrame`, timer, listener, and `AudioContext` must be cancelled/closed on unmount. The spin engine is rAF-driven — leaks here are the most likely bug class in this app.
- Derived state is computed during render or `useMemo` — not mirrored into `useState` via effects.

## SCSS conventions

- BEM only: `block__element--modifier`. Each component owns its `.scss` file, no CSS Modules.
- **All colors via CSS custom properties** from `src/styles/variables.scss` (`var(--accent-gold)`, etc.). Never hardcode hex/rgb in component SCSS — add a token first.
- Spacing uses the `--spacing` (4px) base: `calc(var(--spacing) * N)`. Raw `px` only for 1–2px borders.
- z-index only via the `--z-*` tokens.
- `@use`, never `@import` (deprecated in Sass).

## Dependencies

- Keep the dependency list tiny (currently: react, react-dom, canvas-confetti). Every new library must be **MIT-licensed** — check the current version's license before adding.
- **No runtime network access**: no CDN fonts/icons/scripts, no analytics, no remote APIs. The demo must work with wifi down. Dev-time tooling (npm install) is exempt.

## Comments

- Hard cap 1–3 lines, prefer one. Comments explain *why*, never *what* the code does.
- Default to no comment; the spin math is the main place comments earn their keep (angle conventions, easing rationale).
- Do not touch comments on code you did not modify.

## Verification

- After any TS/TSX change: `npm run build` — type inference in the editor is not verification.
- After touching `wheelMath.ts`: `npm test` (Vitest; specs live next to the code as `*.test.ts`).
- Spin feel (easing, near-miss, sound timing) is verified live in the browser — judge it by eye and ear, not just by tests passing.

## Git

- The developer commits and pushes manually. Do not run `git commit` or `git push` unless explicitly asked.
