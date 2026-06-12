import { useCallback, useMemo, useState } from 'react';

import type {
  ChoiceType,
  CuisineGroup,
  PartyMode,
  SpinRecord,
  Venue,
  WheelKind,
  WheelSegmentOption,
} from '@shared-types/index';
import {
  buildChainedVenueSegments,
  buildCuisineSegments,
  buildVenueSegments,
} from '@utils/buildSegments';

export type WizardStage = 'location' | 'mode' | 'choice' | 'selection' | 'wheel';

export interface WheelResult {
  kind: 'intermediate' | 'final';
  isUnanimous: boolean;
  /** The wheel had exactly one option, so it was decided without a spin. */
  isLoneOption?: boolean;
  winnerLabel: string;
  winnerEmoji?: string;
  viaLabel?: string;
}

interface UseWizardParams {
  cuisineGroups: CuisineGroup[];
  onFinalVerdict: (record: SpinRecord) => void;
}

/** The journey: location → mode → choice → selection → wheel (→ chained) → verdict. */
export const useWizard = ({ cuisineGroups, onFinalVerdict }: UseWizardParams) => {
  const [stage, setStage] = useState<WizardStage>('location');
  const [partyMode, setPartyMode] = useState<PartyMode>('solo');
  const [partySize, setPartySize] = useState(1);
  const [choiceType, setChoiceType] = useState<ChoiceType>('food');
  const [wheelKind, setWheelKind] = useState<WheelKind>('food');
  const [segments, setSegments] = useState<WheelSegmentOption[]>([]);
  const [chainedFromGroup, setChainedFromGroup] = useState<CuisineGroup | null>(null);
  const [pendingGroup, setPendingGroup] = useState<CuisineGroup | null>(null);
  const [hasFlipEntrance, setHasFlipEntrance] = useState(false);
  const [wheelMountKey, setWheelMountKey] = useState(0);
  const [result, setResult] = useState<WheelResult | null>(null);

  const allVenues = useMemo<Venue[]>(
    () => cuisineGroups.flatMap((group) => group.venues),
    [cuisineGroups],
  );
  const groupById = useMemo(
    () => new Map(cuisineGroups.map((group) => [group.id, group])),
    [cuisineGroups],
  );

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
    (
      winner: WheelSegmentOption,
      isUnanimous: boolean,
      viaGroup: CuisineGroup | null,
      isLoneOption = false,
    ) => {
      const viaLabel = viaGroup ? `${viaGroup.emoji} ${viaGroup.label}` : undefined;
      setResult({ kind: 'final', isUnanimous, isLoneOption, winnerLabel: winner.label, viaLabel });
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

  const confirmLocation = useCallback(() => setStage('mode'), []);

  const selectChoiceType = useCallback(
    (type: ChoiceType) => {
      setChoiceType(type);
      setChainedFromGroup(null);
      setPendingGroup(null);
      if (type === 'food' && partyMode === 'solo') {
        showWheel(buildCuisineSegments(cuisineGroups), 'food', false);
      } else {
        setStage('selection');
      }
    },
    [partyMode, showWheel, cuisineGroups],
  );

  const finishSelection = useCallback(
    (votesByOptionId: Record<string, number>) => {
      if (choiceType === 'food') {
        const foodSegments = buildCuisineSegments(cuisineGroups, votesByOptionId);
        showWheel(foodSegments, 'food', false);
        if (foodSegments.length === 1) {
          const unanimousGroup = groupById.get(foodSegments[0].id);
          if (unanimousGroup) {
            setPendingGroup(unanimousGroup);
            setResult({
              kind: 'intermediate',
              isUnanimous: true,
              winnerLabel: unanimousGroup.label,
              winnerEmoji: unanimousGroup.emoji,
            });
          }
        }
        return;
      }

      const restaurantSegments = buildVenueSegments(allVenues, votesByOptionId);
      showWheel(restaurantSegments, 'restaurant', false);
      if (restaurantSegments.length === 1) {
        finalize(restaurantSegments[0], true, null);
      }
    },
    [choiceType, cuisineGroups, allVenues, groupById, showWheel, finalize],
  );

  const handleWheelSettle = useCallback(
    (winner: WheelSegmentOption) => {
      if (wheelKind === 'food') {
        const winningGroup = groupById.get(winner.id);
        if (winningGroup) {
          setPendingGroup(winningGroup);
          setResult({
            kind: 'intermediate',
            isUnanimous: false,
            winnerLabel: winningGroup.label,
            winnerEmoji: winningGroup.emoji,
          });
        }
        return;
      }
      finalize(winner, false, chainedFromGroup);
    },
    [wheelKind, groupById, finalize, chainedFromGroup],
  );

  const advanceFromResult = useCallback(() => {
    if (!pendingGroup) {
      return;
    }
    const venueSegments = buildChainedVenueSegments(pendingGroup);
    setChainedFromGroup(pendingGroup);
    setPendingGroup(null);
    // A cuisine with a single venue: a spin can't change the answer, so don't fake one.
    if (venueSegments.length === 1) {
      finalize(venueSegments[0], false, pendingGroup, true);
      return;
    }
    showWheel(venueSegments, 'restaurant', true);
  }, [pendingGroup, showWheel, finalize]);

  const dismissResult = useCallback(() => setResult(null), []);

  const goToLocation = useCallback(() => setStage('location'), []);
  const goToMode = useCallback(() => setStage('mode'), []);
  const goToChoice = useCallback(() => setStage('choice'), []);

  const startOver = useCallback(() => {
    setStage('location');
    setPartyMode('solo');
    setPartySize(1);
    setChoiceType('food');
    setWheelKind('food');
    setSegments([]);
    setChainedFromGroup(null);
    setPendingGroup(null);
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
    chainedFromGroup,
    hasFlipEntrance,
    wheelMountKey,
    result,
    confirmLocation,
    selectSolo,
    selectCompany,
    selectChoiceType,
    finishSelection,
    handleWheelSettle,
    advanceFromResult,
    dismissResult,
    goToLocation,
    goToMode,
    goToChoice,
    startOver,
  };
};
