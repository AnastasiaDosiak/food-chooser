import { describe, expect, it } from 'vitest';

import type { UserVenue } from '@shared-types/index';

import { buildMyPlacesGroup, cityKeyFor } from './myPlaces';

const place = (id: string, name: string, cityKey: string): UserVenue => ({
  id,
  name,
  familyId: 'asian',
  cityKey,
  addedAt: '2026-06-12T00:00:00Z',
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

describe('buildMyPlacesGroup', () => {
  it('returns null when the city has no places', () => {
    expect(buildMyPlacesGroup([])).toBeNull();
  });
  it('builds a ⭐ group whose venues carry the place names', () => {
    const group = buildMyPlacesGroup([
      place('p1', 'NOA', 'lviv'),
      place('p2', 'Tiki Thai', 'lviv'),
    ]);
    expect(group).toMatchObject({ id: 'my-places', label: 'My Places', emoji: '⭐' });
    expect(group?.venues.map((v) => v.name)).toEqual(['NOA', 'Tiki Thai']);
  });
});
