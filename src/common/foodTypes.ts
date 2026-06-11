import type { FoodType } from '@shared-types/index';

export const FOOD_TYPES: FoodType[] = [
  { id: 'burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'kebabs', label: 'Kebabs', emoji: '🌯' },
  { id: 'salads', label: 'Salads', emoji: '🥗' },
  { id: 'wok', label: 'Wok', emoji: '🥡' },
  { id: 'pasta', label: 'Pasta', emoji: '🍝' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'ramen', label: 'Ramen', emoji: '🍜' },
  { id: 'ua', label: 'Traditional UA', emoji: '🥟' },
  { id: 'georgian', label: 'Georgian', emoji: '🍷' },
];

export const getFoodTypeById = (foodTypeId: string): FoodType | undefined =>
  FOOD_TYPES.find((foodType) => foodType.id === foodTypeId);
