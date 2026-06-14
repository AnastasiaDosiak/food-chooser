import { describe, expect, it } from 'vitest';

import type { ChosenLocation } from '@shared-types/index';

import { buildOrderLinks } from './orderLinks';

const kyiv: ChosenLocation = {
  label: 'Kyiv',
  latitude: 50.4501,
  longitude: 30.5234,
  scope: 'near',
};
const lviv: ChosenLocation = {
  label: 'Lviv',
  latitude: 49.8419,
  longitude: 24.0315,
  scope: 'near',
};
const middleOfNowhere: ChosenLocation = {
  label: 'Steppe',
  latitude: 48.0,
  longitude: 32.0,
  scope: 'near',
};

describe('buildOrderLinks', () => {
  it('gives a verified city direct Glovo + Bolt deep links', () => {
    const links = buildOrderLinks(kyiv);
    expect(links.cityLabel).toBe('Kyiv');
    expect(links.glovoUrl).toContain('kyiv-right-bank');
    expect(links.boltUrl).toContain('158-kyiv');
  });

  it('uses the city Glovo slug but Bolt root when the Bolt id is unverified', () => {
    const links = buildOrderLinks(lviv);
    expect(links.cityLabel).toBe('Lviv');
    expect(links.glovoUrl).toContain('lviv');
    expect(links.boltUrl).toBe('https://food.bolt.eu/');
  });

  it('falls back to platform root pages when no city is near', () => {
    const links = buildOrderLinks(middleOfNowhere);
    expect(links.cityLabel).toBeNull();
    expect(links.glovoUrl).toBe('https://glovoapp.com/ua/en/');
    expect(links.boltUrl).toBe('https://food.bolt.eu/');
  });
});
