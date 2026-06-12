import { WHEEL_PALETTE, WHEEL_VENUES_MAX } from '@common/constants';
import type { CuisineGroup, Venue, WheelSegmentOption } from '@shared-types/index';

const pickColor = (index: number) => WHEEL_PALETTE[index % WHEEL_PALETTE.length];

/** Cuisine-group segments; with votes, zero-vote groups drop and weights follow votes. */
export const buildCuisineSegments = (
  groups: CuisineGroup[],
  votesByOptionId?: Record<string, number>,
): WheelSegmentOption[] =>
  groups
    .filter((group) => !votesByOptionId || (votesByOptionId[group.id] ?? 0) > 0)
    .map((group, index) => ({
      id: group.id,
      label: `${group.emoji} ${group.label}`,
      color: pickColor(index),
      weight: votesByOptionId ? votesByOptionId[group.id] : 1,
    }));

/** Voted-venue wheel (company restaurant ballot): keep voted venues, weight by votes. */
export const buildVenueSegments = (
  venues: Venue[],
  votesByOptionId: Record<string, number>,
): WheelSegmentOption[] =>
  venues
    .filter((venue) => (votesByOptionId[venue.id] ?? 0) > 0)
    .map((venue, index) => ({
      id: venue.id,
      label: venue.name,
      color: pickColor(index),
      weight: votesByOptionId[venue.id],
    }));

/** Chained wheel after a cuisine win: the group's nearest venues, equal odds. */
export const buildChainedVenueSegments = (group: CuisineGroup): WheelSegmentOption[] =>
  group.venues.slice(0, WHEEL_VENUES_MAX).map((venue, index) => ({
    id: venue.id,
    label: venue.name,
    color: pickColor(index),
    weight: 1,
  }));
