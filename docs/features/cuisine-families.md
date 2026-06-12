# Cuisine Families

Raw OpenStreetMap cuisine tags are messy — `pizza;italian_pizza`, `coffee_shop`,
`kebab`, blanks. This feature turns that noise into a short, friendly set of
**cuisine families** with an emoji and a clean label, so the wheel reads like a menu
instead of a database dump.

## The families

Nine curated families plus one catch-all (`cuisineFamilies.ts`):

| Emoji | Family | Example raw tags it absorbs |
|-------|--------|------------------------------|
| 🍕 | Pizza & Italian | `pizza`, `italian`, `pasta` |
| 🥡 | Asian | `chinese`, `thai`, `japanese`, `ramen`, `sushi` |
| 🌯 | Kebab & Street | `kebab`, `doner`, `shawarma`, `falafel`, `sandwich` |
| 🍔 | Burgers & Grill | `burger`, `steak`, `bbq`, `chicken` |
| 🍷 | Georgian | `georgian` |
| 🥟 | Ukrainian | `ukrainian`, `varenyky`, `regional` |
| ☕ | Coffee & Sweets | `cafe`, `bakery`, `dessert`, `ice_cream` |
| 🥗 | Healthy | `vegetarian`, `vegan`, `salad`, `juice` |
| 🦞 | Seafood | `fish`, `seafood`, `fish_and_chips` |
| 🎲 | **Surprise Me** | anything untagged or unrecognised |

Every venue lands in exactly one family, decided by its primary cuisine tag. A venue
with no usable tag goes to **Surprise Me** so it still gets a fair spot on the wheel.

## From venues to groups

`deriveCuisineGroups(venues)` does the bucketing:

1. Normalises each venue's cuisine tag (trim, lowercase) and maps it to a family.
2. Groups venues by family, sorting the venues inside each group **nearest-first**.
3. Returns only the families that actually have venues, ordered by **how many
   venues they hold** (busiest cuisine first), then alphabetically.

The result is a list of `CuisineGroup` objects (`{ id, label, emoji, venues }`) — the
exact thing the choice and selection steps render, and the source of every wheel
segment.

## Localised labels

Family labels run through the translation layer, so "Pizza & Italian" / "Піца та
італійська" follow the chosen language. The emoji stays the same in every language.

## Related

- [Location & venues](location-and-venues.md) — where the venues come from.
- [Selection & voting](selection-and-voting.md) — picking and voting on these groups.
- [The wheel](the-wheel.md) — how a chosen cuisine flips to its restaurants.
