import { useState } from 'react';

import { PARTY_SIZE_DEFAULT, PARTY_SIZE_MAX, PARTY_SIZE_MIN } from '@common/constants';
import { ChoiceCard } from '@components/ChoiceCard/ChoiceCard';
import { useTranslation } from '@i18n/useTranslation';

import './ModeStep.scss';

interface ModeStepProps {
  onSelectSolo: () => void;
  onSelectCompany: (partySize: number) => void;
}

export const ModeStep = ({ onSelectSolo, onSelectCompany }: ModeStepProps) => {
  const { t } = useTranslation();
  const [isCompanyPicked, setIsCompanyPicked] = useState(false);
  const [partySize, setPartySize] = useState(PARTY_SIZE_DEFAULT);

  const adjustPartySize = (delta: number) =>
    setPartySize((currentSize) =>
      Math.min(Math.max(currentSize + delta, PARTY_SIZE_MIN), PARTY_SIZE_MAX),
    );

  return (
    <div className="mode-step">
      <div className="mode-step__cards">
        <ChoiceCard
          emoji="🐺"
          title={t('mode.solo.title')}
          description={t('mode.solo.desc')}
          onClick={onSelectSolo}
        />
        <ChoiceCard
          emoji="👥"
          title={t('mode.company.title')}
          description={t('mode.company.desc')}
          isSelected={isCompanyPicked}
          onClick={() => setIsCompanyPicked(true)}
        />
      </div>

      {isCompanyPicked && (
        <div className="mode-step__party">
          <span className="mode-step__party-label">{t('mode.party.label')}</span>
          <div className="mode-step__stepper">
            <button
              type="button"
              className="mode-step__stepper-button"
              onClick={() => adjustPartySize(-1)}
              disabled={partySize <= PARTY_SIZE_MIN}
              aria-label={t('mode.party.fewer')}
            >
              −
            </button>
            <span className="mode-step__party-size">{partySize}</span>
            <button
              type="button"
              className="mode-step__stepper-button"
              onClick={() => adjustPartySize(1)}
              disabled={partySize >= PARTY_SIZE_MAX}
              aria-label={t('mode.party.more')}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="mode-step__confirm"
            onClick={() => onSelectCompany(partySize)}
          >
            {t('mode.confirm')}
          </button>
        </div>
      )}
    </div>
  );
};
