# 🎰 Wheel of Dinner

> **"Where do we eat?"** — the question that has destroyed more friendships than Monopoly.
> Stop deciding. Start gambling.

Wheel of Dinner is a retro game-show decision wheel for the eternal dinner question. Tell
it where you are, pick a mood or a shortlist of real nearby restaurants, then grab the
wheel and flick. It spins with genuine gambling-industry drama — accelerating ticks,
agonising slow-downs, and a near-miss on every single spin — and hands down a verdict you
are not allowed to argue with.

You don't choose the restaurant. The wheel chooses the restaurant.

## What it does

A single-screen wizard: **location → mode → choice → selection → wheel → result.**

- 📍 **Real venues, near you** — finds actual restaurants from OpenStreetMap around your
  location, with **dine-in** (walking distance) and **delivery** (city-wide) search modes.
- 🐺 **Solo or 👥 company** — go alone, or let a group of 2–8 vote. Votes weight the wheel:
  four of five for sushi makes the sushi slice huge.
- 🍜 **By mood or 📍 by name** — spin cuisines first (a win flips into a second wheel of
  that cuisine's restaurants), or pick specific places from the start.
- 🎡 **Drag-to-flick or smash SPIN** — flick the wheel with real momentum, or hit the
  casino button. Either way the house has already decided; the spin is pure theatre.
- 😱 **Near-miss drama** — every spin stops a hair inside the winner, as if it just barely
  escaped the wrong restaurant. On purpose.
- 🔊 **All sound is generated** — ticks, tempo-tracking spin music, a win fanfare, and a sad
  trombone for weak flicks. No audio files; works with the wifi unplugged.
- 🎉 **Confetti with food** — bursts at every landing and a cannonade on the final verdict,
  with food emoji mixed in.
- 📜 **Ledger of Fate** — past winners are saved and listed. Clear it by literally setting
  the receipt on fire.
- ⭐ **My Places** — save your own favourite restaurants and ride them on the wheel.
- 🚚 **Order it** — the verdict card links straight to Glovo and Bolt Food for your city.
- 🌍 **English & Ukrainian** — switchable and remembered.

## Quickstart

```sh
npm install
npm run dev      # → http://localhost:5173
```

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the Vite dev server with hot-reload (http://localhost:5173) |
| `npm run build` | Type-check (`tsc -b`) and build the production bundle into `dist/` |
| `npm run preview` | Serve the built `dist/` locally to sanity-check a production build |
| `npm test` | Run the Vitest unit suite once |
| `npm run test:watch` | Run Vitest in watch mode while developing |
| `npm run lint` | Lint all `.ts` / `.tsx` with ESLint |
| `npm run lint:fix` | Lint and auto-fix what ESLint can |
| `npm run format` | Format the codebase with Prettier |
| `npm run format:check` | Check formatting without writing (useful in CI) |

### Linting & formatting

- **ESLint** (flat config in `eslint.config.js`) covers TypeScript, React Hooks rules, and
  React Fast Refresh. Run it with `npm run lint`; auto-fix with `npm run lint:fix`.
- **Prettier** (`.prettierrc.json`) owns formatting — single quotes, trailing commas, a
  100-character width. Run `npm run format` to apply it, or `npm run format:check` to verify.
- A good pre-commit habit: `npm run format && npm run lint && npm run build && npm test`.

## Stack

React 19 · TypeScript (strict) · Vite 7 · SCSS (BEM + design tokens) · Vitest ·
canvas-confetti · ESLint · Prettier

No backend, no router, no accounts. Restaurant data is fetched at runtime from the public
**OpenStreetMap Overpass** and **Photon** APIs (no API keys); everything else — the wheel,
sound, confetti, history, favourites, and preferences — runs entirely in the browser and
is stored in `localStorage`. Once a location is cached (24 h), a full round works offline.

## Project structure

```
src/
  main.tsx            # Entry point
  App.tsx             # Screen layout + wizard wiring
  components/         # Wheel, SelectionBoard, ResultOverlay, HistoryPanel,
                      #   LocationStep, MyPlacesManager, LanguageSwitcher, …
  hooks/              # useWheelSpin (spin engine), useCasinoAudio, useVenues,
                      #   useLocationSearch, useMyPlaces, useWizard, …
  services/           # Overpass + Photon API clients
  utils/              # Pure, unit-tested logic (wheel math, geo, segments, …)
  common/             # Constants, cities, cuisine catalog/families
  i18n/               # English + Ukrainian dictionaries and the t() helper
  types/              # Shared TypeScript types
  styles/             # Design tokens + global styles
```

Conventions and architecture notes are in [CLAUDE.md](./CLAUDE.md); the product
requirements are in [.claude/requirements.md](./.claude/requirements.md); the design spec
is in [docs/specs/](./docs/specs/2026-06-11-wheel-of-dinner-design.md).

## Deployment / distribution

Wheel of Dinner is a static single-page app — `npm run build` emits plain HTML, CSS, and
JS into `dist/` with no server component.

1. **Build:** `npm run build`.
2. **Preview locally (optional):** `npm run preview`.
3. **Host the `dist/` folder** on any static host — Netlify, Vercel, Cloudflare Pages,
   GitHub Pages, an S3 bucket, or an nginx/Apache directory.

Notes for distributors:

- **No environment variables or secrets.** There's nothing to configure.
- **No server routing needed.** The app is a single page (no client router), so you don't
  need SPA rewrite rules.
- **Serving from a sub-path?** If the app won't live at the domain root (e.g.
  `example.com/wheel/`), set Vite's [`base`](https://vite.dev/config/shared-options.html#base)
  to that path before building.
- **Runtime network access.** Browsers need outbound HTTPS to OpenStreetMap Overpass and
  Photon for live venue search; those are free community services, so be considerate of
  their usage policies. The Glovo / Bolt Food buttons open external sites.
- **Licensing.** Venue data is © OpenStreetMap contributors (ODbL) — keep the attribution
  shown in the app.

---

*The house always wins. The house just also happens to be hungry.*
