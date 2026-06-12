# Sound

Every sound in the app is **synthesised live in the browser** with the Web Audio API.
There are no audio files anywhere — nothing to download, nothing to host, and it all
works with the connection unplugged. Audio only starts after a user gesture (the first
spin or click), as browsers require.

## The casino soundboard (`useCasinoAudio`)

- **Ticks** — a short square-wave blip on every slice-boundary crossing, during both the
  drag and the spin. Because they fire per boundary, they naturally accelerate as the
  wheel speeds up and space out as it dies down (throttled so they never machine-gun).
- **Spin music** — a goofy oompah loop (a walking triangle-wave bass with an off-beat
  hi-hat) scheduled while the wheel turns. Its **tempo tracks the wheel's speed**: frantic
  at launch, an agonising crawl at the finish. It starts on the flick and stops the moment
  the wheel lands.
- **Win fanfare** — a bright ascending arpeggio when the wheel settles on a winner.
- **Sad trombone** — the classic descending "womp-womp-womp-wooomp" when a flick is too
  weak to spin.
- **Fire fwoosh** — a filtered-noise whoosh with random crackles, played when the history
  ledger is set alight (see [History](history-ledger.md)).

## The corner-pop voice (`useToastySound`)

The post-win cameo gets its own little audio: a synth "boing" rising with the jump, plus
a spoken one-liner. The line uses the browser's built-in speech voices (a deep local
voice, chosen for effect) so it needs no network. If a voice clip is dropped into
`src/assets/`, it plays that instead. See [The corner pop](easter-egg.md).

## Lifecycle

Each audio module owns one `AudioContext`, created on the first gesture and **closed when
its component unmounts**, so nothing leaks between rounds.

## Related

- [The wheel](the-wheel.md) — what triggers ticks, music, and the trombone.
- [History — Ledger of Fate](history-ledger.md) — the fire sound.
