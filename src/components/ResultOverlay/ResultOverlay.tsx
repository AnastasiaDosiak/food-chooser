import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@i18n/useTranslation';
import type { OrderLinks } from '@shared-types/index';
import { startCannonade } from '@utils/confetti';

import './ResultOverlay.scss';

const FLIP_AUTO_CONTINUE_MS = 2200;

interface ResultOverlayProps {
  /** `intermediate` = a food type won and the wheel is about to flip; `final` = dinner is decided. */
  kind: 'intermediate' | 'final';
  isUnanimous?: boolean;
  isLoneOption?: boolean;
  winnerLabel: string;
  winnerEmoji?: string;
  viaLabel?: string;
  orderLinks?: OrderLinks;
  onContinue?: () => void;
  onRespin?: () => void;
  onStartOver?: () => void;
}

export const ResultOverlay = ({
  kind,
  isUnanimous = false,
  isLoneOption = false,
  winnerLabel,
  winnerEmoji,
  viaLabel,
  orderLinks,
  onContinue,
  onRespin,
  onStartOver,
}: ResultOverlayProps) => {
  const { t } = useTranslation();
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

  const [isCopied, setIsCopied] = useState(false);
  const handleCopyName = useCallback(() => {
    void navigator.clipboard?.writeText(winnerLabel).then(
      () => setIsCopied(true),
      () => setIsCopied(false),
    );
  }, [winnerLabel]);

  const kickerText =
    kind === 'final'
      ? isLoneOption
        ? t('result.kicker.final.lone')
        : isUnanimous
          ? t('result.kicker.final.unanimous')
          : t('result.kicker.final.spoken')
      : isUnanimous
        ? t('result.kicker.intermediate.unanimous')
        : t('result.kicker.intermediate.demands');

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
            <p className="result-overlay__note">
              {t('result.note.flipping', { target: winnerLabel.toLowerCase() })}
            </p>
            <button type="button" className="result-overlay__action" onClick={onContinue}>
              {t('result.flipNow')}
            </button>
          </>
        ) : (
          <>
            <p className="result-overlay__note">
              {isLoneOption ? t('result.note.lone') : t('result.note.final')}
            </p>
            {orderLinks && (
              <div className="result-overlay__order">
                <span className="result-overlay__order-label">
                  {orderLinks.cityLabel
                    ? t('result.order.labelCity', { city: orderLinks.cityLabel })
                    : t('result.order.label')}
                </span>
                <div className="result-overlay__order-links">
                  <a
                    className="result-overlay__order-link"
                    href={orderLinks.glovoUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Glovo ↗
                  </a>
                  <a
                    className="result-overlay__order-link"
                    href={orderLinks.boltUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Bolt Food ↗
                  </a>
                  <button
                    type="button"
                    className="result-overlay__order-copy"
                    onClick={handleCopyName}
                  >
                    {isCopied ? t('result.order.copied') : t('result.order.copy')}
                  </button>
                </div>
              </div>
            )}
            <div className="result-overlay__actions">
              {onRespin && (
                <button type="button" className="result-overlay__action" onClick={onRespin}>
                  {t('result.respin')}
                </button>
              )}
              <button
                type="button"
                className="result-overlay__action result-overlay__action--ghost"
                onClick={onStartOver}
              >
                {t('result.startOver')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
