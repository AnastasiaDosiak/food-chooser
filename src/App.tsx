import { useCallback, useMemo, useRef, useState } from 'react';

import { nearestCity, UA_CITIES } from '@common/cities';
import {
  MIN_SOLO_RESTAURANT_PICKS,
  SELECTION_VENUES_PER_FAMILY,
  STORAGE_KEYS,
} from '@common/constants';
import { ChoiceCard } from '@components/ChoiceCard/ChoiceCard';
import { HistoryPanel } from '@components/HistoryPanel/HistoryPanel';
import { LanguageSwitcher } from '@components/LanguageSwitcher/LanguageSwitcher';
import { LocationStep } from '@components/LocationStep/LocationStep';
import { ModeStep } from '@components/ModeStep/ModeStep';
import { MyPlacesManager } from '@components/MyPlacesManager/MyPlacesManager';
import { ResultOverlay } from '@components/ResultOverlay/ResultOverlay';
import { SelectionBoard, type SelectionSection } from '@components/SelectionBoard/SelectionBoard';
import { StepShell } from '@components/StepShell/StepShell';
import { TrumpToasty } from '@components/TrumpToasty/TrumpToasty';
import { Wheel } from '@components/Wheel/Wheel';
import { useLocalStorageState } from '@hooks/useLocalStorageState';
import { useTheme } from '@hooks/useTheme';
import { useMyPlaces } from '@hooks/useMyPlaces';
import { useVenues } from '@hooks/useVenues';
import { useWizard } from '@hooks/useWizard';
import { useTranslation } from '@i18n/useTranslation';
import { deriveCuisineGroups } from '@utils/deriveCuisineGroups';
import { cityKeyFor, mergeUserPlacesIntoGroups } from '@utils/myPlaces';
import { buildOrderLinks } from '@utils/orderLinks';
import type { ChosenLocation, SpinRecord } from '@shared-types/index';

import './App.scss';

