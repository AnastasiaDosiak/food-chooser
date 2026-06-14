import { describe, expect, it } from 'vitest';

import type { CuisineGroup, UserVenue, Venue } from '@shared-types/index';

import { cityKeyFor, mergeUserPlacesIntoGroups } from './myPlaces';

const place = (id: string, name: string, familyId = 'asian', cityKey = 'lviv'): UserVenue => ({
  id,
  name,
  familyId,
  cityKey,
  addedAt: '2026-06-12T00:00:00Z',
});

const osmVenue = (id: string, distanceMeters: number): Venue => ({
  id,
  name: id,
  latitude: 0,
  longitude: 0,
  cuisines: ['x'],
  distanceMeters,
});

const group = (id: string, label: string, emoji: string, venues: Venue[]): CuisineGroup => ({
  id,
  label,
  emoji,
  venues,
});

describe('cityKeyFor', () => {
  it('uses the nearest curated city id', () => {
    expect(cityKeyFor({ latitude: 49.8419, longitude: 24.0315 })).toBe('lviv');
    expect(cityKeyFor({ latitude: 50.4501, longitude: 30.5234 })).toBe('kyiv');
  });
  it('falls back to rounded coords when no city is near', () => {
    expect(cityKeyFor({ latitude: 48.0, longitude: 32.0 })).toBe('at:48.00,32.00');
  });
});

describe('mergeUserPlacesIntoGroups', () => {
  it('returns the groups unchanged when there are no user places', () => {
    const groups = [group('asian', 'Asian', '🥡', [osmVenue('a', 10)])];
    expect(mergeUserPlacesIntoGroups(groups, [])).toEqual(groups);
  });

  it('merges a user place into its chosen family, pinned first and flagged', () => {
    const groups = [group('asian', 'Asian', '🥡', [osmVenue('a', 10)])];
    const merged = mergeUserPlacesIntoGroups(groups, [place('p1', 'NOA', 'asian')]);
    const asian = merged.find((candidate) => candidate.id === 'asian')!;
    expect(asian.venues.map((venue) => venue.name)).toEqual(['NOA', 'a']);
    expect(asian.venues[0].isUserAdded).toBe(true);
    expect(asian.venues[1].isUserAdded).toBeUndefined();
  });

  it('creates the family group when the chosen family has no nearby venues', () => {
    const merged = mergeUserPlacesIntoGroups([], [place('p1', 'Some Sushi', 'seafood')]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'seafood', emoji: '🦞' });
    expect(merged[0].venues[0]).toMatchObject({ name: 'Some Sushi', isUserAdded: true });
  });

  it('re-ranks so the larger family comes first', () => {
    const groups = [group('asian', 'Asian', '🥡', [osmVenue('a', 1)])];
    const merged = mergeUserPlacesIntoGroups(groups, [
      place('p1', 'B1', 'grill'),
      place('p2', 'B2', 'grill'),
    ]);
    expect(merged[0].id).toBe('grill');
  });
});
