import { describe, expect, it } from 'vitest';

import { haversineMeters } from './geo';

describe('haversineMeters', () => {
  it('is 0 for identical points', () => {
    expect(haversineMeters(49.84, 24.03, 49.84, 24.03)).toBe(0);
  });

  it('matches a known Lviv-centre span (~1.1 km across Rynok area)', () => {
    // 49.8419,24.0315 → 49.8519,24.0315 is ~1.11 km north.
    expect(haversineMeters(49.8419, 24.0315, 49.8519, 24.0315)).toBeGreaterThan(1080);
    expect(haversineMeters(49.8419, 24.0315, 49.8519, 24.0315)).toBeLessThan(1140);
  });

  it('is symmetric', () => {
    const a = haversineMeters(50.45, 30.52, 49.84, 24.03);
    const b = haversineMeters(49.84, 24.03, 50.45, 30.52);
    expect(a).toBeCloseTo(b, 5);
  });
});
