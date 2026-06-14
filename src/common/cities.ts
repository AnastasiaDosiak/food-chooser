import { NEAREST_CITY_MAX_METERS } from '@common/constants';
import { haversineMeters } from '@utils/geo';

export interface UaCity {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  /** Glovo city-area slug: glovoapp.com/en/ua/<slug>/ */
  glovoSlug: string;
  /** Bolt Food id + slug: food.bolt.eu/uk-ua/<id>-<slug>/. Optional — only set when VERIFIED. */
  boltCityId?: number;
  boltSlug?: string;
}

// Only Kyiv's Bolt id (158) is verified; others stay Bolt-less → root fallback (no 404s)
// until someone confirms their food.bolt.eu id. Glovo slugs follow the verified live pattern.
export const UA_CITIES: UaCity[] = [
  {
    id: 'kyiv',
    label: 'Kyiv',
    latitude: 50.4501,
    longitude: 30.5234,
    glovoSlug: 'kyiv-right-bank',
    boltCityId: 158,
    boltSlug: 'kyiv',
  },
  { id: 'lviv', label: 'Lviv', latitude: 49.8397, longitude: 24.0297, glovoSlug: 'lviv' },
  { id: 'kharkiv', label: 'Kharkiv', latitude: 49.9935, longitude: 36.2304, glovoSlug: 'kharkiv' },
  { id: 'odesa', label: 'Odesa', latitude: 46.4825, longitude: 30.7233, glovoSlug: 'odesa' },
  { id: 'dnipro', label: 'Dnipro', latitude: 48.4647, longitude: 35.0462, glovoSlug: 'dnipro' },
  {
    id: 'zaporizhzhia',
    label: 'Zaporizhzhia',
    latitude: 47.8388,
    longitude: 35.1396,
    glovoSlug: 'zaporizhzhia',
  },
  {
    id: 'vinnytsia',
    label: 'Vinnytsia',
    latitude: 49.2331,
    longitude: 28.4682,
    glovoSlug: 'vinnytsia',
  },
  {
    id: 'ivano-frankivsk',
    label: 'Ivano-Frankivsk',
    latitude: 48.9226,
    longitude: 24.7111,
    glovoSlug: 'ivano-frankivsk',
  },
];

/** Nearest curated city within NEAREST_CITY_MAX_METERS, else null (unmapped town). */
export const nearestCity = (latitude: number, longitude: number): UaCity | null => {
  let best: UaCity | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of UA_CITIES) {
    const distance = haversineMeters(latitude, longitude, city.latitude, city.longitude);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = city;
    }
  }
  return best && bestDistance <= NEAREST_CITY_MAX_METERS ? best : null;
};
