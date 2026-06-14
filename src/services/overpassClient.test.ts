import { describe, expect, it } from 'vitest';

import { buildOverpassQuery } from './overpassClient';

describe('buildOverpassQuery', () => {
  it('queries named eateries with center output at the given radius', () => {
    const query = buildOverpassQuery(49.84, 24.03, 2000);
    expect(query).toContain('around:2000,49.84,24.03');
    expect(query).toContain('restaurant|fast_food|cafe');
    expect(query).toContain('[name]');
    expect(query).toContain('out tags center');
  });

  it('places any radius before the coordinates', () => {
    expect(buildOverpassQuery(50.45, 30.52, 7000)).toContain('around:7000,50.45,30.52');
  });
});
