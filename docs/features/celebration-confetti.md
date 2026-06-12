# Celebration & Confetti

Winning should feel like winning. Confetti fires at two moments, and it always mixes
real food emoji into the colour (`utils/confetti.ts`, built on `canvas-confetti`).

## Landing burst

The instant **any** wheel lands — including the intermediate cuisine wheel in the
flip — a single burst pops from the centre: a spray of the wheel's palette colours plus
a handful of tumbling food emoji (🍕 🍔 🍣 🌯 🍝 🥗 🍜 🌮 🥟 🍷).

## Final cannonade

When the **final** verdict card appears, the celebration escalates: a staggered
multi-burst — five waves alternating from the left and right edges over about a second,
each paired with a centre pop and a shower of food emoji. The card and the cannonade
arrive together.

## Details

- Colours come from the shared wheel palette, so confetti always matches the wheel.
- Food emoji are rasterised once and reused, so repeated bursts stay smooth.
- The cannonade cleans itself up — if you respin or leave the result, pending bursts are
  cancelled.

## Related

- [The wheel](the-wheel.md) — the landings that trigger bursts.
- [Result & ordering](result-and-ordering.md) — the card the cannonade celebrates.
