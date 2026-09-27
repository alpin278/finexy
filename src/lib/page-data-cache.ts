interface CacheEntry {
  data: unknown;
  domains: readonly string[];
  updatedAt: number;
}

export interface PageDataLoadOptions {
  force?: boolean;
}

// ponytail: memory-only stale-while-revalidate cache; add durable storage only after a security review.
const cacheMaxAgeMs = 5 * 60_000;
const entries = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
let cacheOwnerId: string | null | undefined;
let cacheGeneration = 0;

export function getCachedPageData<T>(key: string): T | undefined {
  return entries.get(key)?.data as T | undefined;
}

export function isPageDataCacheFresh(key: string) {
  const entry = entries.get(key);
  return Boolean(entry && Date.now() - entry.updatedAt <= cacheMaxAgeMs);
}

export function isPageDataRequestInFlight(key: string) {
  return inFlight.has(key);
}

export function loadCachedPageData<T>(
  key: string,
  domains: readonly string[],
  loader: () => Promise<T>,
  { force = false }: PageDataLoadOptions = {},
): Promise<T> {
  const cached = getCachedPageData<T>(key);
  if (!force && cached !== undefined && isPageDataCacheFresh(key)) return Promise.resolve(cached);

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const generation = cacheGeneration;
  const request = loader().then((data) => {
    if (generation === cacheGeneration) entries.set(key, { data, domains, updatedAt: Date.now() });
    return data;
  }).finally(() => {
    if (inFlight.get(key) === request) inFlight.delete(key);
  });
  inFlight.set(key, request);
  return request;
}

export function invalidatePageDataCache(domains: readonly string[]) {
  cacheGeneration += 1;
  inFlight.clear();
  const requested = new Set(domains);
  entries.forEach((entry, key) => {
    if (entry.domains.some((domain) => requested.has(domain))) entries.delete(key);
  });
}

export function clearPageDataCache() {
  cacheGeneration += 1;
  entries.clear();
  inFlight.clear();
}

export function setPageDataCacheOwner(userId: string | null) {
  if (cacheOwnerId === userId) return;
  clearPageDataCache();
  cacheOwnerId = userId;
}
