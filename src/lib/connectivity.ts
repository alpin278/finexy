export const OFFLINE_MESSAGE = 'Internet connection required.';

let browserOnline = typeof navigator === 'undefined' || navigator.onLine;

export function getBrowserOnline() { return browserOnline; }
export function setBrowserOnline(value: boolean) { browserOnline = value; }

export class ConnectivityError extends Error {
  constructor() {
    super(OFFLINE_MESSAGE);
    this.name = 'ConnectivityError';
  }
}

export function assertOnline() {
  if (!browserOnline) throw new ConnectivityError();
}

export function isConnectivityError(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : error instanceof Error ? error.message : '';
  return message === OFFLINE_MESSAGE || /failed to fetch|networkerror|network request failed|load failed|network is down|offline/i.test(message);
}

export function offlineErrorMessage(error: unknown) {
  return isConnectivityError(error) ? OFFLINE_MESSAGE : null;
}
