import confetti from 'canvas-confetti';

import { WHEEL_PALETTE } from '@common/constants';
import { FOOD_TYPES } from '@common/foodTypes';

const COLORS = [...WHEEL_PALETTE];
const CANNONADE_SCHEDULE_MS = [0, 250, 520, 800, 1120];
const FOOD_SCALAR = 4;

let foodShapesCache: confetti.Shape[] | null = null;

/** Rasterized once and reused — shapeFromText builds a bitmap per emoji. */
const foodShapes = (): confetti.Shape[] => {
  if (!foodShapesCache) {
    foodShapesCache = FOOD_TYPES.map((foodType) =>
      confetti.shapeFromText({ text: foodType.emoji, scalar: FOOD_SCALAR }),
    );
  }
  return foodShapesCache;
};

/** It literally rains food — `flat` keeps the emojis readable mid-air. */
const foodBurst = (particleCount: number, origin: confetti.Origin) => {
  void confetti({
    particleCount,
    spread: 100,
    startVelocity: 32,
    gravity: 0.9,
    scalar: FOOD_SCALAR,
    flat: true,
    shapes: foodShapes(),
    origin,
  });
};

/** Single burst the moment any wheel lands — including the intermediate one. */
export const landingBurst = () => {
  void confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    origin: { y: 0.55 },
    colors: COLORS,
  });
  foodBurst(18, { y: 0.55 });
};

/** Staggered multi-burst for the final verdict. Returns a cleanup that aborts it. */
export const startCannonade = (): (() => void) => {
  const timers = CANNONADE_SCHEDULE_MS.map((delay, burstIndex) =>
    window.setTimeout(() => {
      const fromLeft = burstIndex % 2 === 0;
      void confetti({
        particleCount: 110,
        angle: fromLeft ? 60 : 120,
        spread: 70,
        origin: { x: fromLeft ? 0.1 : 0.9, y: 0.75 },
        colors: COLORS,
      });
      void confetti({
        particleCount: 60,
        spread: 110,
        startVelocity: 45,
        origin: { y: 0.6 },
        colors: COLORS,
      });
      foodBurst(12, { y: 0.6 });
    }, delay),
  );
  return () => {
    timers.forEach((timer) => clearTimeout(timer));
    confetti.reset();
  };
};
