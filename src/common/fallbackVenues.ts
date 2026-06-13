import type { Venue } from '@shared-types/index';

interface FallbackSeed {
  name: string;
  /** Raw cuisine token — mapped to a family by familyForCuisine, like real OSM tags. */
  cuisine: string;
}

/**
 * Curated real Lviv eateries used only when the live OpenStreetMap lookup is unavailable
 * (Overpass is frequently rate-limited / down). Keeps the wheel playable offline-ish so the
 * demo never dead-ends on "no kitchens".
 */
const FALLBACK_SEEDS: FallbackSeed[] = [
  { name: 'Криївка', cuisine: 'ukrainian' },
  { name: 'Газова Лямпа', cuisine: 'ukrainian' },
  { name: 'Бачевських', cuisine: 'ukrainian' },
  { name: 'Кумпель', cuisine: 'ukrainian' },
  { name: 'Дім Легенд', cuisine: 'ukrainian' },
  { name: 'Челентано', cuisine: 'pizza' },
  { name: 'Tre Forni', cuisine: 'pizza' },
  { name: 'Mons Pius', cuisine: 'italian' },
  { name: 'Trattoria 21', cuisine: 'pasta' },
  { name: 'Yoko Sushi', cuisine: 'sushi' },
  { name: 'Фуджіяма', cuisine: 'sushi' },
  { name: 'Sushi 33', cuisine: 'sushi' },
  { name: 'Ramen Ya', cuisine: 'ramen' },
  { name: 'Wok & Roll', cuisine: 'chinese' },
  { name: 'Pho Viet', cuisine: 'thai' },
  { name: 'Хінкальня', cuisine: 'georgian' },
  { name: 'Сакартвело', cuisine: 'georgian' },
  { name: 'Тбілісо', cuisine: 'georgian' },
  { name: 'Beef & Buns', cuisine: 'burger' },
  { name: 'Meat Hub', cuisine: 'burger' },
  { name: 'Чорний Кіт', cuisine: 'burger' },
  { name: 'Bavaria Grill', cuisine: 'steak' },
  { name: 'Реберня', cuisine: 'bbq' },
  { name: 'Döner Markt', cuisine: 'kebab' },
  { name: 'Шаурма на Ринку', cuisine: 'shawarma' },
  { name: 'Green Point', cuisine: 'salad' },
  { name: 'Salateira', cuisine: 'salad' },
  { name: 'Vegano Hooligano', cuisine: 'vegan' },
  { name: 'Світ Кави', cuisine: 'cafe' },
  { name: 'Forum Coffee', cuisine: 'cafe' },
  { name: 'Львівська Майстерня Шоколаду', cuisine: 'dessert' },
  { name: 'Львівські Пляцки', cuisine: 'dessert' },
  { name: 'Пструг, Карп, Форель', cuisine: 'fish' },
];

/** Scatters the curated venues in rings around the user so distances read plausibly. */
export const buildFallbackVenues = (origin: {
  latitude: number;
  longitude: number;
}): Venue[] =>
  FALLBACK_SEEDS.map((seed, index) => {
    const ring = Math.floor(index / 6) + 1;
    const angle = (index % 6) * (Math.PI / 3);
    return {
      id: `fallback-${index}`,
      name: seed.name,
      latitude: origin.latitude + Math.cos(angle) * 0.003 * ring,
      longitude: origin.longitude + Math.sin(angle) * 0.003 * ring,
      cuisines: [seed.cuisine],
      distanceMeters: Math.round(ring * 350 + (index % 6) * 45),
    };
  });
