import { useCallback } from 'react';

import { STORAGE_KEYS } from '@common/constants';
import { useLocalStorageState } from '@hooks/useLocalStorageState';
import type { UserVenue } from '@shared-types/index';

interface NewPlace {
  name: string;
  familyId: string;
  cityKey: string;
}

/** localStorage-backed favorites: add (deduped by name within a city) + delete. */
export const useMyPlaces = () => {
  const [places, setPlaces] = useLocalStorageState<UserVenue[]>(STORAGE_KEYS.myPlaces, []);

  const addPlace = useCallback(
    ({ name, familyId, cityKey }: NewPlace) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      setPlaces((previous) => {
        const isDuplicate = previous.some(
          (place) =>
            place.cityKey === cityKey && place.name.trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (isDuplicate) {
          return previous;
        }
        return [
          ...previous,
          {
            id: crypto.randomUUID(),
            name: trimmed,
            familyId,
            cityKey,
            addedAt: new Date().toISOString(),
          },
        ];
      });
    },
    [setPlaces],
  );

  const deletePlace = useCallback(
    (id: string) => setPlaces((previous) => previous.filter((place) => place.id !== id)),
    [setPlaces],
  );

  return { places, addPlace, deletePlace };
};
