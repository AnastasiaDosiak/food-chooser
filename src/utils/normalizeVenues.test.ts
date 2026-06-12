import { describe, expect, it } from 'vitest';

import { normalizeVenues, type OverpassElement } from './normalizeVenues';

const origin = { latitude: 49.8419, longitude: 24.0315 };

describe('normalizeVenues', () => {
  it('drops elements without a name or coordinates', () => {
    const elements: OverpassElement[] = [
      {
        type: 'node',
        id: 1,
        lat: 49.842,
        lon: 24.032,
        tags: { name: 'Kryivka', cuisine: 'ukrainian' },
      },
      { type: 'node', id: 2, lat: 49.842, lon: 24.032, tags: { cuisine: 'pizza' } }, // no name
      { type: 'node', id: 3, tags: { name: 'No Coords' } }, // no coords
    ];
    expect(normalizeVenues(elements, origin).map((v) => v.id)).toEqual(['node/1']);
  });

  it('reads way/relation center coordinates and normalizes cuisines + synonyms', () => {
    const elements: OverpassElement[] = [
      {
        type: 'way',
        id: 7,
        center: { lat: 49.85, lon: 24.03 },
        tags: { name: 'Shava Place', cuisine: 'shawarma;grill' },
      },
    ];
    const [venue] = normalizeVenues(elements, origin);
    expect(venue.id).toBe('way/7');
    expect(venue.latitude).toBe(49.85);
    expect(venue.cuisines).toEqual(['shawarma', 'grill']); // raw tokens; families.ts maps them later
  });

  it('keeps unknown cuisines as their own token, sorted nearest-first', () => {
    const elements: OverpassElement[] = [
      {
        type: 'node',
        id: 10,
        lat: 49.9,
        lon: 24.1,
        tags: { name: 'Far', cuisine: 'international' },
      },
      {
        type: 'node',
        id: 11,
        lat: 49.8421,
        lon: 24.0316,
        tags: { name: 'Near', cuisine: 'peruvian' },
      },
    ];
    const venues = normalizeVenues(elements, origin);
    expect(venues.map((v) => v.name)).toEqual(['Near', 'Far']);
    expect(venues[0].cuisines).toEqual(['peruvian']); // unknown token kept verbatim
    expect(venues[1].cuisines).toEqual(['international']); // no blocklist now — families routes it to Other
    expect(venues[1].distanceMeters).toBeGreaterThan(venues[0].distanceMeters);
  });

  it('keeps only the nearest branch of a same-named franchise (case-insensitive)', () => {
    const elements: OverpassElement[] = [
      { type: 'node', id: 20, lat: 49.9, lon: 24.1, tags: { name: 'Celentano', cuisine: 'pizza' } }, // far branch
      {
        type: 'node',
        id: 21,
        lat: 49.8421,
        lon: 24.0316,
        tags: { name: 'Celentano', cuisine: 'pizza' },
      }, // nearest branch
      {
        type: 'node',
        id: 22,
        lat: 49.85,
        lon: 24.04,
        tags: { name: 'CELENTANO', cuisine: 'pizza' },
      }, // case variant
      {
        type: 'node',
        id: 23,
        lat: 49.843,
        lon: 24.032,
        tags: { name: 'Pizza Solo', cuisine: 'pizza' },
      }, // distinct
    ];
    const venues = normalizeVenues(elements, origin);
    expect(venues).toHaveLength(2); // one Celentano + one Pizza Solo
    expect(venues.filter((v) => v.name.toLowerCase() === 'celentano')).toHaveLength(1);
    expect(venues[0].id).toBe('node/21'); // nearest Celentano branch is the one kept
    expect(venues.map((v) => v.id)).toContain('node/23'); // distinct restaurant survives
  });
});
