import { describe, expect, it } from 'vitest';

import type { WheelSegmentOption } from '@shared-types/index';

import { buildFoodSegments, buildVotedRestaurantSegments } from './buildSegments';
import {
  computeSegmentArcs,
  computeTargetRotation,
  findSegmentIndexAtPointer,
  flickDuration,
  flickRevolutions,
  pickWeightedWinnerIndex,
  pointerLocalAngle,
  randomBetween,
  randomIntBetween,
  shortestAngleDelta,
  velocityFromSamples,
} from './wheelMath';

const makeOptions = (weights: number[]): WheelSegmentOption[] =>
  weights.map((weight, index) => ({
    id: `option-${index}`,
    label: `Option ${index}`,
    color: '#000000',
    weight,
  }));

describe('computeSegmentArcs', () => {
  it('produces contiguous arcs summing to 360', () => {
    const arcs = computeSegmentArcs(makeOptions([1, 1, 1, 1]));
    expect(arcs[0].startAngle).toBe(0);
    arcs.forEach((arc, index) => {
      if (index > 0) {
        expect(arc.startAngle).toBeCloseTo(arcs[index - 1].endAngle);
      }
    });
    expect(arcs[arcs.length - 1].endAngle).toBeCloseTo(360);
  });

  it('sizes arcs proportionally to vote weight', () => {
    const arcs = computeSegmentArcs(makeOptions([4, 3, 1]));
    expect(arcs[0].sweep).toBeCloseTo(180);
    expect(arcs[1].sweep).toBeCloseTo(135);
    expect(arcs[2].sweep).toBeCloseTo(45);
  });
});

describe('findSegmentIndexAtPointer', () => {
  const arcs = computeSegmentArcs(makeOptions([1, 1, 1, 1]));

  it('points at the first segment before any rotation', () => {
    expect(findSegmentIndexAtPointer(arcs, 0)).toBe(0);
  });

  it('finds the segment that rotated under the pointer clockwise', () => {
    expect(findSegmentIndexAtPointer(arcs, 10)).toBe(3);
    expect(findSegmentIndexAtPointer(arcs, 100)).toBe(2);
    expect(findSegmentIndexAtPointer(arcs, 360 + 10)).toBe(3);
  });
});

describe('pickWeightedWinnerIndex', () => {
  it('respects weight boundaries', () => {
    const options = makeOptions([4, 3, 1]);
    expect(pickWeightedWinnerIndex(options, () => 0)).toBe(0);
    expect(pickWeightedWinnerIndex(options, () => 0.49)).toBe(0);
    expect(pickWeightedWinnerIndex(options, () => 0.51)).toBe(1);
    expect(pickWeightedWinnerIndex(options, () => 0.999)).toBe(2);
  });
});

describe('shortestAngleDelta', () => {
  it('handles wrap-around in both directions', () => {
    expect(shortestAngleDelta(350, 10)).toBe(20);
    expect(shortestAngleDelta(10, 350)).toBe(-20);
    expect(shortestAngleDelta(0, 180)).toBe(180);
    expect(shortestAngleDelta(90, 90)).toBe(0);
  });
});

