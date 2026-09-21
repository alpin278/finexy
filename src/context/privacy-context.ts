import { createContext } from 'react';

export interface PrivacyContextValue {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

export const PrivacyContext = createContext<PrivacyContextValue | null>(null);
