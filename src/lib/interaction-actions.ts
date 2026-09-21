export type FinexyAction = 'new-transaction' | 'transfer' | 'add-wallet' | 'create-budget' | 'add-recurring' | 'export-transactions';

export interface FinexyActionState {
  finexyAction: FinexyAction;
  requestId: number;
}

export function isFinexyActionState(value: unknown): value is FinexyActionState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FinexyActionState>;
  return typeof candidate.requestId === 'number' && ['new-transaction', 'transfer', 'add-wallet', 'create-budget', 'add-recurring', 'export-transactions'].includes(candidate.finexyAction ?? '');
}
