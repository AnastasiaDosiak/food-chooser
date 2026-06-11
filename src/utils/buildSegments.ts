import { WHEEL_PALETTE } from '@common/constants';
import { FOOD_TYPES } from '@common/foodTypes';
import { RESTAURANTS, getRestaurantsByFoodType } from '@common/restaurants';
import type { WheelSegmentOption } from '@shared-types/index';

const pickColor = (index: number) => WHEEL_PALETTE[index % WHEEL_PALETTE.length];

/** Food-type segments; with votes, zero-vote types are dropped and weights follow votes. */
export const buildFoodSegments = (
  votesByOptionId?: Record<string, number>,
): WheelSegmentOption[] =>
  FOOD_TYPES.filter((foodType) => !votesByOptionId || (votesByOptionId[foodType.id] ?? 0) > 0).map(
    (foodType, index) => ({
      id: foodType.id,
      label: `${foodType.emoji} ${foodType.label}`,
      color: pickColor(index),
      weight: votesByOptionId ? votesByOptionId[foodType.id] : 1,
    }),
  );

export const buildVotedRestaurantSegments = (
  votesByOptionId: Record<string, number>,
): WheelSegmentOption[] =>
  RESTAURANTS.filter((restaurant) => (votesByOptionId[restaurant.id] ?? 0) > 0).map(
    (restaurant, index) => ({
      id: restaurant.id,
      label: restaurant.name,
      color: pickColor(index),
      weight: votesByOptionId[restaurant.id],
    }),
  );

/** The chained wheel after a food-type win: all 15 places of that type, equal odds. */
export const buildChainedRestaurantSegments = (foodTypeId: string): WheelSegmentOption[] =>
  getRestaurantsByFoodType(foodTypeId).map((restaurant, index) => ({
    id: restaurant.id,
    label: restaurant.name,
    color: pickColor(index),
    weight: 1,
  }));
