import { useCallback, useEffect, useRef, useState } from 'react';

import { MIN_OPTIONS_TO_SPIN, STORAGE_KEYS } from '@common/constants';
import type { WheelSegmentOption } from '@shared-types/index';
import { useCasinoAudio } from '@hooks/useCasinoAudio';
import { useWheelSpin } from '@hooks/useWheelSpin';
import { landingBurst } from '@utils/confetti';
import { computeSegmentArcs } from '@utils/wheelMath';

import './Wheel.scss';

const SIZE = 440;
const CENTER = SIZE / 2;
const WHEEL_RADIUS = 186;
const LABEL_RADIUS = WHEEL_RADIUS * 0.6;
const BULB_COUNT = 16;
const BULB_RADIUS = 206;
const MAX_LABEL_CHARS = 16;
const TAUNT_VISIBLE_MS = 2300;

const TAUNTS = [
  'Weak wrist. The house is unimpressed.',
  'That was a caress, not a flick.',
  'Petting the wheel will not feed you.',
  'My grandmother flicks harder.',
] as const;

const readHintSeen = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.flickHintSeen) === '1';
  } catch {
    return false;
  }
};

const persistHintSeen = () => {
  try {
    window.localStorage.setItem(STORAGE_KEYS.flickHintSeen, '1');
  } catch {
    // Storage unavailable — the hint just shows again next visit.
  }
};

const degreesToPoint = (angleDegrees: number, radius: number) => {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(radians),
    y: CENTER - radius * Math.cos(radians),
  };
};

const buildSlicePath = (startAngle: number, endAngle: number) => {
  const start = degreesToPoint(startAngle, WHEEL_RADIUS);
  const end = degreesToPoint(endAngle, WHEEL_RADIUS);
  const isLargeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${isLargeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

const truncateLabel = (label: string) =>
  label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label;

interface WheelProps {
  segments: WheelSegmentOption[];
  /** Plays the 3D flip-in entrance — used when the wheel chains to a new option set. */
  hasFlipEntrance?: boolean;
  onSettle: (winner: WheelSegmentOption) => void;
}

export const Wheel = ({ segments, hasFlipEntrance = false, onSettle }: WheelProps) => {
  const {
    primeAudio,
    playTick,
    playFanfare,
    playTrombone,
    setWheelSpeed,
    startSpinLoop,
    stopSpinLoop,
  } = useCasinoAudio();

  const [isHintSeen, setIsHintSeen] = useState(readHintSeen);
  const [tauntIndex, setTauntIndex] = useState<number | null>(null);
  const tauntTimerRef = useRef(0);

  const handleFlick = useCallback(() => {
    startSpinLoop();
    setIsHintSeen(true);
    persistHintSeen();
  }, [startSpinLoop]);

  const handleWeakFlick = useCallback(() => {
    playTrombone();
    setTauntIndex(Math.floor(Math.random() * TAUNTS.length));
    window.clearTimeout(tauntTimerRef.current);
    tauntTimerRef.current = window.setTimeout(() => setTauntIndex(null), TAUNT_VISIBLE_MS);
  }, [playTrombone]);

  const handleSettle = useCallback(
    (winner: WheelSegmentOption) => {
      stopSpinLoop();
      playFanfare();
      landingBurst();
      onSettle(winner);
    },
    [stopSpinLoop, playFanfare, onSettle],
  );

  useEffect(() => () => window.clearTimeout(tauntTimerRef.current), []);

  const { wheelRef, phase, handlePointerDown, handlePointerMove, handlePointerUp, spinFromButton } =
    useWheelSpin({
      segments,
      onDragStart: primeAudio,
      onBoundaryCross: playTick,
      onFlick: handleFlick,
      onSpeedChange: setWheelSpeed,
      onWeakFlick: handleWeakFlick,
      onSettle: handleSettle,
    });

  const handleSpinButtonClick = useCallback(() => {
    primeAudio();
    spinFromButton();
  }, [primeAudio, spinFromButton]);

  const arcs = computeSegmentArcs(segments);
  const labelFontSize = segments.length > 9 ? 13 : 16;

  return (
    <div className={`wheel${hasFlipEntrance ? ' wheel--flip-in' : ''}`}>
      <div className="wheel__sunburst" />

      <svg className="wheel__frame" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle className="wheel__rim" cx={CENTER} cy={CENTER} r={BULB_RADIUS + 12} />
        {Array.from({ length: BULB_COUNT }, (_, bulbIndex) => {
          const bulbPoint = degreesToPoint((360 / BULB_COUNT) * bulbIndex, BULB_RADIUS);
          return (
            <circle
              key={bulbIndex}
              className={`wheel__bulb${phase === 'spinning' ? ' wheel__bulb--frenzy' : ''}`}
              cx={bulbPoint.x}
              cy={bulbPoint.y}
              r={5}
            />
          );
        })}
      </svg>

      <div
        className={`wheel__rotor${phase === 'dragging' ? ' wheel__rotor--grabbing' : ''}`}
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label="Decision wheel — grab and flick to spin, or press the SPIN button"
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {arcs.map((arc, index) => {
            const segment = segments[index];
            const bisector = (arc.startAngle + arc.endAngle) / 2;
            return (
              <g key={segment.id}>
                {/* A 360° arc path degenerates — a unanimous wheel is just a circle. */}
                {arcs.length === 1 ? (
                  <circle className="wheel__slice" cx={CENTER} cy={CENTER} r={WHEEL_RADIUS} fill={segment.color} />
                ) : (
                  <path className="wheel__slice" d={buildSlicePath(arc.startAngle, arc.endAngle)} fill={segment.color} />
                )}
                <g transform={`rotate(${bisector} ${CENTER} ${CENTER})`}>
                  <text
                    className="wheel__label"
                    x={CENTER}
                    y={CENTER - LABEL_RADIUS}
                    fontSize={labelFontSize}
                    textAnchor="middle"
                    transform={`rotate(90 ${CENTER} ${CENTER - LABEL_RADIUS})`}
                  >
                    {truncateLabel(segment.label)}
                  </text>
                </g>
              </g>
            );
          })}
          <circle className="wheel__axle" cx={CENTER} cy={CENTER} r={10} />
        </svg>
      </div>

      {/* primeAudio on pointerdown so the context is resumed by the time click starts the music. */}
      <button
        type="button"
        className="wheel__spin-button"
        onPointerDown={primeAudio}
        onClick={handleSpinButtonClick}
        disabled={phase !== 'idle' || segments.length < MIN_OPTIONS_TO_SPIN}
      >
        SPIN
      </button>

      <div className={`wheel__pointer${phase === 'spinning' ? ' wheel__pointer--ticking' : ''}`} />

      {!isHintSeen && phase === 'idle' && (
        <div className="wheel__hint">👋 grab &amp; flick — or smash SPIN</div>
      )}
      {tauntIndex !== null && <div className="wheel__taunt">{TAUNTS[tauntIndex]}</div>}
    </div>
  );
};
