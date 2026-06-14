import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import {
  CASINO_SPIN_DURATION_MS_MAX,
  CASINO_SPIN_DURATION_MS_MIN,
  CASINO_SPIN_REVOLUTIONS_MAX,
  CASINO_SPIN_REVOLUTIONS_MIN,
  MIN_OPTIONS_TO_SPIN,
} from '@common/constants';
import type { WheelSegmentOption } from '@shared-types/index';
import {
  WEAK_FLICK_THRESHOLD_DEG_PER_MS,
  buildSuspenseTimeline,
  computeSegmentArcs,
  computeTargetRotation,
  easeOutBack,
  easeOutDrama,
  easeSurge,
  findSegmentIndexAtPointer,
  flickRevolutions,
  pickWeightedWinnerIndex,
  randomBetween,
  randomIntBetween,
  shortestAngleDelta,
  velocityFromSamples,
  type PointerSample,
  type SegmentArc,
  type SpinPhase,
} from '@utils/wheelMath';

export type WheelPhase = 'idle' | 'dragging' | 'spinning' | 'rebounding';

const MAX_SAMPLES = 16;
const REBOUND_DURATION_MS = 650;

interface UseWheelSpinParams {
  segments: WheelSegmentOption[];
  onDragStart: () => void;
  onBoundaryCross: () => void;
  onFlick: () => void;
  onSpeedChange: (speedDegPerMs: number) => void;
  onWeakFlick: () => void;
  /** Fired at each suspense hold so the UI can flash a teasing line. */
  onSuspenseBeat: () => void;
  onSettle: (winner: WheelSegmentOption) => void;
}

/**
 * Drag-to-flick engine. The drag follows the cursor 1:1; the winner is chosen
 * the instant the user lets go — the flick only buys direction and drama.
 */
