# Wheel of Dinner — Feature Guide

This folder documents every user-facing feature in the app, one file per area. It
describes **what each feature does and how it behaves**, not how the code is
structured (for architecture and conventions see [CLAUDE.md](../../CLAUDE.md); for
the product requirements see [.claude/requirements.md](../../.claude/requirements.md)).

## The journey at a glance

The app is a single-screen wizard that funnels one person or a whole group toward a
single dinner verdict, then theatrically refuses to let them argue with it.

```
LOCATION ─▶ MODE ─▶ CHOICE ─▶ SELECTION ─▶ WHEEL ─▶ RESULT
   │          │        │           │          │        │
 where     solo or   cuisines   multi-pick   spin    winner +
 are you   company   or named   or vote      it      order links
           (size)    venues                          + history
```

1. **Location** — pick where you are (GPS, city search, or a remembered spot) and
   whether you want **dine-in** (walking distance) or **delivery** (city-wide).
2. **Mode** — eating solo, or as a company of 2–8 whose votes get counted.
3. **Choice** — decide by **cuisine mood** or by **specific restaurant**.
4. **Selection** — solo multi-select, or a shared company vote tally. (Skipped for
   solo + cuisine, which sends every cuisine straight to the wheel.)
5. **Wheel** — the rigged casino wheel. A cuisine win flips into a second wheel of
   that cuisine's restaurants.
6. **Result** — the verdict, confetti, delivery links, and a line in the history.

## Feature index

| Feature | What it covers |
|---------|----------------|
| [Location & venue discovery](location-and-venues.md) | GPS, city search, dine-in vs delivery, live OpenStreetMap venue lookup, caching |
| [Cuisine families](cuisine-families.md) | How raw map data becomes tidy emoji-labelled cuisine groups |
| [Selection & voting](selection-and-voting.md) | Solo multi-select and the company vote tally board |
| [The wheel](the-wheel.md) | Drag-to-flick spin, the casino SPIN button, near-miss drama, the cuisine→restaurant flip |
| [Sound](sound.md) | Every sound is generated live — ticks, spin music, fanfare, sad trombone, fire |
| [Celebration & confetti](celebration-confetti.md) | Landing bursts and the final food-emoji cannonade |
| [Result & ordering](result-and-ordering.md) | The verdict card, Glovo / Bolt Food links, copy-to-clipboard |
| [History — Ledger of Fate](history-ledger.md) | Past verdicts and the burn-it-down animation |
| [My Places](my-places.md) | Save your own favourite restaurants and ride them on the wheel |
| [Languages](internationalization.md) | English and Ukrainian, switchable and remembered |
| [The corner pop](easter-egg.md) | The post-win congratulations cameo |
| [Persistence & offline](persistence.md) | What is stored locally and what still works without a connection |
