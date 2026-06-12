import { useEffect, useState } from 'react';

import { pickTrumpPhrase, useToastySound } from '@hooks/useToastySound';

import './TrumpToasty.scss';

const ENTER_DELAY_MS = 600;
const VISIBLE_MS = 2200;
const EXIT_MS = 450;

const PALETTE = {
  skin: '#f2a25c',
  skinShade: '#d9853f',
  hair: '#f7d774',
  hairShade: '#dfb44e',
  suit: '#1f3a5f',
  suitShade: '#162c49',
  shirt: '#f8f6f0',
  tie: '#c0392b',
  tieKnot: '#9c2b20',
  mouth: '#8c3b2e',
  eye: '#3a2a1a',
} as const;

type ToastyPhase = 'hidden' | 'jumping' | 'leaving' | 'done';

/** MK "Toasty!"-style corner pop: the house congratulates you on the choice it made for you. */
export const TrumpToasty = () => {
  const [phase, setPhase] = useState<ToastyPhase>('hidden');
  const [line] = useState(pickTrumpPhrase);
  const { playToasty } = useToastySound();

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setPhase('jumping');
      playToasty(line);
    }, ENTER_DELAY_MS);
    const leaveTimer = setTimeout(() => setPhase('leaving'), ENTER_DELAY_MS + VISIBLE_MS);
    const doneTimer = setTimeout(() => setPhase('done'), ENTER_DELAY_MS + VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [playToasty, line]);

  if (phase === 'hidden' || phase === 'done') {
    return null;
  }

  return (
    <div
      className={`trump-toasty${phase === 'leaving' ? ' trump-toasty--leaving' : ''}`}
      aria-hidden="true"
    >
      <div className="trump-toasty__bubble">{`${line.toUpperCase()}!`}</div>
      <svg className="trump-toasty__figure" viewBox="0 0 200 230">
        <g>
          <path
            d="M58,188 Q46,166 36,144"
            stroke={PALETTE.suit}
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M142,188 Q154,166 164,144"
            stroke={PALETTE.suit}
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="36" cy="134" r="12" fill={PALETTE.skin} />
          <circle cx="164" cy="134" r="12" fill={PALETTE.skin} />
          <circle
            cx="41"
            cy="142"
            r="4.5"
            stroke={PALETTE.skinShade}
            strokeWidth="2.5"
            fill="none"
          />
          <circle
            cx="159"
            cy="142"
            r="4.5"
            stroke={PALETTE.skinShade}
            strokeWidth="2.5"
            fill="none"
          />
        </g>
        <rect x="88" y="146" width="24" height="20" fill={PALETTE.skin} />
        <path
          d="M30,230 L30,206 Q30,178 58,168 L84,160 L116,160 L142,168 Q170,178 170,206 L170,230 Z"
          fill={PALETTE.suit}
        />
        <polygon points="84,162 116,162 100,196" fill={PALETTE.shirt} />
        <polygon points="100,162 76,168 92,202 100,182" fill={PALETTE.suitShade} />
        <polygon points="100,162 124,168 108,202 100,182" fill={PALETTE.suitShade} />
        <polygon points="93,182 107,182 100,194" fill={PALETTE.tieKnot} />
        <path d="M95,192 L105,192 L110,224 L100,230 L90,224 Z" fill={PALETTE.tie} />
        <ellipse cx="54" cy="114" rx="8" ry="12" fill={PALETTE.skin} />
        <ellipse cx="146" cy="114" rx="8" ry="12" fill={PALETTE.skin} />
        <ellipse cx="100" cy="110" rx="45" ry="43" fill={PALETTE.skin} />
        <g>
          <ellipse cx="100" cy="72" rx="51" ry="27" fill={PALETTE.hair} />
          <ellipse cx="52" cy="90" rx="10" ry="15" fill={PALETTE.hair} />
          <ellipse cx="148" cy="90" rx="10" ry="15" fill={PALETTE.hair} />
          <path
            d="M52,88 Q80,100 116,92 Q142,86 150,66 Q158,58 160,70 Q158,94 140,98 Q114,108 82,102 Q62,98 52,88 Z"
            fill={PALETTE.hair}
          />
          <path d="M62,84 Q98,70 138,82" stroke={PALETTE.hairShade} strokeWidth="3" fill="none" />
          <path d="M68,66 Q100,56 132,66" stroke={PALETTE.hairShade} strokeWidth="3" fill="none" />
        </g>
        <g>
          <path
            d="M72,106 L92,102"
            stroke={PALETTE.hairShade}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M108,102 L128,106"
            stroke={PALETTE.hairShade}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M74,114 Q82,108 92,114"
            stroke={PALETTE.eye}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M108,114 Q118,108 126,114"
            stroke={PALETTE.eye}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100,116 Q105,126 98,130"
            stroke={PALETTE.skinShade}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="100" cy="140" rx="10" ry="6.5" fill={PALETTE.mouth} />
        </g>
      </svg>
    </div>
  );
};
