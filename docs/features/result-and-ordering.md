# Result & Ordering

When the wheel stops, `ResultOverlay` delivers the verdict and the next actions.

## The verdict card

A full-screen card announces the winner with a context-aware headline:

- **Spun winner** — "the wheel has spoken" energy, after a real spin.
- **Unanimous / lone option** — a cheeky "you didn't even need me" when there was nothing
  to actually decide.
- **Intermediate (cuisine) result** — shown briefly before the flip into that cuisine's
  restaurants; it auto-continues after ~2.2 s, or you can tap to flip immediately.

If the result was reached through the cuisine→restaurant flip, the card shows the path,
e.g. "🍣 Sushi → Yoko Sushi".

## Order it (delivery links)

For a final restaurant verdict, the card offers quick ways to act on it
(`utils/orderLinks.ts`):

- **Glovo** — opens Glovo for your city.
- **Bolt Food** — opens Bolt Food for your city.
- **Copy name** — copies the restaurant's name to the clipboard (handy for maps or a
  group chat); the button confirms with "Copied!".

City links are built from the curated city list. Away from a known city, the buttons
fall back to each service's home page and the city label is omitted.

## Next moves

- **Tempt fate again** — respin the same wheel for a different verdict.
- **Start over** — back to the very first step for a fresh run.

Every final verdict is also written to the [history](history-ledger.md), and triggers
the [confetti cannonade](celebration-confetti.md) and the [corner pop](easter-egg.md).
