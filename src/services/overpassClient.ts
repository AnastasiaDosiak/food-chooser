import {
  CITY_RADIUS_EXPANSION_METERS,
  CITY_RADIUS_METERS,
  MIN_VENUES_BEFORE_EXPAND,
  NEAR_RADIUS_METERS,
  OVERPASS_RESULT_CAP,
} from '@common/constants';
import type { ChosenLocation, Venue } from '@shared-types/index';
import { normalizeVenues, type OverpassElement } from '@utils/normalizeVenues';

const QUERY_TIMEOUT_SECONDS = 90;
/** Generous client timeout — the proxy retries Overpass and its slow mirror server-side. */
const PROXY_TIMEOUT_MS = 45000;
const VENUES_PROXY_PATH = '/api/venues';

/** Single lean query — one combined amenity set, tags+center only (payload discipline). */
export const buildOverpassQuery = (
  latitude: number,
  longitude: number,
  radiusMeters: number,
): string =>
  `[out:json][timeout:${QUERY_TIMEOUT_SECONDS}];` +
  `nwr[amenity~"^(restaurant|fast_food|cafe)$"][name]` +
  `(around:${radiusMeters},${latitude},${longitude});` +
  `out tags center ${OVERPASS_RESULT_CAP};`;

/**
 * Venues come through our own /api/venues proxy, never Overpass directly: a browser hitting
 * Overpass gets CORS-blocked by its rate-limit (406) error responses. The proxy is
 * same-origin, retries the Overpass mirrors server-side, and caches the result.
 */
const requestElements = async (query: string): Promise<OverpassElement[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const response = await fetch(`${VENUES_PROXY_PATH}?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Venues proxy ${response.status}`);
    }
    const payload = (await response.json()) as { elements?: OverpassElement[] };
    return payload.elements ?? [];
  } finally {
    clearTimeout(timeout);
  }
};

/** Dine-in = one hard 2 km query; delivery widens through expansion radii if sparse. */
export const fetchVenues = async (location: ChosenLocation): Promise<Venue[]> => {
  const origin = { latitude: location.latitude, longitude: location.longitude };
  const radii =
    location.scope === 'city'
      ? [CITY_RADIUS_METERS, ...CITY_RADIUS_EXPANSION_METERS]
      : [NEAR_RADIUS_METERS];

  let venues: Venue[] = [];
  for (const radius of radii) {
    const elements = await requestElements(
      buildOverpassQuery(origin.latitude, origin.longitude, radius),
    );
    venues = normalizeVenues(elements, origin);
    if (venues.length >= MIN_VENUES_BEFORE_EXPAND) {
      break;
    }
  }
  return venues;
};
