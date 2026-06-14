import { normalizeCuisineToken } from '@common/cuisineCatalog';
import type { Venue } from '@shared-types/index';

import { haversineMeters } from './geo';

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface Origin {
  latitude: number;
  longitude: number;
}

const parseCuisines = (raw: string | undefined): string[] => {
  if (!raw) {
    return [];
  }
  const tokens = raw
    .split(';')
    .map(normalizeCuisineToken)
    .filter((token): token is string => token !== null);
  return [...new Set(tokens)];
};

/** Overpass elements → clean, distance-stamped, nearest-first venues, one slice per franchise. */
export const normalizeVenues = (elements: OverpassElement[], origin: Origin): Venue[] => {
  const venues = elements
    .map((element): Venue | null => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      const name = element.tags?.name;
      if (latitude === undefined || longitude === undefined || !name) {
        return null;
      }
      return {
        id: `${element.type}/${element.id}`,
        name,
        latitude,
        longitude,
        cuisines: parseCuisines(element.tags?.cuisine),
        website: element.tags?.website ?? element.tags?.['contact:website'],
        distanceMeters: haversineMeters(origin.latitude, origin.longitude, latitude, longitude),
      };
    })
    .filter((venue): venue is Venue => venue !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  // Franchises: a chain with many branches gets one wheel slice — keep its nearest.
  const seenNames = new Set<string>();
  return venues.filter((venue) => {
    const nameKey = venue.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) {
      return false;
    }
    seenNames.add(nameKey);
    return true;
  });
};
