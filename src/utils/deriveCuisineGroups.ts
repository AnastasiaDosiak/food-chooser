import { OTHER_FAMILY, familyById, familyForCuisine } from '@common/cuisineFamilies';
import type { CuisineGroup, Venue } from '@shared-types/index';

/** Venues → family groups (curated families, dynamically populated, count-ranked, no cap). */
export const deriveCuisineGroups = (venues: Venue[]): CuisineGroup[] => {
  const venuesByFamilyId = new Map<string, Venue[]>();
  for (const venue of venues) {
    const familyId = familyForCuisine(venue.cuisines[0]);
    const bucket = venuesByFamilyId.get(familyId) ?? [];
    bucket.push(venue);
    venuesByFamilyId.set(familyId, bucket);
  }

  return [...venuesByFamilyId.entries()]
    .map(([familyId, groupVenues]) => {
      const family = familyId === OTHER_FAMILY.id ? OTHER_FAMILY : familyById(familyId);
      return {
        id: family.id,
        label: family.label,
        emoji: family.emoji,
        venues: [...groupVenues].sort((a, b) => a.distanceMeters - b.distanceMeters),
      };
    })
    .sort((a, b) => b.venues.length - a.venues.length || a.label.localeCompare(b.label));
};
