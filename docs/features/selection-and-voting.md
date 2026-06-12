# Selection & Voting

The step where the contenders for the wheel are chosen. One component,
`SelectionBoard`, handles both the solo and company experiences through a `mode` prop.

## Solo — multi-select (`select` mode)

A lone diner taps options on and off like a checklist. Each tap toggles an item
(checkmark on, tap again to remove). The **Finish** button stays disabled until at
least **two** options are picked — fate refuses a one-horse race.

This is used for **solo + by restaurant**. (Solo + by cuisine skips this screen
entirely and sends all cuisines to the wheel with equal odds.)

## Company — vote tally (`tally` mode)

A group votes on one shared screen. Each option has a counter; tapping it adds a vote,
and a small **−** badge appears to take one back. The rules:

- Each option can hold at most **party-size** votes (everyone can back the same option
  once). The board total can exceed party size because options are independent.
- When the whole party has voted (total votes = party size), the board locks so you
  can't over-vote; pull a vote back to change a mind.
- **Finish** needs at least one option with a vote.

A live status line shows progress ("4 of 5 votes cast") with correct singular/plural
wording in both languages.

## How picks become the wheel

Selections are emitted as a `votesByOptionId` map and turned into weighted wheel
segments:

- **Solo** — every picked option gets weight **1**: equal slices.
- **Company** — each option's slice is sized by its **vote count**. Four of five votes
  for sushi makes the sushi slice dominate. Options with **zero** votes never appear on
  the wheel.

Two shortcuts skip the spin when there's nothing to decide:

- **Unanimous vote** (everyone backed a single option) → the wheel is skipped and the
  result is shown instantly with a "you didn't even need me" message.
- A company restaurant ballot that lands on a single voted venue resolves the same way.

## Related

- [Cuisine families](cuisine-families.md) — what the options are.
- [The wheel](the-wheel.md) — what the weights do once it spins.
