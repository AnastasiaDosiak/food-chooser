# Location & Venue Discovery

The first step of the wizard. It establishes **where** the diner is and pulls a live
list of real nearby restaurants from OpenStreetMap, so every later step works with
actual venues rather than a hardcoded list.

## Choosing a location

`LocationStep` offers three ways to set a location, all funneling into a single
`ChosenLocation` (`{ label, latitude, longitude, scope, accuracyMeters? }`):

- **Use my location (GPS)** — asks the browser for device geolocation (8-second
  timeout, low-accuracy mode). The coordinates are reverse-geocoded into a readable
  label like "Halytskyi, Lviv". If the lookup fails, a generic label is used so the
  flow never stalls. Permission-denied and unsupported-browser cases show a friendly
  message.
- **Search a city or address** — a debounced autocomplete (`useLocationSearch`):
  starts after **3 characters**, waits **350 ms**, and returns up to **5** Ukrainian
  results. In-flight searches are cancelled when you keep typing.
- **Recent** — one tap restores the last location you confirmed (remembered across
  reloads).

## Dine-in vs delivery (search scope)

A toggle on the location step decides how far the venue search reaches:

- **Dine-in (`near`)** — a hard **2 km** walking radius. It never expands; if you're
  somewhere quiet, you get the short list that's genuinely nearby.
- **Delivery (`city`)** — starts at **7 km** and automatically widens through **15 km**
  and **30 km** if fewer than **8** venues are found, so small towns still fill a wheel.

## Where the venues come from

Venue data is fetched live from the **OpenStreetMap Overpass API** (`useVenues` →
`overpassClient`):

- Searches OSM amenities tagged `restaurant`, `fast_food`, and `cafe` within the
  chosen radius, capped at **600** results.
- Two endpoints are tried (a primary and a mirror) so a single overloaded server
  doesn't break the demo.
- City names and address search use the separate **Photon** geocoding service.

Raw results are cleaned up by `normalizeVenues`: it extracts the name, coordinates,
cuisines, and website; stamps each venue with its **distance** from you; sorts
**nearest-first**; and collapses chains so you don't see the same franchise five
times (only the closest branch survives).

## Caching (and what happens offline)

Each successful lookup is cached in `localStorage` for **24 hours**, keyed by
rounded coordinates plus scope. Returning to the same place loads instantly and works
even with the connection down. A fresh location with no cache needs the network; if
the request fails, the choice step shows the error with a **Retry** button.

## Cities the app knows by name

Eight Ukrainian cities are curated for delivery links and labels: **Kyiv, Lviv,
Kharkiv, Odesa, Dnipro, Zaporizhzhia, Vinnytsia, Ivano-Frankivsk**. `nearestCity`
matches your coordinates to the closest one within **60 km**; beyond that you're
treated as an unmapped spot (the wheel still works — only the named-city extras drop).

## Related

- [Cuisine families](cuisine-families.md) — how these venues get grouped.
- [Persistence & offline](persistence.md) — the cache keys and TTLs.
- [Result & ordering](result-and-ordering.md) — how the city drives delivery links.
