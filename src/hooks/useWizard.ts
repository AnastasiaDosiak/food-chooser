import { useCallback, useState } from 'react';

import { getFoodTypeById } from '@common/foodTypes';
import type {
  ChoiceType,
  FoodType,
  PartyMode,
  SpinRecord,
  WheelKind,
  WheelSegmentOption,
} from '@shared-types/index';
import {
  buildChainedRestaurantSegments,
  buildFoodSegments,
  buildVotedRestaurantSegments,
} from '@utils/buildSegments';

export type WizardStage = 'mode' | 'choice' | 'selection' | 'wheel';

export interface WheelResult {
  kind: 'intermediate' | 'final';
  isUnanimous: boolean;
  winnerLabel: string;
  winnerEmoji?: string;
  viaLabel?: string;
}

interface UseWizardParams {
  onFinalVerdict: (record: SpinRecord) => void;
}

/** The journey: mode → choice → selection → wheel (→ chained wheel) → verdict. */
export const useWizard = ({ onFinalVerdict }: UseWizardParams) => {
  const [stage, setStage] = useState<WizardStage>('mode');
  const [partyMode, setPartyMode] = useState<PartyMode>('solo');
  const [partySize, setPartySize] = useState(1);
  const [choiceType, setChoiceType] = useState<ChoiceType>('food');
  const [wheelKind, setWheelKind] = useState<WheelKind>('food');
  const [segments, setSegments] = useState<WheelSegmentOption[]>([]);
  const [chainedFromFood, setChainedFromFood] = useState<FoodType | null>(null);
  const [pendingFood, setPendingFood] = useState<FoodType | null>(null);
  const [hasFlipEntrance, setHasFlipEntrance] = useState(false);
  const [wheelMountKey, setWheelMountKey] = useState(0);
  const [result, setResult] = useState<WheelResult | null>(null);

  const showWheel = useCallback(
    (nextSegments: WheelSegmentOption[], kind: WheelKind, withFlip: boolean) => {
      setSegments(nextSegments);
      setWheelKind(kind);
      setHasFlipEntrance(withFlip);
      setWheelMountKey((key) => key + 1);
      setResult(null);
      setStage('wheel');
    },
    [],
  );

  const finalize = useCallback(
    (winner: WheelSegmentOption, isUnanimous: boolean, viaFood: FoodType | null) => {
      const viaLabel = viaFood ? `${viaFood.emoji} ${viaFood.label}` : undefined;
      setResult({ kind: 'final', isUnanimous, winnerLabel: winner.label, viaLabel });
      onFinalVerdict({
        id: crypto.randomUUID(),
        winnerLabel: winner.label,
        viaLabel,
        spunAt: new Date().toISOString(),
      });
    },
    [onFinalVerdict],
  );

  const selectSolo = useCallback(() => {
    setPartyMode('solo');
    setPartySize(1);
    setStage('choice');
  }, []);

  const selectCompany = useCallback((size: number) => {
    setPartyMode('company');
    setPartySize(size);
    setStage('choice');
  }, []);

  const selectChoiceType = useCallback(
    (type: ChoiceType) => {
      setChoiceType(type);
      setChainedFromFood(null);
      setPendingFood(null);
      if (type === 'food' && partyMode === 'solo') {
        showWheel(buildFoodSegments(), 'food', false);
      } else {
        setStage('selection');
      }
    },
    [partyMode, showWheel],
  );

  const finishSelection = useCallback(
    (votesByOptionId: Record<string, number>) => {
      if (choiceType === 'food') {
        const foodSegments = buildFoodSegments(votesByOptionId);
        showWheel(foodSegments, 'food', false);
        if (foodSegments.length === 1) {
          const unanimousFood = getFoodTypeById(foodSegments[0].id);
          if (unanimousFood) {
            setPendingFood(unanimousFood);
            setResult({
              kind: 'intermediate',
              isUnanimous: true,
              winnerLabel: unanimousFood.label,
              winnerEmoji: unanimousFood.emoji,
            });
          }
        }
        return;
      }

      const restaurantSegments = buildVotedRestaurantSegments(votesByOptionId);
      showWheel(restaurantSegments, 'restaurant', false);
      if (restaurantSegments.length === 1) {
        finalize(restaurantSegments[0], true, null);
      }
    },
    [choiceType, showWheel, finalize],
  );

  const handleWheelSettle = useCallback(
    (winner: WheelSegmentOption) => {
      if (wheelKind === 'food') {
        const winningFood = getFoodTypeById(winner.id);
        if (winningFood) {
          setPendingFood(winningFood);
          setResult({
            kind: 'intermediate',
            isUnanimous: false,
            winnerLabel: winningFood.label,
            winnerEmoji: winningFood.emoji,
          });
        }
        return;
      }
      finalize(winner, false, chainedFromFood);
    },
    [wheelKind, finalize, chainedFromFood],
  );

  /** Intermediate result confirmed — flip the wheel into the winning food's restaurants. */
  const advanceFromResult = useCallback(() => {
    if (!pendingFood) {
      return;
    }
    setChainedFromFood(pendingFood);
    showWheel(buildChainedRestaurantSegments(pendingFood.id), 'restaurant', true);
    setPendingFood(null);
  }, [pendingFood, showWheel]);

  const dismissResult = useCallback(() => setResult(null), []);

  const goToMode = useCallback(() => setStage('mode'), []);
  const goToChoice = useCallback(() => setStage('choice'), []);

  const startOver = useCallback(() => {
    setStage('mode');
    setPartyMode('solo');
    setPartySize(1);
    setChoiceType('food');
    setWheelKind('food');
    setSegments([]);
    setChainedFromFood(null);
    setPendingFood(null);
    setHasFlipEntrance(false);
    setResult(null);
  }, []);

  return {
    stage,
    partyMode,
    partySize,
    choiceType,
    wheelKind,
    segments,
    chainedFromFood,
    hasFlipEntrance,
    wheelMountKey,
    result,
    selectSolo,
    selectCompany,
    selectChoiceType,
    finishSelection,
    handleWheelSettle,
    advanceFromResult,
    dismissResult,
    goToMode,
    goToChoice,
    startOver,
  };
};