export const useWheelSpin = ({
  segments,
  onDragStart,
  onBoundaryCross,
  onFlick,
  onSpeedChange,
  onWeakFlick,
  onSuspenseBeat,
  onSettle,
}: UseWheelSpinParams) => {
  const [phase, setPhase] = useState<WheelPhase>('idle');

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const frameRef = useRef(0);
  const arcsRef = useRef<SegmentArc[]>([]);
  const lastSegmentIndexRef = useRef(0);
  const lastPointerAngleRef = useRef(0);
  const dragStartRotationRef = useRef(0);
  const samplesRef = useRef<PointerSample[]>([]);

  const callbacksRef = useRef({
    onDragStart,
    onBoundaryCross,
    onFlick,
    onSpeedChange,
    onWeakFlick,
    onSuspenseBeat,
    onSettle,
  });
  useEffect(() => {
    callbacksRef.current = {
      onDragStart,
      onBoundaryCross,
      onFlick,
      onSpeedChange,
      onWeakFlick,
      onSuspenseBeat,
      onSettle,
    };
  }, [
    onDragStart,
    onBoundaryCross,
    onFlick,
    onSpeedChange,
    onWeakFlick,
    onSuspenseBeat,
    onSettle,
  ]);

  const applyRotation = useCallback((rotation: number) => {
    rotationRef.current = rotation;
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotation}deg)`;
    }
  }, []);

  const tickOnBoundaryCross = useCallback((rotation: number) => {
    const segmentIndex = findSegmentIndexAtPointer(arcsRef.current, rotation);
    if (segmentIndex !== lastSegmentIndexRef.current) {
      lastSegmentIndexRef.current = segmentIndex;
      callbacksRef.current.onBoundaryCross();
    }
  }, []);

  const pointerAngleOf = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return (Math.atan2(event.clientX - centerX, centerY - event.clientY) * 180) / Math.PI;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== 'idle' || segments.length < MIN_OPTIONS_TO_SPIN) {
        return;
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture can fail for synthetic pointers — the drag still works.
      }
      arcsRef.current = computeSegmentArcs(segments);
      lastSegmentIndexRef.current = findSegmentIndexAtPointer(arcsRef.current, rotationRef.current);
      lastPointerAngleRef.current = pointerAngleOf(event);
      dragStartRotationRef.current = rotationRef.current;
      samplesRef.current = [{ rotation: rotationRef.current, timeMs: performance.now() }];
      setPhase('dragging');
      callbacksRef.current.onDragStart();
    },
    [phase, segments, pointerAngleOf],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== 'dragging') {
        return;
      }
      const pointerAngle = pointerAngleOf(event);
      const delta = shortestAngleDelta(lastPointerAngleRef.current, pointerAngle);
      lastPointerAngleRef.current = pointerAngle;
      const nextRotation = rotationRef.current + delta;
      applyRotation(nextRotation);
      tickOnBoundaryCross(nextRotation);

      samplesRef.current.push({ rotation: nextRotation, timeMs: performance.now() });
      if (samplesRef.current.length > MAX_SAMPLES) {
        samplesRef.current.shift();
      }
    },
    [phase, pointerAngleOf, applyRotation, tickOnBoundaryCross],
  );

  const animateRebound = useCallback(() => {
    const fromRotation = rotationRef.current;
    const targetRotation = dragStartRotationRef.current;
    let startedAt: number | null = null;

    const step = (timestamp: number) => {
      startedAt = startedAt ?? timestamp;
      const progress = Math.min((timestamp - startedAt) / REBOUND_DURATION_MS, 1);
      applyRotation(fromRotation + (targetRotation - fromRotation) * easeOutBack(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setPhase('idle');
      }
    };
    frameRef.current = requestAnimationFrame(step);
  }, [applyRotation]);

  /** Plays a suspense timeline phase-by-phase: tween → optional hold → next, then settle. */
  const runSpinTimeline = useCallback(
    (winnerIndex: number, phases: SpinPhase[]) => {
      let phaseIndex = 0;
      let fromRotation = rotationRef.current;
      let startedAt: number | null = null;
      let holdUntil: number | null = null;
      let previousRotation = fromRotation;
      let previousTimestamp: number | null = null;

      const settle = () => {
        setPhase('idle');
        callbacksRef.current.onSpeedChange(0);
        callbacksRef.current.onSettle(segments[winnerIndex]);
      };

      const step = (timestamp: number) => {
        if (holdUntil !== null) {
          callbacksRef.current.onSpeedChange(0);
          if (timestamp < holdUntil) {
            frameRef.current = requestAnimationFrame(step);
            return;
          }
          holdUntil = null;
          startedAt = null;
          fromRotation = rotationRef.current;
          phaseIndex += 1;
          if (phaseIndex >= phases.length) {
            settle();
            return;
          }
          frameRef.current = requestAnimationFrame(step);
          return;
        }

        const phase = phases[phaseIndex];
        startedAt = startedAt ?? timestamp;
        const progress = Math.min((timestamp - startedAt) / phase.durationMs, 1);
        const eased = phase.ease === 'surge' ? easeSurge(progress) : easeOutDrama(progress);
        const rotation = fromRotation + (phase.toRotation - fromRotation) * eased;
        applyRotation(rotation);
        tickOnBoundaryCross(rotation);

        if (previousTimestamp !== null && timestamp > previousTimestamp) {
          callbacksRef.current.onSpeedChange(
            (rotation - previousRotation) / (timestamp - previousTimestamp),
          );
        }
        previousRotation = rotation;
        previousTimestamp = timestamp;

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
          return;
        }

        if (phase.holdMsAfter > 0) {
          if (phase.suspense) {
            callbacksRef.current.onSuspenseBeat();
          }
          holdUntil = timestamp + phase.holdMsAfter;
          frameRef.current = requestAnimationFrame(step);
          return;
        }

        startedAt = null;
        fromRotation = phase.toRotation;
        phaseIndex += 1;
        if (phaseIndex >= phases.length) {
          settle();
          return;
        }
        frameRef.current = requestAnimationFrame(step);
      };

      frameRef.current = requestAnimationFrame(step);
    },
    [segments, applyRotation, tickOnBoundaryCross],
  );

  const animateSpin = useCallback(
    (releaseSpeed: number) => {
      const direction = releaseSpeed > 0 ? 1 : (-1 as const);
      const winnerIndex = pickWeightedWinnerIndex(segments);
      const finalTarget = computeTargetRotation(
        arcsRef.current,
        winnerIndex,
        rotationRef.current,
        flickRevolutions(releaseSpeed),
        direction,
      );
      runSpinTimeline(
        winnerIndex,
        buildSuspenseTimeline({
          fromRotation: rotationRef.current,
          finalTarget,
          launchSpeedDegPerMs: releaseSpeed,
        }),
      );
    },
    [segments, runSpinTimeline],
  );

  /** Casino-button path: the croupier throws clockwise — long, loud, rigged all the same. */
  const spinFromButton = useCallback(() => {
    if (phase !== 'idle' || segments.length < MIN_OPTIONS_TO_SPIN) {
      return false;
    }
    arcsRef.current = computeSegmentArcs(segments);
    lastSegmentIndexRef.current = findSegmentIndexAtPointer(arcsRef.current, rotationRef.current);
    const winnerIndex = pickWeightedWinnerIndex(segments);
    const finalTarget = computeTargetRotation(
      arcsRef.current,
      winnerIndex,
      rotationRef.current,
      randomIntBetween(CASINO_SPIN_REVOLUTIONS_MIN, CASINO_SPIN_REVOLUTIONS_MAX),
      1,
    );
    // No release velocity from a button press — back into a launch speed from a casino-length spin.
    const casinoDuration = randomBetween(CASINO_SPIN_DURATION_MS_MIN, CASINO_SPIN_DURATION_MS_MAX);
    const launchSpeed = (4 * Math.abs(finalTarget - rotationRef.current)) / casinoDuration;
    setPhase('spinning');
    callbacksRef.current.onFlick();
    runSpinTimeline(
      winnerIndex,
      buildSuspenseTimeline({
        fromRotation: rotationRef.current,
        finalTarget,
        launchSpeedDegPerMs: launchSpeed,
      }),
    );
    return true;
  }, [phase, segments, runSpinTimeline]);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== 'dragging') {
        return;
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const releaseSpeed = velocityFromSamples(samplesRef.current);
      if (Math.abs(releaseSpeed) < WEAK_FLICK_THRESHOLD_DEG_PER_MS) {
        setPhase('rebounding');
        callbacksRef.current.onWeakFlick();
        animateRebound();
        return;
      }
      setPhase('spinning');
      callbacksRef.current.onFlick();
      animateSpin(releaseSpeed);
    },
    [phase, animateRebound, animateSpin],
  );

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return {
    wheelRef,
    phase,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    spinFromButton,
  };
};
