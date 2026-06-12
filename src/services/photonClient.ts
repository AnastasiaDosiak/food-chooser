import { LOCATION_SEARCH_LIMIT, PHOTON_ENDPOINT } from '@common/constants';
import type { LocationSuggestion } from '@shared-types/index';

interface PhotonFeature {
  properties?: {
    countrycode?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    osm_id?: number;
  };
  geometry?: { coordinates?: [number, number] };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

/** The specific part: "Zelena 10a" for a house, else the street or settlement name. */
const primaryLabel = (properties: NonNullable<PhotonFeature['properties']>): string => {
  const street = properties.street ?? properties.name;
  if (properties.housenumber && street) {
    return `${street} ${properties.housenumber}`;
  }
  return properties.name ?? properties.street ?? '';
};

/** Photon features → Ukrainian place suggestions (settlements + addresses), deduped by label. Pure, so it's unit-tested. */
export const parsePhotonFeatures = (response: PhotonResponse): LocationSuggestion[] => {
  const suggestions: LocationSuggestion[] = [];
  const seenLabels = new Set<string>();
  for (const feature of response.features ?? []) {
    const properties = feature.properties;
    const coordinates = feature.geometry?.coordinates;
    if (properties?.countrycode !== 'UA' || !coordinates) {
      continue;
    }
    const primary = primaryLabel(properties);
    if (!primary) {
      continue;
    }
    // District + city disambiguate same-named streets; a settlement carries neither, so it falls to the oblast.
    const area = [properties.district, properties.city].filter((part): part is string => Boolean(part)).join(', ');
    const locality = area || properties.state;
    const label = locality && locality !== primary ? `${primary}, ${locality}` : primary;
    // Photon lists every POI at an address separately — one row per distinct address is enough.
    if (seenLabels.has(label)) {
      continue;
    }
    seenLabels.add(label);
    const [longitude, latitude] = coordinates;
    suggestions.push({
      id: String(properties.osm_id ?? `${latitude},${longitude}`),
      label,
      latitude,
      longitude,
    });
  }
  return suggestions;
};

/** Debounce-friendly search — settlements and street/house addresses; aborts via the passed signal. */
export const searchSettlements = async (
  query: string,
  signal: AbortSignal,
): Promise<LocationSuggestion[]> => {
  const url =
    `${PHOTON_ENDPOINT}?q=${encodeURIComponent(query)}` +
    `&lang=en&limit=${LOCATION_SEARCH_LIMIT}` +
    `&layer=city&layer=district&layer=locality&layer=street&layer=house`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Photon ${response.status}`);
  }
  return parsePhotonFeatures((await response.json()) as PhotonResponse);
};

/** Reverse geocoding shares Photon's host but uses the `/reverse` path. */
const PHOTON_REVERSE_ENDPOINT = PHOTON_ENDPOINT.replace(/\/api\/?$/, '/reverse');

/** GPS fix → a short human place label (e.g. "Halytskyi, Lviv"); null when nothing usable. */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<string | null> => {
  const response = await fetch(
    `${PHOTON_REVERSE_ENDPOINT}?lat=${latitude}&lon=${longitude}&lang=en`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Photon reverse ${response.status}`);
  }
  const properties = ((await response.json()) as PhotonResponse).features?.[0]?.properties;
  if (!properties) {
    return null;
  }
  const primary = properties.district ?? properties.name ?? properties.street;
  const secondary = properties.city ?? properties.state;
  const parts = [...new Set([primary, secondary].filter((part): part is string => Boolean(part)))];
  return parts.length > 0 ? parts.join(', ') : null;
};
