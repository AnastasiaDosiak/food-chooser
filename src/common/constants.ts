export const STORAGE_KEYS = {
  history: 'wheel.history',
  flickHintSeen: 'wheel.flickHintSeen',
} as const;

export const MIN_OPTIONS_TO_SPIN = 2;
export const MIN_SOLO_RESTAURANT_PICKS = 2;

export const PARTY_SIZE_MIN = 2;
export const PARTY_SIZE_MAX = 8;
export const PARTY_SIZE_DEFAULT = 5;

/** Casino SPIN button — the croupier's throw: always clockwise, long and agonizing. */
export const CASINO_SPIN_REVOLUTIONS_MIN = 5;
export const CASINO_SPIN_REVOLUTIONS_MAX = 8;
export const CASINO_SPIN_DURATION_MS_MIN = 5200;
export const CASINO_SPIN_DURATION_MS_MAX = 6800;

/** Retro game-show slice palette — loud, distinct, espresso-outline friendly. */
export const WHEEL_PALETTE = [
  '#ff6b35',
  '#0fb5a3',
  '#ffc53d',
  '#845ec2',
  '#ff4f9a',
  '#4f9df7',
  '#e84855',
  '#7fb069',
  '#ff9f1c',
  '#2a9d8f',
] as const;
