import { describe, expect, it } from 'vitest';

import { WHEEL_VENUES_MAX } from '@common/constants';
import type { CuisineGroup, Venue } from '@shared-types/index';

import {
  buildChainedVenueSegments,
  buildCuisineSegments,
  buildVenueSegments,
} from './buildSegments';

const venue = (id: string, distanceMeters: number): Venue => ({
  id,
  name: `Place ${id}`,
  latitude: 0,
  longitude: 0,
  cuisines: [],
  distanceMeters,
});
const group = (id: string, label: string, emoji: string, venues: Venue[]): CuisineGroup => ({
  id,
  label,
  emoji,
  venues,
});

describe('buildCuisineSegments', () => {
  const groups = [
    group('pizza', 'Pizza', '🍕', [venue('p1', 1)]),
    group('sushi', 'Sushi', '🍣', [venue('s1', 2)]),
  ];

  it('one equal-weight segment per group without votes', () => {
    const segments = buildCuisineSegments(groups);
    expect(segments.map((s) => s.id)).toEqual(['pizza', 'sushi']);
    expect(segments[0].label).toBe('🍕 Pizza');
    expect(segments.every((s) => s.weight === 1)).toBe(true);
  });

  it('drops zero-vote groups and follows vote weights', () => {
    const segments = buildCuisineSegments(groups, { pizza: 3, sushi: 0 });
    expect(segments.map((s) => s.id)).toEqual(['pizza']);
    expect(segments[0].weight).toBe(3);
  });
});

describe('buildVenueSegments', () => {
  it('keeps only voted venues with their weights', () => {
    const venues = [venue('a', 1), venue('b', 2), venue('c', 3)];
    const segments = buildVenueSegments(venues, { a: 2, c: 1 });
    expect(segments.map((s) => s.id)).toEqual(['a', 'c']);
    expect(segments.map((s) => s.weight)).toEqual([2, 1]);
    expect(segments[0].label).toBe('Place a');
  });
});

describe('buildChainedVenueSegments', () => {
  it('takes the nearest WHEEL_VENUES_MAX venues at equal odds', () => {
    const venues = Array.from({ length: WHEEL_VENUES_MAX + 5 }, (_, i) => venue(`v${i}`, i));
    const segments = buildChainedVenueSegments(group('pizza', 'Pizza', '🍕', venues));
    expect(segments).toHaveLength(WHEEL_VENUES_MAX);
    expect(segments.every((s) => s.weight === 1)).toBe(true);
    expect(segments[0].id).toBe('v0');
  });
});
