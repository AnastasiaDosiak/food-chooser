import { describe, expect, it } from 'vitest';

import { parsePhotonFeatures } from './photonClient';

const feature = (countrycode: string, name: string, osmId: number, lon: number, lat: number) => ({
  properties: { countrycode, name, osm_id: osmId, state: 'Lviv Oblast', osm_value: 'city' },
  geometry: { coordinates: [lon, lat] as [number, number] },
});

describe('parsePhotonFeatures', () => {
  it('keeps Ukrainian settlements and builds a readable label', () => {
    const suggestions = parsePhotonFeatures({
      features: [
        feature('UA', 'Lviv', 111, 24.03, 49.84),
        feature('PL', 'Lublin', 222, 22.57, 51.25), // non-UA → dropped
      ],
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      label: expect.stringContaining('Lviv'),
      latitude: 49.84,
      longitude: 24.03,
    });
    expect(suggestions[0].id).toBe('111');
  });

  it('tolerates missing features array', () => {
    expect(parsePhotonFeatures({})).toEqual([]);
  });

  it('keeps a house address (no name) labelled street + number + city', () => {
    const suggestions = parsePhotonFeatures({
      features: [
        {
          properties: {
            countrycode: 'UA',
            osm_id: 555,
            housenumber: '10a',
            street: 'Zelena',
            city: 'Lviv',
            state: 'Lviv Oblast',
          },
          geometry: { coordinates: [24.0312, 49.8201] as [number, number] },
        },
      ],
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      label: 'Zelena 10a, Lviv',
      latitude: 49.8201,
      longitude: 24.0312,
      id: '555',
    });
  });

  it('labels a street with its city, not the oblast', () => {
    const [suggestion] = parsePhotonFeatures({
      features: [
        {
          properties: {
            countrycode: 'UA',
            osm_id: 777,
            name: 'Zelena',
            city: 'Lviv',
            state: 'Lviv Oblast',
          },
          geometry: { coordinates: [24.03, 49.82] as [number, number] },
        },
      ],
    });
    expect(suggestion.label).toBe('Zelena, Lviv');
  });

  it('drops a feature with neither a name nor a street', () => {
    const suggestions = parsePhotonFeatures({
      features: [
        {
          properties: { countrycode: 'UA', osm_id: 9, state: 'Lviv Oblast' },
          geometry: { coordinates: [24, 49] as [number, number] },
        },
      ],
    });
    expect(suggestions).toEqual([]);
  });

  it('collapses many POIs at one house number into a single address suggestion', () => {
    const at28 = (osmId: number, name: string) => ({
      properties: { countrycode: 'UA', osm_id: osmId, name, housenumber: '28', street: 'Svobody Avenue', city: 'Lviv', state: 'Lviv Oblast' },
      geometry: { coordinates: [24.0263, 49.8443] as [number, number] },
    });
    const suggestions = parsePhotonFeatures({
      features: [at28(1, 'Opera House'), at28(2, 'Humana'), at28(3, 'Lviv Croissants')],
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].label).toBe('Svobody Avenue 28, Lviv');
  });

  it('disambiguates same-named streets by district', () => {
    const zelena = (osmId: number, district: string) => ({
      properties: { countrycode: 'UA', osm_id: osmId, name: 'Zelena Street', city: 'Lviv', district, state: 'Lviv Oblast' },
      geometry: { coordinates: [24.04, 49.81] as [number, number] },
    });
    const labels = parsePhotonFeatures({ features: [zelena(1, 'Sykhiv'), zelena(2, 'Lychakiv')] }).map(
      (suggestion) => suggestion.label,
    );
    expect(labels).toEqual(['Zelena Street, Sykhiv, Lviv', 'Zelena Street, Lychakiv, Lviv']);
  });
});
