import {
  CITY_RADIUS_EXPANSION_METERS,
  CITY_RADIUS_METERS,
  MIN_VENUES_BEFORE_EXPAND,
  NEAR_RADIUS_METERS,
  OVERPASS_ENDPOINTS,
  OVERPASS_RESULT_CAP,
} from '@common/constants';
import type { ChosenLocation, Venue } from '@shared-types/index';
import { normalizeVenues, type OverpassElement } from '@utils/normalizeVenues';

const QUERY_TIMEOUT_SECONDS = 90;

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

/** Try each endpoint in turn — primary then mirror is our retry under load. */
const requestElements = async (query: string): Promise<OverpassElement[]> => {
  let lastError: unknown = new Error('Overpass unreachable');
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) {
        throw new Error(`Overpass ${response.status}`);
      }
      const payload = (await response.json()) as { elements?: OverpassElement[] };
      return payload.elements ?? [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Overpass unreachable');
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
