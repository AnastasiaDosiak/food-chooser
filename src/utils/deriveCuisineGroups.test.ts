import { describe, expect, it } from 'vitest';

import type { Venue } from '@shared-types/index';

import { deriveCuisineGroups } from './deriveCuisineGroups';

const venue = (id: string, cuisines: string[], distanceMeters: number): Venue => ({
  id,
  name: id,
  latitude: 0,
  longitude: 0,
  cuisines,
  distanceMeters,
});

describe('deriveCuisineGroups', () => {
  it('aggregates specific cuisines into families and ranks by venue count', () => {
    const groups = deriveCuisineGroups([
      venue('a', ['thai'], 100),
      venue('b', ['chinese'], 50),
      venue('c', ['sushi'], 10),
      venue('d', ['pizza'], 5),
    ]);
    // thai+chinese+sushi all collapse into one Asian family (3) > italian (1)
    expect(groups.map((g) => g.id)).toEqual(['asian', 'italian']);
    expect(groups[0]).toMatchObject({ label: 'Asian', emoji: '🥡' });
    expect(groups[0].venues.map((v) => v.id)).toEqual(['c', 'b', 'a']); // nearest-first
  });

  it('routes untagged and unmapped venues to the Surprise catch-all', () => {
    const groups = deriveCuisineGroups([venue('x', [], 5), venue('y', ['martian'], 6)]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ id: 'other', label: 'Surprise Me', emoji: '🎲' });
  });
});
