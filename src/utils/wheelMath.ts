import type { WheelSegmentOption } from '@shared-types/index';

export interface SegmentArc {
  id: string;
  /** Degrees clockwise from 12 o'clock at rotation 0. */
  startAngle: number;
  endAngle: number;
  sweep: number;
}

export interface PointerSample {
  /** Cumulative wheel rotation in degrees (not wrapped) at the sample time. */
  rotation: number;
  timeMs: number;
}

export type SpinDirection = 1 | -1;

export type SpinEase = 'drama' | 'surge';

export interface SpinPhase {
  /** Absolute rotation (deg) the wheel reaches by the end of this phase's tween. */
  toRotation: number;
  durationMs: number;
  ease: SpinEase;
  /** Suspense pause (ms) held after the tween — 0 for none. */
  holdMsAfter: number;
  /** Whether to surface a funny commentary line during this phase's hold. */
  suspense: boolean;
}

const FULL_TURN = 360;

/** Fraction of a slice the near-miss landing may sit from its entry edge. */
const NEAR_MISS_MAX_FRACTION = 0.25;
const NEAR_MISS_MIN_DEGREES = 1;
const NEAR_MISS_MAX_DEGREES = 2.5;

const VELOCITY_WINDOW_MS = 120;
export const WEAK_FLICK_THRESHOLD_DEG_PER_MS = 0.2;
const FLICK_REVOLUTIONS_MIN = 2;
const FLICK_REVOLUTIONS_MAX = 8;
const FLICK_DURATION_MS_MIN = 2200;
const FLICK_DURATION_MS_MAX = 9000;

/** Multi-burst drama: the spin breaks into 2–4 bursts that stop on random tiles and surge back up. */
const SUSPENSE_BURSTS_MIN = 2;
const SUSPENSE_BURSTS_MAX = 4;
const SUSPENSE_FIRST_FRACTION_MIN = 0.45;
const SUSPENSE_FIRST_FRACTION_MAX = 0.7;
const SUSPENSE_BURST_WEIGHT_MIN = 0.5;
const SUSPENSE_BURST_WEIGHT_MAX = 1.5;
const SUSPENSE_HOLD_MS_MIN = 300;
const SUSPENSE_HOLD_MS_MAX = 800;
const SUSPENSE_SURGE_MS_MIN = 900;
const SUSPENSE_SURGE_MS_MAX = 1900;

export const computeSegmentArcs = (options: WheelSegmentOption[]): SegmentArc[] => {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let cursor = 0;
  return options.map((option) => {
    const sweep = (option.weight / totalWeight) * FULL_TURN;
    const arc: SegmentArc = {
      id: option.id,
      startAngle: cursor,
      endAngle: cursor + sweep,
      sweep,
    };
    cursor += sweep;
    return arc;
  });
};

/** The wheel-local angle currently under the fixed top pointer. */
export const pointerLocalAngle = (rotation: number): number =>
  ((-rotation % FULL_TURN) + FULL_TURN) % FULL_TURN;

export const findSegmentIndexAtPointer = (arcs: SegmentArc[], rotation: number): number => {
  const angle = pointerLocalAngle(rotation);
  const index = arcs.findIndex((arc) => angle >= arc.startAngle && angle < arc.endAngle);
  return index === -1 ? arcs.length - 1 : index;
};

export const pickWeightedWinnerIndex = (
  options: WheelSegmentOption[],
  random: () => number = Math.random,
): number => {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let threshold = random() * totalWeight;
  for (let index = 0; index < options.length; index += 1) {
    threshold -= options[index].weight;
    if (threshold < 0) {
      return index;
    }
  }
  return options.length - 1;
};

/** Signed smallest delta between two wrapped angles, in (-180, 180]. */
export const shortestAngleDelta = (fromDegrees: number, toDegrees: number): number => {
  const raw = (toDegrees - fromDegrees) % FULL_TURN;
  if (raw > 180) {
    return raw - FULL_TURN;
  }
  if (raw <= -180) {
    return raw + FULL_TURN;
  }
  return raw;
};

/**
 * Target rotation that lands the pointer just inside the winner's entry edge —
 * the wheel visibly "barely escapes" the neighboring slice in either direction.
 * Spinning clockwise the pointer enters a slice through its end edge; spinning
 * counter-clockwise, through its start edge.
 */
export const computeTargetRotation = (
  arcs: SegmentArc[],
  winnerIndex: number,
  currentRotation: number,
  revolutions: number,
  direction: SpinDirection = 1,
  random: () => number = Math.random,
): number => {
  const winner = arcs[winnerIndex];
  const maxOffset = Math.min(NEAR_MISS_MAX_DEGREES, winner.sweep * NEAR_MISS_MAX_FRACTION);
  const minOffset = Math.min(NEAR_MISS_MIN_DEGREES, maxOffset / 2);
  const edgeOffset = minOffset + random() * (maxOffset - minOffset);
  const desiredLocalAngle =
    direction === 1 ? winner.endAngle - edgeOffset : winner.startAngle + edgeOffset;

  const desiredRotationRemainder = (FULL_TURN - desiredLocalAngle + FULL_TURN) % FULL_TURN;
  const currentRemainder = ((currentRotation % FULL_TURN) + FULL_TURN) % FULL_TURN;

  if (direction === 1) {
    const alignmentDelta = (desiredRotationRemainder - currentRemainder + FULL_TURN) % FULL_TURN;
    return currentRotation + revolutions * FULL_TURN + alignmentDelta;
  }
  const alignmentDelta = (currentRemainder - desiredRotationRemainder + FULL_TURN) % FULL_TURN;
  return currentRotation - revolutions * FULL_TURN - alignmentDelta;
};

