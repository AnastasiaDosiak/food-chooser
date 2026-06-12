import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@i18n/useTranslation';
import type { SpinRecord } from '@shared-types/index';
import { useCasinoAudio } from '@hooks/useCasinoAudio';

import './HistoryPanel.scss';

const BURN_DURATION_MS = 1700;
const EMBER_COUNT = 14;
/** Lets AudioContext.resume() settle after the click gesture before the fwoosh. */
const FWOOSH_DELAY_MS = 60;

const formatTime = (isoTimestamp: string) =>
  new Date(isoTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface HistoryPanelProps {
  records: SpinRecord[];
  onClear: () => void;
}

export const HistoryPanel = ({ records, onClear }: HistoryPanelProps) => {
  const { t } = useTranslation();
  const [isBurning, setIsBurning] = useState(false);
  const burnTimerRef = useRef(0);
  const fwooshTimerRef = useRef(0);
  const { primeAudio, playFireFwoosh } = useCasinoAudio();

  const handleBurnClick = () => {
    if (isBurning || records.length === 0) {
      return;
    }
    primeAudio();
    fwooshTimerRef.current = window.setTimeout(playFireFwoosh, FWOOSH_DELAY_MS);
    setIsBurning(true);
    burnTimerRef.current = window.setTimeout(() => {
      onClear();
      setIsBurning(false);
    }, BURN_DURATION_MS);
  };

  useEffect(
    () => () => {
      window.clearTimeout(burnTimerRef.current);
      window.clearTimeout(fwooshTimerRef.current);
    },
    [],
  );

  return (
    <aside className="history-panel">
      <div className={`history-panel__paper${isBurning ? ' history-panel__paper--burning' : ''}`}>
        <header className="history-panel__header">
          <span className="history-panel__brand">{t('history.brand')}</span>
          <h3 className="history-panel__title">{t('history.title')}</h3>
          <span className="history-panel__subtitle">
            {t('history.verdicts', { count: records.length })}
          </span>
        </header>

        {records.length === 0 ? (
          <p className="history-panel__empty">
            {t('history.empty.line1')}
            <br />
            {t('history.empty.line2')}
          </p>
        ) : (
          <ul className="history-panel__list">
            {records.map((record) => (
              <li key={record.id} className="history-panel__entry">
                <span className="history-panel__time">{formatTime(record.spunAt)}</span>
                <span className="history-panel__label">
                  {record.viaLabel ? `${record.viaLabel} → ` : ''}
                  {record.winnerLabel}
                </span>
                {record.locationLabel && (
                  <span className="history-panel__place">{record.locationLabel}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {records.length > 0 && (
          <button
            type="button"
            className="history-panel__clear"
            disabled={isBurning}
            onClick={handleBurnClick}
          >
            {isBurning ? t('history.burning') : t('history.burn')}
          </button>
        )}
      </div>

      {isBurning && (
        <div className="history-panel__fire" aria-hidden="true">
          <svg className="history-panel__fire-defs" width="0" height="0">
            <filter id="ledger-fire" x="-30%" y="-30%" width="160%" height="160%">
              {/* Animated noise warps the flat heat-gradient into living, licking flames. */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.016 0.04"
                numOctaves="3"
                seed="7"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="2.4s"
                  values="0.016 0.04;0.028 0.085;0.02 0.05;0.016 0.04"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="38"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </svg>
          <div className="history-panel__glow" />
          <div className="history-panel__flames" />
          <div className="history-panel__embers">
            {Array.from({ length: EMBER_COUNT }, (_, emberIndex) => (
              <span key={emberIndex} className="history-panel__ember" />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
