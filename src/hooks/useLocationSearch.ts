import { useCallback, useEffect, useRef, useState } from 'react';

import { LOCATION_SEARCH_DEBOUNCE_MS, LOCATION_SEARCH_MIN_CHARS } from '@common/constants';
import type { LocationSuggestion } from '@shared-types/index';
import { searchSettlements } from '@services/photonClient';

/** Debounced Ukrainian-settlement autocomplete (Photon allows client-side type-ahead). */
export const useLocationSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    controllerRef.current?.abort();

    if (query.trim().length < LOCATION_SEARCH_MIN_CHARS) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      controllerRef.current = controller;
      searchSettlements(query.trim(), controller.signal)
        .then((results) => {
          setSuggestions(results);
          setIsSearching(false);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          setSuggestions([]);
          setIsSearching(false);
        });
    }, LOCATION_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(
    () => () => {
      window.clearTimeout(debounceRef.current);
      controllerRef.current?.abort();
    },
    [],
  );

  const reset = useCallback(() => {
    setQuery('');
    setSuggestions([]);
  }, []);

  return { query, setQuery, suggestions, isSearching, reset };
};
