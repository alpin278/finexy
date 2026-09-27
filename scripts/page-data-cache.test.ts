import assert from 'node:assert/strict';
import {
  clearPageDataCache,
  getCachedPageData,
  isPageDataCacheFresh,
  loadCachedPageData,
  setPageDataCacheOwner,
} from '../src/lib/page-data-cache.ts';

const realNow = Date.now;
let now = 1_000;
Date.now = () => now;

try {
  clearPageDataCache();
  let loads = 0;
  await loadCachedPageData('test', ['transactions'], async () => ({ version: ++loads }));
  now += 5 * 60_000 + 1;

  assert.deepEqual(getCachedPageData('test'), { version: 1 }, 'stale data remains readable');
  assert.equal(isPageDataCacheFresh('test'), false, 'expired data is marked stale');

  const refresh = loadCachedPageData('test', ['transactions'], async () => ({ version: ++loads }));
  assert.deepEqual(getCachedPageData('test'), { version: 1 }, 'stale data remains visible during refresh');
  assert.deepEqual(await refresh, { version: 2 }, 'background refresh replaces stale data');
  assert.equal(isPageDataCacheFresh('test'), true, 'replacement data is fresh');

  clearPageDataCache();
  let finish!: (value: string) => void;
  const first = loadCachedPageData('deduped', ['reports'], () => new Promise((resolve) => { finish = resolve; }));
  const second = loadCachedPageData('deduped', ['reports'], async () => 'duplicate');
  assert.equal(first, second, 'concurrent loads share one request');
  finish('shared');
  assert.equal(await second, 'shared');

  setPageDataCacheOwner('user-a');
  await loadCachedPageData('owned', ['wallets'], async () => 'user-a-data');
  setPageDataCacheOwner('user-b');
  assert.equal(getCachedPageData('owned'), undefined, 'user changes clear financial cache');
} finally {
  Date.now = realNow;
  clearPageDataCache();
}

console.log('page-data-cache: ok');
