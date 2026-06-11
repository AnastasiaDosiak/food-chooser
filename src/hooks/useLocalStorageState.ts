import { useCallback, useState } from 'react';

/** localStorage-backed state with an in-memory fallback when storage is unavailable. */
export const useLocalStorageState = <T>(storageKey: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      return storedValue === null ? initialValue : (JSON.parse(storedValue) as T);
    } catch {
      return initialValue;
    }
  });

  const setAndPersist = useCallback(
    (updater: (previousValue: T) => T) => {
      setValue((previousValue) => {
        const nextValue = updater(previousValue);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
        } catch {
          // Storage unavailable — the session still works in memory.
        }
        return nextValue;
      });
    },
    [storageKey],
  );

  return [value, setAndPersist] as const;
};
