# The Corner Pop

A small reward hidden in the win. After a **real spin** lands on a final restaurant, a
hand-drawn caricature springs up from the bottom-right corner — Mortal Kombat "Toasty!"
style — bounces, blurts a congratulatory one-liner, and drops back out of view.

## When it fires

Only on a genuinely *spun* final verdict. It deliberately stays away when there was
nothing to decide:

- **Unanimous / lone-option** results (no spin happened) — no pop.
- **Intermediate** cuisine results (the flip card) — no pop.

Respinning produces a fresh final, so it pops again.

## What it does

- Rises ~0.6 s after the result card lands (letting the card have its moment), bounces,
  shows a speech bubble, then retreats after a couple of seconds.
- Says a random line from a roster of boastful one-liners ("a fantastic choice, the
  best", "winner winner, you get dinner", …).
- Plays a synth "boing" with the jump and speaks the line using a built-in browser voice
  — no audio files needed. If a voice clip is placed in `src/assets/` (named
  `trump-voice.*`), it plays that recording instead.
- It's pure flourish: it never covers the result buttons, and reduced-motion settings are
  respected.

## Related

- [Result & ordering](result-and-ordering.md) — the verdict it celebrates.
- [Sound](sound.md) — the boing and the spoken line.
