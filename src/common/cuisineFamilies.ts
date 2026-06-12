export interface CuisineFamily {
  id: string;
  label: string;
  emoji: string;
}

/** Catch-all family for untagged + unmapped cuisines. Kept playful, not a dull "Other". */
export const OTHER_FAMILY: CuisineFamily = { id: 'other', label: 'Surprise Me', emoji: '🎲' };

/** Curated families (dynamically populated — only non-empty ones ride the wheel). */
export const FAMILIES: CuisineFamily[] = [
  { id: 'italian', label: 'Pizza & Italian', emoji: '🍕' },
  { id: 'asian', label: 'Asian', emoji: '🥡' },
  { id: 'street', label: 'Kebab & Street', emoji: '🌯' },
  { id: 'grill', label: 'Burgers & Grill', emoji: '🍔' },
  { id: 'georgian', label: 'Georgian', emoji: '🍷' },
  { id: 'ukrainian', label: 'Ukrainian', emoji: '🥟' },
  { id: 'coffee', label: 'Coffee & Sweets', emoji: '☕' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗' },
  { id: 'seafood', label: 'Seafood', emoji: '🦞' },
];

/** OSM cuisine token → family id. Anything absent falls to OTHER_FAMILY. */
const TOKEN_TO_FAMILY: Record<string, string> = {
  pizza: 'italian',
  italian: 'italian',
  pasta: 'italian',
  pizzeria: 'italian',
  asian: 'asian',
  chinese: 'asian',
  thai: 'asian',
  japanese: 'asian',
  sushi: 'asian',
  ramen: 'asian',
  noodle: 'asian',
  noodles: 'asian',
  wok: 'asian',
  vietnamese: 'asian',
  korean: 'asian',
  indian: 'asian',
  pan_asian: 'asian',
  kebab: 'street',
  shawarma: 'street',
  shaurma: 'street',
  doner: 'street',
  donair: 'street',
  kebap: 'street',
  fast_food: 'street',
  sandwich: 'street',
  hot_dog: 'street',
  pita: 'street',
  wrap: 'street',
  falafel: 'street',
  burger: 'grill',
  burgers: 'grill',
  hamburger: 'grill',
  american: 'grill',
  steak: 'grill',
  steak_house: 'grill',
  bbq: 'grill',
  barbecue: 'grill',
  grill: 'grill',
  chicken: 'grill',
  meat: 'grill',
  georgian: 'georgian',
  ukrainian: 'ukrainian',
  ukranian: 'ukrainian',
  varenyky: 'ukrainian',
  regional: 'ukrainian',
  local: 'ukrainian',
  coffee: 'coffee',
  coffee_shop: 'coffee',
  cafe: 'coffee',
  bakery: 'coffee',
  dessert: 'coffee',
  ice_cream: 'coffee',
  breakfast: 'coffee',
  pastry: 'coffee',
  cake: 'coffee',
  donut: 'coffee',
  tea: 'coffee',
  confectionery: 'coffee',
  vegetarian: 'healthy',
  vegan: 'healthy',
  salad: 'healthy',
  healthy: 'healthy',
  organic: 'healthy',
  juice: 'healthy',
  smoothie: 'healthy',
  seafood: 'seafood',
  fish: 'seafood',
  fish_and_chips: 'seafood',
};

/** A venue's primary cuisine token → family id (catch-all when unknown/missing). */
export const familyForCuisine = (token: string | undefined): string =>
  (token && TOKEN_TO_FAMILY[token]) || OTHER_FAMILY.id;

export const familyById = (familyId: string): CuisineFamily =>
  FAMILIES.find((family) => family.id === familyId) ?? OTHER_FAMILY;
