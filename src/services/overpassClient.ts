import {
  CITY_RADIUS_EXPANSION_METERS,
  CITY_RADIUS_METERS,
  MIN_VENUES_BEFORE_EXPAND,
  NEAR_RADIUS_METERS,
  OVERPASS_ENDPOINTS,
  OVERPASS_REQUEST_TIMEOUT_MS,
  OVERPASS_RESULT_CAP,
} from '@common/constants';
import type { ChosenLocation, Venue } from '@shared-types/index';
import { normalizeVenues, type OverpassElement } from '@utils/normalizeVenues';

const QUERY_TIMEOUT_SECONDS = 90;
/** Overpass throttles bursts with a transient 406/429 — a short backoff almost always clears it. */
const MAX_ATTEMPTS_PER_ENDPOINT = 2;
const RETRY_BACKOFF_MS = 1500;

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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

/** One POST to one endpoint, aborted if it stalls so a dead mirror can't hang the UI. */
const fetchElementsOnce = async (
  endpoint: string,
  query: string,
): Promise<OverpassElement[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OVERPASS_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Overpass ${response.status}`);
    }
    const payload = (await response.json()) as { elements?: OverpassElement[] };
    return payload.elements ?? [];
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Each endpoint gets a couple of attempts with a backoff before we fall to the next —
 * Overpass commonly 406/429s the first hit under load and clears on a retry, so the
 * user gets venues on the first click instead of having to ask twice.
 */
const requestElements = async (query: string): Promise<OverpassElement[]> => {
  let lastError: unknown = new Error('Overpass unreachable');
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_ENDPOINT; attempt += 1) {
      try {
        return await fetchElementsOnce(endpoint, query);
      } catch (error) {
        lastError = error;
        if (attempt < MAX_ATTEMPTS_PER_ENDPOINT) {
          await delay(RETRY_BACKOFF_MS);
        }
      }
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
