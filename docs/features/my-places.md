# My Places

Not every favourite is on the map — the neighbourhood spot, the place that never tagged
its cuisine, the one you always forget the name of. **My Places** lets a diner save their
own restaurants and have them ride the wheel alongside the OpenStreetMap results.

## Managing favourites

A manager modal (`MyPlacesManager`, opened from the location step) lets you:

- pick a city,
- see the places already saved there,
- **add** a place by name and cuisine family,
- **delete** a place.

Saved places live in `localStorage` and are keyed **per city**, so your Lviv list and
your Kyiv list stay separate. Within a city, names are de-duplicated case-insensitively,
and blank names are rejected.

## On the wheel

When you're in a city that has saved places, they appear as their own group — **⭐ My
Places** — at the **top** of the cuisine list (they sort ahead of everything else). From
there they behave like any other option: select them solo, vote for them as a company, or
let them ride a cuisine wheel. Your own spots get exactly the same fair shot as the
algorithm's.

## Related

- [Location & venues](location-and-venues.md) — the city your places attach to.
- [Selection & voting](selection-and-voting.md) — choosing them for the wheel.
- [Persistence & offline](persistence.md) — where favourites are stored.
