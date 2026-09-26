interface CacheEntry {
  data: unknown;
  domains: readonly string[];
  updatedAt: number;
}

export interface PageDataLoadOptions {
  force?: boolean;
}

// ponytail: session-memory cache capped at five minutes; add durable offline storage only if offline UX requires it.
const cacheMaxAgeMs = 5 * 60_000;
const entries = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

export function getCachedPageData<T>(key: string): T | undefined {
  const entry = entries.get(key);
  if (!entry || Date.now() - entry.updatedAt > cacheMaxAgeMs) {
    if (entry) entries.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function loadCachedPageData<T>(
  key: string,
  domains: readonly string[],
  loader: () => Promise<T>,
  { force = false }: PageDataLoadOptions = {},
): Promise<T> {
  const cached = getCachedPageData<T>(key);
  if (!force && cached !== undefined) return Promise.resolve(cached);

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const request = loader().then((data) => {
    entries.set(key, { data, domains, updatedAt: Date.now() });
    return data;
  }).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, request);
  return request;
}

export function invalidatePageDataCache(domains: readonly string[]) {
  const requested = new Set(domains);
  entries.forEach((entry, key) => {
    if (entry.domains.some((domain) => requested.has(domain))) entries.delete(key);
  });
}
