# Wheel of Dinner — Design Spec

**Date:** 2026-06-11 · **Status:** approved v3 (flick + game-show pop) · **Time box:** 80-minute demo build

> Requirements register: `.claude/requirements.md` · Implementation plan: `.claude/plans/2026-06-11-wheel-of-dinner-implementation.md`

## What we're building

A choice wizard that funnels solo eaters and groups into a casino-style decision wheel. Editable journey, dramatic **drag-to-flick** spin, generated music, confetti, history. The gambling drama is the product: the user *feels* in control of the spin — the house decides the outcome.

## User journey

```
Step 1  MODE      Solo 🐺  /  Company 👥 (party size 2–8)
Step 2  CHOICE    By food type 🍜  /  By specific restaurants 📍
Step 3  SELECTION
        solo    + food       → skipped (all food types ride the wheel, equal slices)
        solo    + restaurant → multi-select from mock lists (15 per food type,
                               grouped by food type), minimum 2, then Finish
        company + food       → shared tally board: each food type has a vote
                               counter (max votes per option = party size)
        company + restaurant → same tally board over the restaurant lists
Step 4  WHEEL 🎰
        slice angle ∝ votes (solo/equal = weight 1 each); zero-vote options dropped
        SPIN = drag-to-flick only (no spin button) — see "Interaction" below
        near-miss landing + generated spin music + ticks + confetti burst
        CHAIN RULE: when a FOOD-TYPE wheel lands (e.g. SUSHI), the wheel flips
        (3D flip transition) and reloads with that food type's 15 restaurants,
        equal slices → second flick decides the final restaurant
Step 5  RESULT    Final restaurant + confetti cannonade → appended to history
                  ("🍣 Sushi → Kryivka" when reached via chain)
```

**Edge rules:**
- Unanimous company vote (exactly 1 option voted) → skip the wheel, instant
  "UNANIMOUS — you didn't need me" result.
- Fewer than 2 selections in solo multi-select → Finish disabled.
- Solo mode = party of 1; party-size step is skipped.

## Interaction: drag-to-flick (REQUIRED — illusion of control)

The wheel spins **only** via cursor drag. The user must feel in control; in
reality the outcome is decided the moment they let go.

1. **Grab** — pointer down on the wheel: the wheel follows the cursor 1:1 around
   its center (pointer capture). Segment-boundary crossings tick during the drag
   (mechanical ratchet feel). Cursor: `grab` → `grabbing`.
2. **Flick** — on release, angular velocity is measured from the trailing
   ~100 ms of pointer samples.
3. **The con** — at that instant the winner is secretly picked (weighted random).
   Target angle = flick direction + N full revolutions + near-miss landing inside
   the winner slice. The ease-out curve's launch speed **matches the hand's
   release velocity** (duration = 4·Δθ/v for the quartic ease), so the handoff
   from finger to animation is seamless — it reads as physics, not script.
4. **What the flick controls:** spin direction (clockwise or counter-clockwise)
   and drama length (harder flick → more revolutions, 2–8, and snappier pace).
   **What it never controls:** the outcome.
5. **Weak flick** (below velocity threshold): the wheel wobbles back to where the
   drag started (overshoot ease) + sad-trombone "womp" + rotating taunt copy
   ("Weak wrist. The house is unimpressed."). No spin happens.
6. First-visit hint near the wheel: "👋 grab the wheel & flick it". Hidden after
   the first successful flick.

## Visual direction: Retro Game-Show Pop (chosen over neon-Vegas + cartoon-casino)

Inspiration: 70s–80s TV game shows — The Price is Right, Wheel of Fortune.
Funny, stylish, youthful, colorful.

- **Stage:** cream background (`#fdf3dc` family); animated **sunburst rays**
  slowly rotating behind the wheel.
- **Palette accents:** hot orange `#ff6b35`, sunshine yellow `#ffc53d`,
  bubblegum pink `#ff4f9a`, teal `#0fb5a3`, purple `#845ec2`. Espresso
  `#38241c` for text and chunky cartoon outlines.
- **Typography:** heavy chunky display headings (system stack — `'Arial Black'`
  fallback chain; **no CDN fonts**, demo must survive venue wifi), hard offset
  "sticker" shadows (`4px 4px 0`), uppercase kickers with wide tracking.
- **Components:** cards/buttons with thick espresso borders, rounded corners,
  hard pop shadows; marquee bulbs around the wheel stay (yellow bulbs, frenzy
  blink while spinning).
- **Humor lives in copy** ("THE HOUSE HAS DECIDED", "No appeals."), motion, and
  sound — visuals stay stylish, not clownish.
- All colors via CSS custom properties in `src/styles/variables.scss` — the old
  dark-casino tokens get fully replaced by the game-show set.

