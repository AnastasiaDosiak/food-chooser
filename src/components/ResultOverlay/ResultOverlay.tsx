import { useEffect } from 'react';

import { startCannonade } from '@utils/confetti';

import './ResultOverlay.scss';

const FLIP_AUTO_CONTINUE_MS = 2200;

interface ResultOverlayProps {
  /** `intermediate` = a food type won and the wheel is about to flip; `final` = dinner is decided. */
  kind: 'intermediate' | 'final';
  isUnanimous?: boolean;
  winnerLabel: string;
  winnerEmoji?: string;
  viaLabel?: string;
  onContinue?: () => void;
  onRespin?: () => void;
  onStartOver?: () => void;
}

export const ResultOverlay = ({
  kind,
  isUnanimous = false,
  winnerLabel,
  winnerEmoji,
  viaLabel,
  onContinue,
  onRespin,
  onStartOver,
}: ResultOverlayProps) => {
  useEffect(() => {
    if (kind !== 'final') {
      return undefined;
    }
    return startCannonade();
  }, [kind]);

  useEffect(() => {
    if (kind !== 'intermediate' || !onContinue) {
      return undefined;
    }
    const autoContinueTimer = setTimeout(onContinue, FLIP_AUTO_CONTINUE_MS);
    return () => clearTimeout(autoContinueTimer);
  }, [kind, onContinue]);

  const kickerText =
    kind === 'final'
      ? isUnanimous
        ? 'unanimous — you didn’t even need me'
        : 'the wheel has spoken'
      : isUnanimous
        ? 'unanimous appetite detected'
        : 'the wheel demands';

  return (
    <div className="result-overlay" role="dialog" aria-live="assertive">
      <div className="result-overlay__card">
        <span className="result-overlay__kicker">{kickerText}</span>
        {viaLabel && <span className="result-overlay__via">{viaLabel} →</span>}
        <h2 className="result-overlay__winner">
          {winnerEmoji && <span className="result-overlay__emoji">{winnerEmoji}</span>}
          {winnerLabel}
        </h2>

        {kind === 'intermediate' ? (
          <>
            <p className="result-overlay__note">flipping the wheel to {winnerLabel.toLowerCase()} territory…</p>
            <button type="button" className="result-overlay__action" onClick={onContinue}>
              flip it now →
            </button>
          </>
        ) : (
          <>
            <p className="result-overlay__note">no take-backs. the house is hungry too.</p>
            <div className="result-overlay__actions">
              {onRespin && (
                <button type="button" className="result-overlay__action" onClick={onRespin}>
                  tempt fate again 🎲
                </button>
              )}
              <button
                type="button"
                className="result-overlay__action result-overlay__action--ghost"
                onClick={onStartOver}
              >
                start over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
