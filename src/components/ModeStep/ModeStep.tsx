import { useState } from 'react';

import { PARTY_SIZE_DEFAULT, PARTY_SIZE_MAX, PARTY_SIZE_MIN } from '@common/constants';
import { ChoiceCard } from '@components/ChoiceCard/ChoiceCard';

import './ModeStep.scss';

interface ModeStepProps {
  onSelectSolo: () => void;
  onSelectCompany: (partySize: number) => void;
}

export const ModeStep = ({ onSelectSolo, onSelectCompany }: ModeStepProps) => {
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
          title="Lone wolf"
          description="table for one. the wheel respects that."
          onClick={onSelectSolo}
        />
        <ChoiceCard
          emoji="👥"
          title="The pack"
          description="many mouths, one verdict. votes will be counted."
          isSelected={isCompanyPicked}
          onClick={() => setIsCompanyPicked(true)}
        />
      </div>

      {isCompanyPicked && (
        <div className="mode-step__party">
          <span className="mode-step__party-label">how many hungry souls?</span>
          <div className="mode-step__stepper">
            <button
              type="button"
              className="mode-step__stepper-button"
              onClick={() => adjustPartySize(-1)}
              disabled={partySize <= PARTY_SIZE_MIN}
              aria-label="Fewer people"
            >
              −
            </button>
            <span className="mode-step__party-size">{partySize}</span>
            <button
              type="button"
              className="mode-step__stepper-button"
              onClick={() => adjustPartySize(1)}
              disabled={partySize >= PARTY_SIZE_MAX}
              aria-label="More people"
            >
              +
            </button>
          </div>
          <button type="button" className="mode-step__confirm" onClick={() => onSelectCompany(partySize)}>
            assemble the jury →
          </button>
        </div>
      )}
    </div>
  );
};