/**
 * Release velocity in deg/ms from the trailing drag samples. Cumulative
 * rotations make this wrap-safe. Fewer than 2 samples → 0 (weak-flick path).
 */
export const velocityFromSamples = (
  samples: PointerSample[],
  windowMs: number = VELOCITY_WINDOW_MS,
): number => {
  if (samples.length < 2) {
    return 0;
  }
  const lastSample = samples[samples.length - 1];
  const firstInWindow =
    samples.find((sample) => lastSample.timeMs - sample.timeMs <= windowMs) ?? samples[0];
  const elapsed = lastSample.timeMs - firstInWindow.timeMs;
  if (elapsed <= 0) {
    return 0;
  }
  return (lastSample.rotation - firstInWindow.rotation) / elapsed;
};

/** Harder flick → more revolutions of drama. Never decides the winner. */
export const flickRevolutions = (speedDegPerMs: number): number => {
  const revolutions = Math.round(Math.abs(speedDegPerMs) * 2.5);
  return Math.min(Math.max(revolutions, FLICK_REVOLUTIONS_MIN), FLICK_REVOLUTIONS_MAX);
};

/**
 * Duration so the quartic ease-out launches at the hand's release speed:
 * θ'(0) = 4·Δ/T  →  T = 4·Δ/v. Seamless handoff from finger to animation.
 */
export const flickDuration = (totalDeltaDegrees: number, launchSpeedDegPerMs: number): number => {
  const speed = Math.max(Math.abs(launchSpeedDegPerMs), 0.05);
  const duration = (4 * Math.abs(totalDeltaDegrees)) / speed;
  return Math.min(Math.max(duration, FLICK_DURATION_MS_MIN), FLICK_DURATION_MS_MAX);
};

/** Uniform float in [min, max). */
export const randomBetween = (
  min: number,
  max: number,
  random: () => number = Math.random,
): number => min + random() * (max - min);

/** Uniform integer in [min, max], inclusive on both ends. */
export const randomIntBetween = (
  min: number,
  max: number,
  random: () => number = Math.random,
): number => Math.floor(randomBetween(min, max + 1, random));

/** Ease-out with a long agonizing tail — the casino feel lives here. */
export const easeOutDrama = (progress: number): number => 1 - (1 - progress) ** 4;

/** Overshoot-and-settle ease for the weak-flick rebound wobble. */
export const easeOutBack = (progress: number): number => {
  const overshoot = 1.70158;
  const shifted = progress - 1;
  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
};

/** easeInOutCubic — the wheel surges back up to life from a dead stop, then eases down again. */
export const easeSurge = (progress: number): number =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

export interface SuspenseTimelineParams {
  fromRotation: number;
  finalTarget: number;
  launchSpeedDegPerMs: number;
  random?: () => number;
}

/**
 * Choreography to the *already-rigged* target: the spin breaks into 2–4 bursts.
 * The first is velocity-matched and decelerates to a stop on a random tile; each
 * later burst surges back up to speed and halts on another random tile. The final
 * burst lands the winner — so where it pauses never reveals the outcome.
 */
export const buildSuspenseTimeline = ({
  fromRotation,
  finalTarget,
  launchSpeedDegPerMs,
  random = Math.random,
}: SuspenseTimelineParams): SpinPhase[] => {
  const totalDelta = finalTarget - fromRotation;
  const burstCount = randomIntBetween(SUSPENSE_BURSTS_MIN, SUSPENSE_BURSTS_MAX, random);
  const firstFraction = randomBetween(
    SUSPENSE_FIRST_FRACTION_MIN,
    SUSPENSE_FIRST_FRACTION_MAX,
    random,
  );

  // Each later burst gets a random slice of the remaining journey, so its stop lands on an
  // arbitrary tile — never a fixed gap from the winner.
  const tailWeights = Array.from({ length: burstCount - 1 }, () =>
    randomBetween(SUSPENSE_BURST_WEIGHT_MIN, SUSPENSE_BURST_WEIGHT_MAX, random),
  );
  const tailTotal = tailWeights.reduce((sum, weight) => sum + weight, 0) || 1;
  const fractions = [firstFraction];
  let cumulative = firstFraction;
  for (const weight of tailWeights) {
    cumulative += ((1 - firstFraction) * weight) / tailTotal;
    fractions.push(cumulative);
  }
  fractions[fractions.length - 1] = 1; // land exactly on the rigged target

  return fractions.map((fraction, index) => {
    const isFirst = index === 0;
    const isLast = index === fractions.length - 1;
    const toRotation = fromRotation + totalDelta * fraction;
    return {
      toRotation,
      durationMs: isFirst
        ? flickDuration(toRotation - fromRotation, launchSpeedDegPerMs)
        : randomBetween(SUSPENSE_SURGE_MS_MIN, SUSPENSE_SURGE_MS_MAX, random),
      ease: isFirst ? 'drama' : 'surge',
      holdMsAfter: isLast ? 0 : randomBetween(SUSPENSE_HOLD_MS_MIN, SUSPENSE_HOLD_MS_MAX, random),
      suspense: !isLast,
    };
  });
};
