# History — Ledger of Fate

A receipt-styled side panel ("Ledger of Fate") records every final verdict the wheel has
handed down, so the table can prove it really did say sushi three times this week.

## What it records

Each final spin appends an entry, **newest first**, showing:

- the time it was decided,
- the winning restaurant (with the cuisine path when reached via the flip, e.g.
  "🍣 Sushi → Yoko Sushi"),
- the location label where it happened, when one is known.

The full list is saved to `localStorage`, so it survives reloads and is there next time
you open the app. Intermediate cuisine results are **not** logged — only final dinners.

On a narrow screen the ledger collapses into a bottom sheet opened by a floating
🏆 button that also shows the running count.

## Burn the ledger 🔥

Clearing the history is an event, not a checkbox. Pressing **burn the ledger** sets the
whole receipt alight:

- A continuous wall of fire (a turbulence-warped heat gradient, not stacked emoji) climbs
  the receipt from the bottom, consuming the paper as it rises, with embers drifting off
  the flame front.
- A synthesised fire **whoosh and crackle** plays along with it (see [Sound](sound.md)).
- When the paper has fully burned away (~1.7 s), the history is cleared and the panel
  returns empty.

## Related

- [Result & ordering](result-and-ordering.md) — what produces an entry.
- [Persistence & offline](persistence.md) — where the ledger is stored.
