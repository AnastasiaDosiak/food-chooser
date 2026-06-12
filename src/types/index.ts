export type PartyMode = 'solo' | 'company';

export type ChoiceType = 'food' | 'restaurant';

export type WheelKind = 'food' | 'restaurant';

export interface WheelSegmentOption {
  id: string;
  label: string;
  color: string;
  /** Vote count in company mode; 1 for everyone in solo mode. */
  weight: number;
}

export interface SpinRecord {
  id: string;
  winnerLabel: string;
  /** Set when the result came via a food-type chain, e.g. "🍣 Sushi". */
  viaLabel?: string;
  /** ISO timestamp; history is stored newest-first. */
  spunAt: string;
  /** Where this verdict was decided, e.g. "Lviv, Lviv Oblast". */
  locationLabel?: string;
}

export type LocationScope = 'near' | 'city';

export interface ChosenLocation {
  label: string;
  latitude: number;
  longitude: number;
  scope: LocationScope;
  /** GPS accuracy in metres — set only when the location came from device geolocation. */
  accuracyMeters?: number;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export interface Venue {
  /** `${osmType}/${osmId}`, e.g. "node/12345". */
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Normalized cuisine-catalog ids (may be empty → Surprise group). */
  cuisines: string[];
  website?: string;
  distanceMeters: number;
}

export interface CuisineGroup {
  id: string;
  label: string;
  emoji: string;
  /** Venues in this group, nearest-first. */
  venues: Venue[];
}

export interface OrderLinks {
  glovoUrl: string;
  boltUrl: string;
  cityLabel: string | null;
}

export interface UserVenue {
  id: string;
  name: string;
  /** Cuisine-family id (from cuisineFamilies.ts), the category the user picked. */
  familyId: string;
  /** City this favorite belongs to (cityKeyFor). */
  cityKey: string;
  addedAt: string;
}
