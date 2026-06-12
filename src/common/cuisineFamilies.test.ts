import { describe, expect, it } from 'vitest';

import { OTHER_FAMILY, familyById, familyForCuisine } from './cuisineFamilies';

describe('familyForCuisine', () => {
  it('maps specific Asian cuisines into one Asian family', () => {
    expect(familyForCuisine('thai')).toBe('asian');
    expect(familyForCuisine('chinese')).toBe('asian');
    expect(familyForCuisine('japanese')).toBe('asian');
    expect(familyForCuisine('sushi')).toBe('asian');
  });

  it('maps kebab/shawarma/fast_food into the street family', () => {
    expect(familyForCuisine('kebab')).toBe('street');
    expect(familyForCuisine('shawarma')).toBe('street');
    expect(familyForCuisine('fast_food')).toBe('street');
  });

  it('routes regional/local to Ukrainian and international/unknown to Other', () => {
    expect(familyForCuisine('regional')).toBe('ukrainian');
    expect(familyForCuisine('local')).toBe('ukrainian');
    expect(familyForCuisine('international')).toBe(OTHER_FAMILY.id);
    expect(familyForCuisine('martian_fusion')).toBe(OTHER_FAMILY.id);
    expect(familyForCuisine(undefined)).toBe(OTHER_FAMILY.id);
  });
});

describe('familyById', () => {
  it('returns the family entry, or Other for unknown ids', () => {
    expect(familyById('asian')).toMatchObject({ id: 'asian', emoji: '🥡' });
    expect(familyById('nope')).toBe(OTHER_FAMILY);
  });
});
