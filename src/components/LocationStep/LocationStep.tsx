import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@i18n/useTranslation';
import type { ChosenLocation, LocationScope } from '@shared-types/index';
import { useLocationSearch } from '@hooks/useLocationSearch';
import { reverseGeocode } from '@services/photonClient';

import './LocationStep.scss';

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 300000,
};

interface LocationStepProps {
  lastLocation: ChosenLocation | null;
  onConfirm: (location: ChosenLocation) => void;
  onOpenMyPlaces?: () => void;
}

export const LocationStep = ({ lastLocation, onConfirm, onOpenMyPlaces }: LocationStepProps) => {
  const { t } = useTranslation();
  const { query, setQuery, suggestions, isSearching, reset } = useLocationSearch();
  // Restore the last-used intent so a returning user keeps their delivery/dine-in choice.
  const [scope, setScope] = useState<LocationScope>(lastLocation?.scope ?? 'near');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const reverseControllerRef = useRef<AbortController | null>(null);

  const confirm = useCallback(
    (label: string, latitude: number, longitude: number, accuracyMeters?: number) => {
      onConfirm({ label, latitude, longitude, scope, accuracyMeters });
      reset();
    },
    [onConfirm, scope, reset],
  );

  const handleUseMyLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError(t('location.geoUnavailable'));
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        reverseControllerRef.current?.abort();
        const controller = new AbortController();
        reverseControllerRef.current = controller;
        // Name the place so the header can show it; degrade to a generic label if reverse fails/offline.
        reverseGeocode(latitude, longitude, controller.signal)
          .then((place) => confirm(place ?? t('location.current'), latitude, longitude, accuracy))
          .catch((error: unknown) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
              return;
            }
            confirm(t('location.current'), latitude, longitude, accuracy);
          })
          .finally(() => setIsLocating(false));
      },
      () => {
        setIsLocating(false);
        setGeoError(t('location.geoDenied'));
      },
      GEO_OPTIONS,
    );
  }, [confirm, t]);

  useEffect(() => () => reverseControllerRef.current?.abort(), []);

  return (
    <div className="location-step">
      <button
        type="button"
        className="location-step__near"
        onClick={handleUseMyLocation}
        disabled={isLocating}
      >
        <span className="location-step__near-emoji">📍</span>
        {isLocating ? t('location.locating') : t('location.near')}
      </button>

      {onOpenMyPlaces && (
        <button type="button" className="location-step__my-places" onClick={onOpenMyPlaces}>
          {t('location.myPlaces')}
        </button>
      )}

      {geoError && <p className="location-step__error">{geoError}</p>}

      <div className="location-step__scope" role="radiogroup" aria-label={t('location.scope.aria')}>
        <button
          type="button"
          className={`location-step__scope-option${scope === 'near' ? ' location-step__scope-option--active' : ''}`}
          aria-pressed={scope === 'near'}
          onClick={() => setScope('near')}
        >
          {t('location.scope.dineIn')}
        </button>
        <button
          type="button"
          className={`location-step__scope-option${scope === 'city' ? ' location-step__scope-option--active' : ''}`}
          aria-pressed={scope === 'city'}
          onClick={() => setScope('city')}
        >
          {t('location.scope.delivery')}
        </button>
      </div>

      <div className="location-step__search">
        <input
          className="location-step__input"
          type="text"
          value={query}
          placeholder={t('location.search.placeholder')}
          onChange={(event) => setQuery(event.target.value)}
        />
        {isSearching && <span className="location-step__searching">{t('location.searching')}</span>}
        {suggestions.length > 0 && (
          <ul className="location-step__suggestions">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className="location-step__suggestion"
                  onClick={() =>
                    confirm(suggestion.label, suggestion.latitude, suggestion.longitude)
                  }
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lastLocation && (
        <button
          type="button"
          className="location-step__recent"
          onClick={() => onConfirm({ ...lastLocation, scope })}
        >
          {t('location.back', { place: lastLocation.label })}
        </button>
      )}
    </div>
  );
};
