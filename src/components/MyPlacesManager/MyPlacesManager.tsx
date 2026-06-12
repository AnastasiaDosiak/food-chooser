import { useState } from 'react';

import { UA_CITIES } from '@common/cities';
import { FAMILIES } from '@common/cuisineFamilies';
import { useTranslation } from '@i18n/useTranslation';
import type { UserVenue } from '@shared-types/index';

import './MyPlacesManager.scss';

interface MyPlacesManagerProps {
  allPlaces: UserVenue[];
  defaultCityId: string;
  onAdd: (place: { name: string; familyId: string; cityKey: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const MyPlacesManager = ({
  allPlaces,
  defaultCityId,
  onAdd,
  onDelete,
  onClose,
}: MyPlacesManagerProps) => {
  const { t } = useTranslation();
  const [cityId, setCityId] = useState(defaultCityId);
  const [name, setName] = useState('');
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);

  const cityPlaces = allPlaces.filter((place) => place.cityKey === cityId);
  const cityLabel = UA_CITIES.find((city) => city.id === cityId)?.label ?? cityId;

  const handleAdd = () => {
    if (!name.trim()) {
      return;
    }
    onAdd({ name, familyId, cityKey: cityId });
    setName('');
  };

  return (
    <div className="my-places" role="dialog" aria-label={t('myPlaces.title')} aria-modal="true">
      <div className="my-places__card">
        <header className="my-places__header">
          <h2 className="my-places__title">{t('myPlaces.title')}</h2>
          <button
            type="button"
            className="my-places__close"
            aria-label={t('myPlaces.close')}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <label className="my-places__field">
          <span>{t('myPlaces.city')}</span>
          <select value={cityId} onChange={(event) => setCityId(event.target.value)}>
            {UA_CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.label}
              </option>
            ))}
          </select>
        </label>

        {cityPlaces.length === 0 ? (
          <p className="my-places__empty">{t('myPlaces.empty', { city: cityLabel })}</p>
        ) : (
          <ul className="my-places__list">
            {cityPlaces.map((place) => {
              const family = FAMILIES.find((option) => option.id === place.familyId);
              return (
                <li key={place.id} className="my-places__item">
                  <span className="my-places__item-emoji">{family?.emoji ?? '⭐'}</span>
                  <span className="my-places__item-name">{place.name}</span>
                  <button
                    type="button"
                    className="my-places__item-delete"
                    aria-label={t('myPlaces.delete', { name: place.name })}
                    onClick={() => onDelete(place.id)}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="my-places__add">
          <input
            className="my-places__name"
            type="text"
            value={name}
            placeholder={t('myPlaces.addPlaceholder', { city: cityLabel })}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
          />
          <select value={familyId} onChange={(event) => setFamilyId(event.target.value)}>
            {FAMILIES.map((family) => (
              <option key={family.id} value={family.id}>
                {family.emoji} {t(`cuisine.${family.id}`)}
              </option>
            ))}
          </select>
          <button type="button" className="my-places__submit" onClick={handleAdd}>
            {t('myPlaces.add')}
          </button>
        </div>
      </div>
    </div>
  );
};
