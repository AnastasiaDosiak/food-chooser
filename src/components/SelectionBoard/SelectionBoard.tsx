import { useMemo, useState } from 'react';

import { castVote, countTotalVotes, withdrawVote } from '@utils/voteTally';

import './SelectionBoard.scss';

export interface SelectionItem {
  id: string;
  label: string;
  emoji?: string;
}

export interface SelectionSection {
  id: string;
  title?: string;
  emoji?: string;
  items: SelectionItem[];
}

interface SelectionBoardProps {
  sections: SelectionSection[];
  /** `select` = solo multi-select (on/off); `tally` = company vote counters. */
  mode: 'select' | 'tally';
  partySize: number;
  minSelections: number;
  finishLabel: string;
  onFinish: (votesByOptionId: Record<string, number>) => void;
}

export const SelectionBoard = ({
  sections,
  mode,
  partySize,
  minSelections,
  finishLabel,
  onFinish,
}: SelectionBoardProps) => {
  const [votesByOptionId, setVotesByOptionId] = useState<Record<string, number>>({});

  const handleIncrement = (optionId: string) => {
    setVotesByOptionId((previousVotes) => {
      if (mode === 'tally') {
        return castVote(previousVotes, optionId, partySize);
      }
      const isPicked = (previousVotes[optionId] ?? 0) > 0;
      return { ...previousVotes, [optionId]: isPicked ? 0 : 1 };
    });
  };

  const handleDecrement = (optionId: string) => {
    setVotesByOptionId((previousVotes) => withdrawVote(previousVotes, optionId));
  };

  const { votedOptionCount, totalVotes } = useMemo(
    () => ({
      votedOptionCount: Object.values(votesByOptionId).filter((count) => count > 0).length,
      totalVotes: countTotalVotes(votesByOptionId),
    }),
    [votesByOptionId],
  );

  const canFinish = votedOptionCount >= minSelections;

  const statusText =
    mode === 'select'
      ? `${votedOptionCount} contender${votedOptionCount === 1 ? '' : 's'} picked`
      : `${totalVotes} vote${totalVotes === 1 ? '' : 's'} cast · max ${partySize} per option`;

  const hintText =
    mode === 'select'
      ? `pick at least ${minSelections} — destiny needs options`
      : 'shout, argue, then click — democracy at its finest';

  return (
    <div className="selection-board">
      <div className="selection-board__sections">
        {sections.map((section) => (
          <section key={section.id} className="selection-board__section">
            {section.title && (
              <h3 className="selection-board__section-title">
                <span>{section.emoji}</span> {section.title}
              </h3>
            )}
            <div className="selection-board__grid">
              {section.items.map((item) => {
                const voteCount = votesByOptionId[item.id] ?? 0;
                const isActive = voteCount > 0;
                const isOptionFull = mode === 'tally' && voteCount >= partySize;
                return (
                  <div
                    key={item.id}
                    className={`selection-board__chip${isActive ? ' selection-board__chip--active' : ''}`}
                  >
                    <button
                      type="button"
                      className="selection-board__chip-main"
                      disabled={isOptionFull}
                      onClick={() => handleIncrement(item.id)}
                    >
                      {item.emoji && <span className="selection-board__chip-emoji">{item.emoji}</span>}
                      <span className="selection-board__chip-label">{item.label}</span>
                      {mode === 'tally' && isActive && (
                        <span className="selection-board__chip-count">{voteCount}</span>
                      )}
                      {mode === 'select' && isActive && (
                        <span className="selection-board__chip-check">✓</span>
                      )}
                    </button>
                    {mode === 'tally' && isActive && (
                      <button
                        type="button"
                        className="selection-board__chip-minus"
                        aria-label={`Remove a vote from ${item.label}`}
                        onClick={() => handleDecrement(item.id)}
                      >
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="selection-board__footer">
        <div className="selection-board__status">
          <span className="selection-board__status-count">{statusText}</span>
          <span className="selection-board__status-hint">{hintText}</span>
        </div>
        <button
          type="button"
          className="selection-board__finish"
          disabled={!canFinish}
          onClick={() => onFinish(votesByOptionId)}
        >
          {finishLabel}
        </button>
      </footer>
    </div>
  );
};
