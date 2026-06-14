import { useMemo, useState } from 'react';

import { pluralUk } from '@i18n/translate';
import { useTranslation } from '@i18n/useTranslation';
import { castVote, countTotalVotes, withdrawVote } from '@utils/voteTally';

import './SelectionBoard.scss';

export interface SelectionItem {
  id: string;
  label: string;
  emoji?: string;
  /** True for a user's My-Place addition — gets a ⭐ badge + highlight so they spot it. */
  isUserAdded?: boolean;
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
  /** When set, each section shows an inline "add a place" row (sectionId = cuisine-family id). */
  onAddItem?: (sectionId: string, name: string) => void;
}

export const SelectionBoard = ({
  sections,
  mode,
  partySize,
  minSelections,
  finishLabel,
  onFinish,
  onAddItem,
}: SelectionBoardProps) => {
  const { t, language } = useTranslation();
  const [votesByOptionId, setVotesByOptionId] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const handleAddItem = (sectionId: string) => {
    const name = (drafts[sectionId] ?? '').trim();
    if (!name) {
      return;
    }
    onAddItem?.(sectionId, name);
    setDrafts((previous) => ({ ...previous, [sectionId]: '' }));
  };

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

  const pluralNoun = (base: string, count: number) => {
    const one = t(`selection.noun.${base}.one`);
    const few = t(`selection.noun.${base}.few`);
    const many = t(`selection.noun.${base}.many`);
    return language === 'uk' ? pluralUk(count, one, few, many) : count === 1 ? one : few;
  };

  const statusText =
    mode === 'select'
      ? t('selection.status.picked', {
          count: votedOptionCount,
          noun: pluralNoun('contender', votedOptionCount),
        })
      : t('selection.status.cast', {
          count: totalVotes,
          noun: pluralNoun('vote', totalVotes),
          max: partySize,
        });

  const hintText =
    mode === 'select'
      ? t('selection.hint.select', { min: minSelections })
      : t('selection.hint.tally');

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
                    className={`selection-board__chip${isActive ? ' selection-board__chip--active' : ''}${item.isUserAdded ? ' selection-board__chip--mine' : ''}`}
                  >
                    <button
                      type="button"
                      className="selection-board__chip-main"
                      disabled={isOptionFull}
                      onClick={() => handleIncrement(item.id)}
                    >
                      {item.emoji && (
                        <span className="selection-board__chip-emoji">{item.emoji}</span>
                      )}
                      <span className="selection-board__chip-label">{item.label}</span>
                      {item.isUserAdded && (
                        <span className="selection-board__chip-mine" aria-hidden="true">⭐</span>
                      )}
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
                        aria-label={t('selection.removeVote', { label: item.label })}
                        onClick={() => handleDecrement(item.id)}
                      >
                        −
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {onAddItem && (
              <form
                className="selection-board__add"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAddItem(section.id);
                }}
              >
                <input
                  className="selection-board__add-input"
                  type="text"
                  value={drafts[section.id] ?? ''}
                  placeholder={t('selection.add.placeholder')}
                  onChange={(event) =>
                    setDrafts((previous) => ({ ...previous, [section.id]: event.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="selection-board__add-button"
                  aria-label={t('selection.add.submit')}
                >
                  ➕
                </button>
              </form>
            )}
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
