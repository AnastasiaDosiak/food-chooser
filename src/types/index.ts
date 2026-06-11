export type PartyMode = 'solo' | 'company';

export type ChoiceType = 'food' | 'restaurant';

export type WheelKind = 'food' | 'restaurant';

export interface FoodType {
  id: string;
  label: string;
  emoji: string;
}

export interface Restaurant {
  id: string;
  name: string;
  foodTypeId: string;
}

export interface WheelSegmentOption {
  id: string;
  label: string;
  color: string;
  /** Vote count in company mode; 1 for everyone in solo mode. */
  weight: number;
}

export interface SpinRecord {
  id: string;
  winnerLabel: string;
  /** Set when the result came via a food-type chain, e.g. "🍣 Sushi". */
  viaLabel?: string;
  /** ISO timestamp; history is stored newest-first. */
  spunAt: string;
}
