/** Lowercase/trim/underscore an OSM cuisine token. Null only for empty — the family
    map (cuisineFamilies.ts) handles synonyms and bucketing, not this. */
export const normalizeCuisineToken = (rawToken: string): string | null => {
  const token = rawToken.trim().toLowerCase().replace(/\s+/g, '_');
  return token || null;
};

/** Decorative food-rain emojis for confetti — fixed set, independent of nearby cuisines. */
export const CUISINE_CONFETTI_EMOJIS = [
  '🍕',
  '🍔',
  '🍣',
  '🌯',
  '🍝',
  '🥗',
  '🍜',
  '🌮',
  '🥟',
  '🍷',
] as const;
