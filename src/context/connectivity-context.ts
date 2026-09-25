import { createContext, useContext } from 'react';

export type ConnectivityStatus = 'online' | 'offline' | 'reconnecting';

export interface ConnectivityContextValue {
  browserOnline: boolean;
  hasBootstrapped: boolean;
  status: ConnectivityStatus;
  markOnline: () => void;
}

export const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);

export function useConnectivity() {
  const value = useContext(ConnectivityContext);
  if (!value) throw new Error('useConnectivity must be used inside ConnectivityProvider.');
  return value;
}