const App = () => {
  const { theme, toggle: toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [history, setHistory] = useLocalStorageState<SpinRecord[]>(STORAGE_KEYS.history, []);
  const [lastLocation, setLastLocation] = useLocalStorageState<ChosenLocation | null>(
    STORAGE_KEYS.lastLocation,
    null,
  );
  const [location, setLocation] = useState<ChosenLocation | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { places: myPlaces, addPlace, deletePlace } = useMyPlaces();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const cityKey = useMemo(() => (location ? cityKeyFor(location) : null), [location]);
  const myPlacesForCity = useMemo(
    () => (cityKey ? myPlaces.filter((place) => place.cityKey === cityKey) : []),
    [myPlaces, cityKey],
  );

  const defaultManagerCityId = useMemo(() => {
    const reference = location ?? lastLocation;
    const city = reference ? nearestCity(reference.latitude, reference.longitude) : null;
    return city?.id ?? UA_CITIES[0].id;
  }, [location, lastLocation]);

  const locationRef = useRef<ChosenLocation | null>(null);
  locationRef.current = location;

  const appendVerdict = useCallback(
    (record: SpinRecord) =>
      setHistory((previousRecords) => [
        { ...record, locationLabel: locationRef.current?.label },
        ...previousRecords,
      ]),
    [setHistory],
  );
  const clearHistory = useCallback(() => setHistory(() => []), [setHistory]);

  const {
    status: venuesStatus,
    venues,
    error: venuesError,
    retry: retryVenues,
  } = useVenues(location);
  const cuisineGroups = useMemo(() => {
    const merged = mergeUserPlacesIntoGroups(deriveCuisineGroups(venues), myPlacesForCity);
    return merged.map((group) => {
      const cuisineKey = `cuisine.${group.id}`;
      const translated = t(cuisineKey);
      return { ...group, label: translated === cuisineKey ? group.label : translated };
    });
  }, [venues, myPlacesForCity, t]);

  const wizard = useWizard({ cuisineGroups, onFinalVerdict: appendVerdict });
  const isCompany = wizard.partyMode === 'company';

  const handleConfirmLocation = useCallback(
    (chosen: ChosenLocation) => {
      setLocation(chosen);
      setLastLocation(() => chosen);
      wizard.confirmLocation();
    },
    [setLastLocation, wizard],
  );

  const orderLinks = useMemo(() => (location ? buildOrderLinks(location) : undefined), [location]);

  const selectionSections = useMemo<SelectionSection[]>(() => {
    if (wizard.choiceType === 'food') {
      return [
        {
          id: 'cuisines',
          items: cuisineGroups.map((group) => ({
            id: group.id,
            label: group.label,
            emoji: group.emoji,
            isUserAdded: group.venues.some((venue) => venue.isUserAdded),
          })),
        },
      ];
    }
    return cuisineGroups.map((group) => ({
      id: group.id,
      title: group.label,
      emoji: group.emoji,
      items: group.venues.slice(0, SELECTION_VENUES_PER_FAMILY).map((venue) => ({
        id: venue.id,
        label: venue.name,
        isUserAdded: venue.isUserAdded,
      })),
    }));
  }, [wizard.choiceType, cuisineGroups]);

  const renderStage = () => {
    switch (wizard.stage) {
      case 'location':
        return (
          <StepShell
            kicker={t('step.location.kicker')}
            title={t('step.location.title')}
            subtitle={t('step.location.subtitle')}
          >
            <LocationStep
              lastLocation={lastLocation}
              onConfirm={handleConfirmLocation}
              onOpenMyPlaces={() => setIsManagerOpen(true)}
            />
          </StepShell>
        );

      case 'mode':
        return (
          <StepShell
            kicker={t('step.mode.kicker')}
            title={t('step.mode.title')}
            subtitle={t('step.mode.subtitle')}
            onBack={wizard.goToLocation}
          >
            <ModeStep onSelectSolo={wizard.selectSolo} onSelectCompany={wizard.selectCompany} />
          </StepShell>
        );

      case 'choice':
        return (
          <StepShell
            kicker={t('step.choice.kicker')}
            title={isCompany ? t('step.choice.title.company') : t('step.choice.title.solo')}
            subtitle={t('step.choice.subtitle')}
            onBack={wizard.goToMode}
          >
            {venuesStatus === 'ready' && cuisineGroups.length > 0 ? (
              <div className="app__choice-cards">
                <ChoiceCard
                  emoji="🍜"
                  title={t('choice.food.title')}
                  description={t('choice.food.desc')}
                  onClick={() => wizard.selectChoiceType('food')}
                />
                <ChoiceCard
                  emoji="📍"
                  title={t('choice.restaurant.title')}
                  description={t('choice.restaurant.desc')}
                  onClick={() => wizard.selectChoiceType('restaurant')}
                />
              </div>
            ) : (
              <div className="app__venue-status">
                {venuesStatus === 'loading' && <p>{t('venues.loading')}</p>}
                {venuesStatus === 'error' && (
                  <>
                    <p>{t('venues.error', { error: venuesError ?? '' })}</p>
                    <button type="button" className="app__retry" onClick={retryVenues}>
                      {t('venues.retry')}
                    </button>
                  </>
                )}
                {venuesStatus === 'ready' && cuisineGroups.length === 0 && (
                  <>
                    <p>{t('venues.empty')}</p>
                    <button type="button" className="app__retry" onClick={wizard.goToLocation}>
                      {t('venues.changeLocation')}
                    </button>
                  </>
                )}
              </div>
            )}
          </StepShell>
        );

      case 'selection': {
        const isFoodBallot = wizard.choiceType === 'food';
        return (
          <StepShell
            kicker={
              isCompany ? t('step.selection.kicker.ballot') : t('step.selection.kicker.lineup')
            }
            title={
              isFoodBallot
                ? t('step.selection.title.cravings')
                : isCompany
                  ? t('step.selection.title.venues')
                  : t('step.selection.title.pick')
            }
            subtitle={
              isCompany
                ? t('step.selection.subtitle.company', { size: wizard.partySize })
                : t('step.selection.subtitle.solo')
            }
            onBack={wizard.goToChoice}
          >
            <SelectionBoard
              sections={selectionSections}
              mode={isCompany ? 'tally' : 'select'}
              partySize={wizard.partySize}
              minSelections={isCompany ? 1 : MIN_SOLO_RESTAURANT_PICKS}
              finishLabel={isCompany ? t('selection.finish.votes') : t('selection.finish.spin')}
              onFinish={wizard.finishSelection}
              onAddItem={
                wizard.choiceType === 'restaurant' && cityKey
                  ? (familyId, name) => addPlace({ name, familyId, cityKey })
                  : undefined
              }
            />
          </StepShell>
        );
      }

      case 'wheel': {
        const isFoodWheel = wizard.wheelKind === 'food';
        const kicker = isFoodWheel
          ? t('step.wheel.kicker.main')
          : wizard.chainedFromGroup
            ? t('step.wheel.kicker.flip')
            : t('step.wheel.kicker.final');
        const title = isFoodWheel
          ? t('step.wheel.title.food')
          : wizard.chainedFromGroup
            ? t('step.wheel.title.flip', {
                cuisine: `${wizard.chainedFromGroup.emoji} ${wizard.chainedFromGroup.label}`,
              })
            : t('step.wheel.title.final');
        const subtitle = isFoodWheel
          ? isCompany
            ? t('step.wheel.subtitle.foodCompany')
            : t('step.wheel.subtitle.foodSolo')
          : isCompany && !wizard.chainedFromGroup
            ? t('step.wheel.subtitle.companyVotes')
            : t('step.wheel.subtitle.fate');
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
      <button
        className="app__theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '🍳' : '🌙'}
      </button>
      <header className="app__header">
        <div className="app__lang">
          <LanguageSwitcher />
        </div>
        <span className="app__header-stars">★ ★ ★</span>
        <h1 className="app__title">{t('app.title')}</h1>
        <p className="app__tagline">{t('app.tagline')}</p>
        {location && (
          <p className="app__location">
            {location.accuracyMeters != null
              ? t('header.location.gps', {
                  place: location.label,
                  meters: Math.round(location.accuracyMeters),
                })
              : t('header.location.city', { place: location.label })}
          </p>
        )}
      </header>

      <div className="app__layout">
        <main className="app__stage">{renderStage()}</main>
        <div className={`app__history${isHistoryOpen ? ' app__history--open' : ''}`}>
          <HistoryPanel records={history} onClear={clearHistory} />
        </div>
      </div>

      {isHistoryOpen && (
        <button
          type="button"
          className="app__history-backdrop"
          aria-label={t('app.closeHistory')}
          onClick={() => setIsHistoryOpen(false)}
        />
      )}
      <button
        type="button"
        className="app__history-toggle"
        aria-expanded={isHistoryOpen}
        onClick={() => setIsHistoryOpen((open) => !open)}
      >
        🏆 {history.length}
      </button>

      <footer className="app__attribution">{t('app.attribution')}</footer>

      {isManagerOpen && (
        <MyPlacesManager
          allPlaces={myPlaces}
          defaultCityId={defaultManagerCityId}
          onAdd={addPlace}
          onDelete={deletePlace}
          onClose={() => setIsManagerOpen(false)}
        />
      )}

      {wizard.result && (
        <ResultOverlay
          kind={wizard.result.kind}
          isUnanimous={wizard.result.isUnanimous}
          isLoneOption={wizard.result.isLoneOption}
          winnerLabel={wizard.result.winnerLabel}
          winnerEmoji={wizard.result.winnerEmoji}
          viaLabel={wizard.result.viaLabel}
          orderLinks={
            wizard.result.kind === 'final' && !wizard.result.isUnanimous ? orderLinks : undefined
          }
          onContinue={wizard.result.kind === 'intermediate' ? wizard.advanceFromResult : undefined}
          onRespin={
            wizard.result.kind === 'final' &&
            !wizard.result.isUnanimous &&
            !wizard.result.isLoneOption
              ? wizard.dismissResult
              : undefined
          }
          onStartOver={wizard.startOver}
        />
      )}

      {wizard.result?.kind === 'final' &&
        !wizard.result.isUnanimous &&
        !wizard.result.isLoneOption && <TrumpToasty />}
    </div>
  );
};

export default App;