describe('computeTargetRotation', () => {
  const weightSets = [
    [1, 1],
    [1, 1, 1, 1],
    [4, 3, 1],
    [1, 2, 5, 1, 3, 2],
  ];

  it('lands inside the winner near its entry edge, clockwise', () => {
    weightSets.forEach((weights) => {
      const options = makeOptions(weights);
      const arcs = computeSegmentArcs(options);
      options.forEach((_, winnerIndex) => {
        [0, 0.5, 0.99].forEach((randomValue) => {
          const target = computeTargetRotation(arcs, winnerIndex, 123.4, 6, 1, () => randomValue);
          expect(findSegmentIndexAtPointer(arcs, target)).toBe(winnerIndex);

          const landedAngle = pointerLocalAngle(target);
          const distanceFromEntryEdge = arcs[winnerIndex].endAngle - landedAngle;
          expect(distanceFromEntryEdge).toBeGreaterThan(0);
          expect(distanceFromEntryEdge).toBeLessThanOrEqual(
            Math.max(2.5, arcs[winnerIndex].sweep * 0.25) + 1e-9,
          );
          expect(target).toBeGreaterThan(123.4);
        });
      });
    });
  });

  it('lands inside the winner near its entry edge, counter-clockwise', () => {
    weightSets.forEach((weights) => {
      const options = makeOptions(weights);
      const arcs = computeSegmentArcs(options);
      options.forEach((_, winnerIndex) => {
        [0, 0.5, 0.99].forEach((randomValue) => {
          const target = computeTargetRotation(arcs, winnerIndex, 123.4, 6, -1, () => randomValue);
          expect(findSegmentIndexAtPointer(arcs, target)).toBe(winnerIndex);

          const landedAngle = pointerLocalAngle(target);
          const distanceFromEntryEdge = landedAngle - arcs[winnerIndex].startAngle;
          expect(distanceFromEntryEdge).toBeGreaterThan(0);
          expect(distanceFromEntryEdge).toBeLessThanOrEqual(
            Math.max(2.5, arcs[winnerIndex].sweep * 0.25) + 1e-9,
          );
          expect(target).toBeLessThan(123.4);
        });
      });
    });
  });

  it('adds the requested full revolutions', () => {
    const arcs = computeSegmentArcs(makeOptions([1, 1, 1]));
    const target = computeTargetRotation(arcs, 1, 0, 6, 1, () => 0.5);
    expect(target).toBeGreaterThanOrEqual(6 * 360);
    expect(target).toBeLessThan(7 * 360);
  });
});

describe('velocityFromSamples', () => {
  it('returns deg/ms from the trailing window', () => {
    const samples = [
      { rotation: 0, timeMs: 0 },
      { rotation: 36, timeMs: 100 },
    ];
    expect(velocityFromSamples(samples)).toBeCloseTo(0.36);
  });

  it('returns 0 for too few samples or zero elapsed time', () => {
    expect(velocityFromSamples([])).toBe(0);
    expect(velocityFromSamples([{ rotation: 10, timeMs: 5 }])).toBe(0);
    expect(
      velocityFromSamples([
        { rotation: 0, timeMs: 50 },
        { rotation: 90, timeMs: 50 },
      ]),
    ).toBe(0);
  });

  it('is negative for counter-clockwise drags', () => {
    const samples = [
      { rotation: 100, timeMs: 0 },
      { rotation: 40, timeMs: 100 },
    ];
    expect(velocityFromSamples(samples)).toBeLessThan(0);
  });
});

describe('flickRevolutions and flickDuration', () => {
  it('maps harder flicks to more revolutions within [2, 8]', () => {
    expect(flickRevolutions(0.1)).toBe(2);
    expect(flickRevolutions(1.2)).toBe(3);
    expect(flickRevolutions(10)).toBe(8);
  });

  it('matches launch speed to the quartic ease and clamps duration', () => {
    expect(flickDuration(2000, 1)).toBeCloseTo(8000);
    expect(flickDuration(500, 5)).toBe(2200);
    expect(flickDuration(100000, 0.1)).toBe(9000);
  });
});

describe('randomBetween and randomIntBetween', () => {
  it('spans [min, max) for floats and [min, max] inclusive for integers', () => {
    expect(randomBetween(5200, 6800, () => 0)).toBe(5200);
    expect(randomBetween(5200, 6800, () => 0.5)).toBe(6000);
    expect(randomIntBetween(5, 8, () => 0)).toBe(5);
    expect(randomIntBetween(5, 8, () => 0.999)).toBe(8);
  });
});

describe('buildSegments', () => {
  it('drops zero-vote options and keeps vote weights', () => {
    const segments = buildFoodSegments({ sushi: 4, pizza: 3 });
    expect(segments.map((segment) => segment.id).sort()).toEqual(['pizza', 'sushi']);
    expect(segments.find((segment) => segment.id === 'sushi')?.weight).toBe(4);
  });

  it('builds equal-weight segments for all food types without votes', () => {
    const segments = buildFoodSegments();
    expect(segments).toHaveLength(10);
    expect(segments.every((segment) => segment.weight === 1)).toBe(true);
  });

  it('maps restaurant votes to weighted segments', () => {
    const segments = buildVotedRestaurantSegments({ 'sushi-0': 2, 'pizza-3': 5 });
    expect(segments).toHaveLength(2);
    expect(segments.find((segment) => segment.id === 'pizza-3')?.weight).toBe(5);
  });
});
