# 🎰 Wheel of Dinner

> **"Where do we eat?"** — the question that has destroyed more friendships than Monopoly.
> Stop deciding. Start gambling.

Wheel of Dinner is a casino-grade decision wheel. Add your restaurant options, hit **SPIN**, and let the house decide where you're eating. The wheel features genuine gambling-industry psychology: accelerating tick sounds, agonizing slowdowns, and near-misses engineered to make the table gasp.

You don't choose the restaurant. The wheel chooses the restaurant.

## Features

- 🎡 **The Wheel** — SVG spinner with weighty, ease-out physics. 5–8 full revolutions of suspense.
- ✏️ **Editable options** — add, rename, and delete candidates. Two-option minimum (you can't gamble with one restaurant).
- 🔊 **Casino sounds** — tick-tick-tick acceleration and agonizing final clicks, synthesized live with Web Audio. No audio files were harmed.
- 😱 **Near-miss drama** — every spin barely escapes the wrong restaurant. This is by design. We learned from the best (slot machines).
- 🎉 **Winner reveal** — confetti included.
- 📜 **History** — a list of past verdicts, so you can prove it really did say "sushi" three times this week.
- 💾 **Persistence** — options and history survive reloads via localStorage. No accounts, no server, no excuses.

## Quickstart

```sh
npm install
npm run dev      # → http://localhost:5173
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest unit tests |

## Stack

React 19 · TypeScript (strict) · Vite 7 · SCSS (BEM + design tokens) · Vitest · canvas-confetti

No backend. No router. No CDN assets — works with the wifi unplugged, which is exactly the kind of reliability you want in a demo.

## Project structure

```
src/
  components/   # Wheel, OptionsPanel, ResultOverlay, HistoryPanel
  hooks/        # useWheelSpin (rAF spin engine), useTickSound (Web Audio)
  utils/        # wheelMath — pure, unit-tested segment/easing math
  common/       # constants (storage keys, limits)
  types/        # shared TS types
  styles/       # design tokens + global styles
```

Conventions, verification rules, and architecture notes live in [CLAUDE.md](./CLAUDE.md). The design spec is in [docs/specs](./docs/specs/2026-06-11-wheel-of-dinner-design.md).

---

*The house always wins. The house just also happens to be hungry.*
