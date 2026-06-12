# Persistence & Offline

The app has no backend and no accounts. Everything it remembers lives in the browser's
`localStorage`, and a lot of it keeps working with the connection down.

## What's stored locally

| What | Key | Notes |
|------|-----|-------|
| Verdict history | `wheel.history` | Newest-first list of final winners |
| Language choice | `wheel.language` | `en` or `uk` |
| Flick hint seen | `wheel.flickHintSeen` | Hides the "grab & flick" tip after first spin |
| Last location | `wheel.lastLocation` | Powers the "Recent" shortcut |
| Venue cache | `wheel.venues.*` | Per-location, 24-hour time-to-live |
| My Places | `wheel.myPlaces` | Saved favourites, keyed per city |

Storage writes are best-effort: if `localStorage` is unavailable or full, the app keeps
working for the session and simply doesn't persist — it never crashes over storage.

## What needs a connection, and what doesn't

**Needs the network (first time):**

- Fetching a fresh list of nearby restaurants (OpenStreetMap Overpass).
- City / address search and turning GPS into a place name (Photon geocoding).
- Opening the Glovo / Bolt Food links (they're external sites).

**Works offline:**

- Re-visiting a location you've loaded in the last 24 hours (served from cache).
- The entire wheel, sound, confetti, and the corner pop — all generated in the browser.
- History, My Places, language, and every saved preference.

So once a location is cached, a full round — choose, spin, flip, win, celebrate — runs
with the wifi unplugged.

## Related

- [Location & venues](location-and-venues.md) — what populates the venue cache.
- [My Places](my-places.md) and [History](history-ledger.md) — the other stored data.
