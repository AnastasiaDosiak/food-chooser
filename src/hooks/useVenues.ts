import { useCallback, useEffect, useRef, useState } from 'react';

import { STORAGE_KEYS, VENUE_CACHE_TTL_MS } from '@common/constants';
import type { ChosenLocation, Venue } from '@shared-types/index';
import { fetchVenues } from '@services/overpassClient';

export type VenuesStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CachedVenues {
  timestamp: number;
  venues: Venue[];
}

/** Coarse key — nearby points share a cache entry; scope splits near vs city. */
const cacheKeyFor = (location: ChosenLocation) =>
  `${STORAGE_KEYS.venueCachePrefix}${location.latitude.toFixed(3)}.${location.longitude.toFixed(3)}.${location.scope}`;

const readCache = (key: string): Venue[] | null => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const cached = JSON.parse(raw) as CachedVenues;
    return Date.now() - cached.timestamp < VENUE_CACHE_TTL_MS ? cached.venues : null;
  } catch {
    return null;
  }
};

const writeCache = (key: string, venues: Venue[]) => {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ timestamp: Date.now(), venues } satisfies CachedVenues),
    );
  } catch {
    // Cache is best-effort; a full quota just means we refetch next time.
  }
};

/** Owns the venue fetch for the chosen location: status, data, error, manual retry. */
export const useVenues = (location: ChosenLocation | null) => {
  const [status, setStatus] = useState<VenuesStatus>('idle');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback((target: ChosenLocation, useCache: boolean) => {
    const requestId = (requestIdRef.current += 1);
    const key = cacheKeyFor(target);

    if (useCache) {
      const cached = readCache(key);
      if (cached) {
        setVenues(cached);
        setStatus('ready');
        setError(null);
        return;
      }
    }

    setStatus('loading');
    setError(null);
    fetchVenues(target)
      .then((fetched) => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        writeCache(key, fetched);
        setVenues(fetched);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError(caught instanceof Error ? caught.message : 'fetch failed');
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    if (!location) {
      setStatus('idle');
      setVenues([]);
      return;
    }
    load(location, true);
  }, [location, load]);

  const retry = useCallback(() => {
    if (location) {
      load(location, false);
    }
  }, [location, load]);

  return { status, venues, error, retry };
};
