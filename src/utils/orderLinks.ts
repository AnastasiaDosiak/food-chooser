import { nearestCity } from '@common/cities';
import type { ChosenLocation, OrderLinks } from '@shared-types/index';

const GLOVO_ROOT = 'https://glovoapp.com/ua/en/';
const BOLT_ROOT = 'https://food.bolt.eu/';

/** Map the chosen location to ordering deep links; root pages when no city is near. */
export const buildOrderLinks = (location: ChosenLocation): OrderLinks => {
  const city = nearestCity(location.latitude, location.longitude);
  if (!city) {
    return { glovoUrl: GLOVO_ROOT, boltUrl: BOLT_ROOT, cityLabel: null };
  }
  return {
    glovoUrl: `https://glovoapp.com/en/ua/${city.glovoSlug}/`,
    // Direct Bolt link only for verified cities; otherwise the root page (never a 404).
    boltUrl: city.boltCityId
      ? `https://food.bolt.eu/uk-ua/${city.boltCityId}-${city.boltSlug}/`
      : BOLT_ROOT,
    cityLabel: city.label,
  };
};
