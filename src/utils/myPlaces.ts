import { nearestCity } from '@common/cities';
import type { ChosenLocation, CuisineGroup, UserVenue, Venue } from '@shared-types/index';

export const MY_PLACES_GROUP_ID = 'my-places';

/** Stable per-city key: the nearest curated city id, else rounded coords (unmapped towns). */
export const cityKeyFor = (location: Pick<ChosenLocation, 'latitude' | 'longitude'>): string => {
  const city = nearestCity(location.latitude, location.longitude);
  return city ? city.id : `at:${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
};

/** User venues are pinned (synthetic distance 0 so they sort first). */
const userVenueToVenue = (place: UserVenue): Venue => ({
  id: place.id,
  name: place.name,
  latitude: 0,
  longitude: 0,
  cuisines: [place.familyId],
  distanceMeters: 0,
});

/** The ⭐ My Places group for a city, or null when there are none. Label is the plain default; App translates it at the render edge. */
export const buildMyPlacesGroup = (placesForCity: UserVenue[]): CuisineGroup | null => {
  if (placesForCity.length === 0) {
    return null;
  }
  return {
    id: MY_PLACES_GROUP_ID,
    label: 'My Places',
    emoji: '⭐',
    venues: placesForCity.map(userVenueToVenue),
  };
};
