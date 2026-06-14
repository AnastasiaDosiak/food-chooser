import { nearestCity } from '@common/cities';
import { familyById } from '@common/cuisineFamilies';
import type { ChosenLocation, CuisineGroup, UserVenue, Venue } from '@shared-types/index';

/** Stable per-city key: the nearest curated city id, else rounded coords (unmapped towns). */
export const cityKeyFor = (location: Pick<ChosenLocation, 'latitude' | 'longitude'>): string => {
  const city = nearestCity(location.latitude, location.longitude);
  return city ? city.id : `at:${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
};

/** User venues are pinned (synthetic distance 0) and flagged so selection lists can mark them. */
const userVenueToVenue = (place: UserVenue): Venue => ({
  id: place.id,
  name: place.name,
  latitude: 0,
  longitude: 0,
  cuisines: [place.familyId],
  distanceMeters: 0,
  isUserAdded: true,
});

/** Fold a city's user venues into their chosen family group (pinned first), creating the family
    when nothing nearby fills it, then re-rank by venue count. */
export const mergeUserPlacesIntoGroups = (
  groups: CuisineGroup[],
  placesForCity: UserVenue[],
): CuisineGroup[] => {
  if (placesForCity.length === 0) {
    return groups;
  }

  const userVenuesByFamily = new Map<string, Venue[]>();
  for (const place of placesForCity) {
    const bucket = userVenuesByFamily.get(place.familyId) ?? [];
    bucket.push(userVenueToVenue(place));
    userVenuesByFamily.set(place.familyId, bucket);
  }

  const merged = groups.map((group) => {
    const mine = userVenuesByFamily.get(group.id);
    if (!mine) {
      return group;
    }
    userVenuesByFamily.delete(group.id);
    return { ...group, venues: [...mine, ...group.venues] };
  });

  // A family the user filled but OSM didn't becomes its own group, so the place still rides.
  for (const [familyId, mine] of userVenuesByFamily) {
    const family = familyById(familyId);
    merged.push({ id: family.id, label: family.label, emoji: family.emoji, venues: mine });
  }

  return merged.sort((a, b) => b.venues.length - a.venues.length || a.label.localeCompare(b.label));
};
