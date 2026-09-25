import { createContext, useContext } from 'react';

export interface PwaContextValue {
  canInstall: boolean;
  isIOS: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
}

export const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) throw new Error('usePwa must be used inside PwaRuntime');
  return value;
}
