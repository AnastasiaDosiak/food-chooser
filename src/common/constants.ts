export const STORAGE_KEYS = {
  history: 'wheel.history',
  language: 'wheel.language',
  flickHintSeen: 'wheel.flickHintSeen',
  lastLocation: 'wheel.lastLocation',
  venueCachePrefix: 'wheel.venues.',
  myPlaces: 'wheel.myPlaces',
} as const;

export const MIN_OPTIONS_TO_SPIN = 2;
export const MIN_SOLO_RESTAURANT_PICKS = 2;

export const PARTY_SIZE_MIN = 2;
export const PARTY_SIZE_MAX = 8;
export const PARTY_SIZE_DEFAULT = 5;

/** Casino SPIN button — the croupier's throw: always clockwise, long and agonizing. */
export const CASINO_SPIN_REVOLUTIONS_MIN = 5;
export const CASINO_SPIN_REVOLUTIONS_MAX = 8;
export const CASINO_SPIN_DURATION_MS_MIN = 5200;
export const CASINO_SPIN_DURATION_MS_MAX = 6800;

/** Search radii by intent (R1.11): dine-in is a hard 2 km walk; delivery is city-wide. */
export const NEAR_RADIUS_METERS = 2000;
export const CITY_RADIUS_METERS = 7000;
/** Delivery auto-expands through these when a small town is sparse (dine-in never expands). */
export const CITY_RADIUS_EXPANSION_METERS = [15000, 30000] as const;
export const MIN_VENUES_BEFORE_EXPAND = 8;
export const NEAREST_CITY_MAX_METERS = 60000;

/** "By restaurant" shows up to this many nearest venues per family (was a tiny 15). */
export const SELECTION_VENUES_PER_FAMILY = 30;
export const WHEEL_VENUES_MAX = 15;
/** Hard cap on Overpass elements so a city-wide pull can't return an unbounded payload. */
export const OVERPASS_RESULT_CAP = 600;

export const LOCATION_SEARCH_DEBOUNCE_MS = 350;
export const LOCATION_SEARCH_MIN_CHARS = 3;
export const LOCATION_SEARCH_LIMIT = 5;

export const VENUE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Primary then mirror — trying both is our "retry once" under Overpass load. */
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
] as const;
export const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';

/** Retro game-show slice palette — loud, distinct, espresso-outline friendly. */
export const WHEEL_PALETTE = [
  '#ff6b35',
  '#0fb5a3',
  '#ffc53d',
  '#845ec2',
  '#ff4f9a',
  '#4f9df7',
  '#e84855',
  '#7fb069',
  '#ff9f1c',
  '#2a9d8f',
] as const;