## Sound design (REQUIRED — all synthesized via Web Audio, zero audio files)

- **Ticks** — short square-wave blips on every segment-boundary crossing, during
  both drag and spin (throttled ~25 ms).
- **Spin music** — goofy oompah loop (triangle-wave walking bass + offbeat
  hi-hat blip) generated by a lookahead scheduler; **tempo follows wheel speed**
  (fast at launch → agonizing crawl at the end). Starts at flick, stops at
  settle.
- **Win fanfare** — ascending triangle-wave arpeggio at landing.
- **Sad trombone** — descending sawtooth gliss ("womp-womp-womp-wooomp") on a
  too-weak flick.
- AudioContext is created/resumed inside the pointer-down handler (browser
  gesture rule); closed on unmount.

## Celebration (REQUIRED)

- Confetti **burst** the moment any wheel lands (including the intermediate
  food-type wheel in the chain).
- Confetti **cannonade** (multi-burst, staggered) on the final ResultOverlay.
- Confetti colors come from the wheel palette. Library: `canvas-confetti` (MIT,
  already a dependency).
- **It rains food:** every burst mixes in emoji particles of the 10 food types
  (`confetti.shapeFromText`, rasterized once, `flat` so they stay readable).

## Mock data

- 10 food types: burgers, kebabs, salads, wok, pasta, sushi, pizza, ramen,
  traditional UA, georgian.
- 15 restaurants per food type, hardcoded constants (`src/common/restaurants.ts`).
  Flavor: mostly plausible **Lviv** names (real ones where they fit — Kryivka,
  Baczewski, …) with a few puns per category. No network fetches, ever.

## Architecture

- React 19 + Vite 7 + TypeScript SPA; no router — wizard is a state machine in `App`
  (`useWizard` hook): `mode → choiceType → selection → wheel → result`.
- Components: `StepShell` (wizard chrome), `ModeStep`, `ChoiceTypeStep`,
  `SelectionBoard` (one component, two modes: `select` for solo multi-select,
  `tally` for company vote counters), `Wheel` (SVG, weighted slices, drag-to-flick,
  flip transition), `ResultOverlay`, `HistoryPanel` (sidebar).
- Hooks: `useWheelSpin` (rAF state machine with phases
  `idle → dragging → spinning | rebounding`; winner picked at flick; boundary-cross
  callback; per-frame angular-speed callback for music tempo), `useCasinoAudio`
  (one AudioContext: ticks, spin loop, fanfare, sad trombone), `useLocalStorageState`.
- Pure logic in `src/utils/wheelMath.ts`: weighted segment angles, winner-at-angle,
  **directional** near-miss target rotation (CW and CCW), `velocityFromSamples`,
  `flickRevolutions`, `flickDuration` (velocity-matched easing),
  `shortestAngleDelta`, easings. No React imports — Vitest-covered.
  `src/utils/buildSegments.ts` maps voted options → colored segments (drops
  zero-vote options). `src/utils/confetti.ts` wraps canvas-confetti presets.
- Types: `WheelSegmentOption { id, label, color, weight }`, `FoodType`,
  `Restaurant { id, name, foodTypeId }`, `SpinRecord { id, winnerLabel, viaLabel?, spunAt }`,
  `WizardStep`, `WizardResult`.

## Data flow

`App` owns wizard state + history. Selection steps produce weighted options →
`buildSegments` → `Wheel`. The wheel animates the flick and reports the winner →
`App` either chains (food → restaurant wheel of winner's type, flip entrance) or
finalizes: append history, show `ResultOverlay`.

## Error handling

- `localStorage` unavailable → in-memory fallback.
- Web Audio blocked before user gesture → context created/resumed in the
  pointer-down handler.
- Drag of < 2 pointer samples or zero elapsed time → velocity 0 → weak-flick path.
- Vote counters clamped to [0, party size]; Finish needs ≥1 voted option.
- Spin/drag re-entrancy guarded by the phase machine (no flick while spinning).

## Verification

- Vitest on `wheelMath`: weighted angles sum to 360, winner-at-angle correctness,
  near-miss target lands inside the winner segment **in both directions**,
  velocity-from-samples math, flick revolution/duration mapping, `buildSegments`.
- Spin feel (drag 1:1, seamless flick handoff, near-miss), flip transition, music
  tempo tracking, taunt, confetti, persistence → verified live in browser.
- `npm run build` + `npm test` green before done.

## Out of scope

Server/multi-device voting, accounts, odds weighting from history, mobile layout,
double-or-nothing, rigged-mode UI, touch support (desktop demo only).
History stays display-only.

## Open questions (next iterations)

- More logic refinements expected from the team as iterations continue.
