import { useCallback, useMemo } from 'react';

import { MIN_SOLO_RESTAURANT_PICKS, STORAGE_KEYS } from '@common/constants';
import { FOOD_TYPES } from '@common/foodTypes';
import { getRestaurantsByFoodType } from '@common/restaurants';
import { ChoiceCard } from '@components/ChoiceCard/ChoiceCard';
import { HistoryPanel } from '@components/HistoryPanel/HistoryPanel';
import { ModeStep } from '@components/ModeStep/ModeStep';
import { ResultOverlay } from '@components/ResultOverlay/ResultOverlay';
import { SelectionBoard, type SelectionSection } from '@components/SelectionBoard/SelectionBoard';
import { StepShell } from '@components/StepShell/StepShell';
import { TrumpToasty } from '@components/TrumpToasty/TrumpToasty';
import { Wheel } from '@components/Wheel/Wheel';
import { useLocalStorageState } from '@hooks/useLocalStorageState';
import { useWizard } from '@hooks/useWizard';
import type { SpinRecord } from '@shared-types/index';

import './App.scss';

const App = () => {
  const [history, setHistory] = useLocalStorageState<SpinRecord[]>(STORAGE_KEYS.history, []);

  const appendVerdict = useCallback(
    (record: SpinRecord) => setHistory((previousRecords) => [record, ...previousRecords]),
    [setHistory],
  );
  const clearHistory = useCallback(() => setHistory(() => []), [setHistory]);

  const wizard = useWizard({ onFinalVerdict: appendVerdict });
  const isCompany = wizard.partyMode === 'company';

  const selectionSections = useMemo<SelectionSection[]>(() => {
    if (wizard.choiceType === 'food') {
      return [
        {
          id: 'food-types',
          items: FOOD_TYPES.map((foodType) => ({
            id: foodType.id,
            label: foodType.label,
            emoji: foodType.emoji,
          })),
        },
      ];
    }
    return FOOD_TYPES.map((foodType) => ({
      id: foodType.id,
      title: foodType.label,
      emoji: foodType.emoji,
      items: getRestaurantsByFoodType(foodType.id).map((restaurant) => ({
        id: restaurant.id,
        label: restaurant.name,
      })),
    }));
  }, [wizard.choiceType]);

  const renderStage = () => {
    switch (wizard.stage) {
      case 'mode':
        return (
          <StepShell
            kicker="step one — the stakes"
            title="Who's eating tonight?"
            subtitle="be honest. the wheel can smell lies."
          >
            <ModeStep onSelectSolo={wizard.selectSolo} onSelectCompany={wizard.selectCompany} />
          </StepShell>
        );

      case 'choice':
        return (
          <StepShell
            kicker="step two — the hunt"
            title={isCompany ? 'How does the pack gamble?' : 'How do you gamble?'}
            subtitle="by cuisine or by name — pick your poison."
            onBack={wizard.goToMode}
          >
            <div className="app__choice-cards">
              <ChoiceCard
                emoji="🍜"
                title="By food mood"
                description="let the cuisine choose you. details are fate's problem."
                onClick={() => wizard.selectChoiceType('food')}
              />
              <ChoiceCard
                emoji="📍"
                title="By restaurant"
                description="handpick the contenders, then lose control anyway."
                onClick={() => wizard.selectChoiceType('restaurant')}
              />
            </div>
          </StepShell>
        );

      case 'selection': {
        const isFoodBallot = wizard.choiceType === 'food';
        return (
          <StepShell
            kicker={isCompany ? 'step three — the ballot' : 'step three — the lineup'}
            title={
              isFoodBallot
                ? 'Vote the cravings'
                : isCompany
                  ? 'Vote the venues'
                  : 'Pick the contenders'
            }
            subtitle={
              isCompany
                ? `the table seats ${wizard.partySize}. shout your appetites, then count the hands.`
                : 'minimum two. fate refuses a one-horse race.'
            }
            onBack={wizard.goToChoice}
          >
            <SelectionBoard
              sections={selectionSections}
              mode={isCompany ? 'tally' : 'select'}
              partySize={wizard.partySize}
              minSelections={isCompany ? 1 : MIN_SOLO_RESTAURANT_PICKS}
              finishLabel={isCompany ? 'lock the votes' : 'spin destiny'}
              onFinish={wizard.finishSelection}
            />
          </StepShell>
        );
      }

      case 'wheel': {
        const isFoodWheel = wizard.wheelKind === 'food';
        const kicker = isFoodWheel
          ? 'the main event'
          : wizard.chainedFromFood
            ? 'round two — the flip'
            : 'the final table';
        const title = isFoodWheel
          ? 'Whose cuisine reigns supreme?'
          : wizard.chainedFromFood
            ? `${wizard.chainedFromFood.emoji} ${wizard.chainedFromFood.label} it is — but where?`
            : 'Where are we actually going?';
        const subtitle = isFoodWheel
          ? isCompany
            ? 'slices sized by votes. the loud ones got their way.'
            : 'ten cuisines enter. one leaves — with you.'
          : isCompany && !wizard.chainedFromFood
            ? 'weighted by votes — argue with math, not with each other.'
            : 'the wheel never lands where you hope. that is the fun.';
        return (
          <StepShell kicker={kicker} title={title} subtitle={subtitle} onBack={wizard.goToChoice}>
            <Wheel
              key={wizard.wheelMountKey}
              segments={wizard.segments}
              hasFlipEntrance={wizard.hasFlipEntrance}
              onSettle={wizard.handleWheelSettle}
            />
          </StepShell>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__header-stars">★ ★ ★</span>
        <h1 className="app__title">Wheel of Dinner</h1>
        <p className="app__tagline">
          you don't choose the restaurant. the wheel chooses the restaurant.
        </p>
      </header>

      <div className="app__layout">
        <main className="app__stage">{renderStage()}</main>
        <div className="app__history">
          <HistoryPanel records={history} onClear={clearHistory} />
        </div>
      </div>

      {wizard.result && (
        <ResultOverlay
          kind={wizard.result.kind}
          isUnanimous={wizard.result.isUnanimous}
          winnerLabel={wizard.result.winnerLabel}
          winnerEmoji={wizard.result.winnerEmoji}
          viaLabel={wizard.result.viaLabel}
          onContinue={wizard.result.kind === 'intermediate' ? wizard.advanceFromResult : undefined}
          onRespin={
            wizard.result.kind === 'final' && !wizard.result.isUnanimous
              ? wizard.dismissResult
              : undefined
          }
          onStartOver={wizard.startOver}
        />
      )}

      {wizard.result?.kind === 'final' && !wizard.result.isUnanimous && <TrumpToasty />}
    </div>
  );
};

export default App;
