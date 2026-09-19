import type { WalletCurrencyCode, WalletStatus, WalletType } from '../types/finance';

/** Visible prototype records used as the idempotent persisted default seed. */
export interface DefaultWalletSeed {
  seedId: string;
  name: string;
  currency: WalletCurrencyCode;
  openingBalance: number;
  monthlyLimit: number | null;
  status: WalletStatus;
  type: WalletType;
  accountMask?: string;
  institution?: string;
}

/** openingBalance is a persisted baseline until Transactions is migrated. */
export const defaultWalletSeeds: DefaultWalletSeed[] = [
  { seedId: 'usd-main', name: 'USD Main Account', currency: 'USD', openingBalance: 22678, monthlyLimit: 10000, status: 'Active', type: 'bank', accountMask: '•••• 2481', institution: 'Finexy Bank' },
  { seedId: 'eur-travel', name: 'EUR Travel Wallet', currency: 'EUR', openingBalance: 18345, monthlyLimit: 8000, status: 'Active', type: 'travel', accountMask: '•••• 9017', institution: 'Finexy Travel' },
  { seedId: 'gbp-savings', name: 'GBP Wallet', currency: 'GBP', openingBalance: 15000, monthlyLimit: 7500, status: 'Inactive', type: 'savings', accountMask: '•••• 6620', institution: 'Finexy Savings' },
  { seedId: 'cash', name: 'Cash Wallet', currency: 'USD', openingBalance: 1249, monthlyLimit: 1500, status: 'Active', type: 'cash' },
  { seedId: 'visa-6782', name: 'Visa •••• 6782', currency: 'USD', openingBalance: 4280, monthlyLimit: 4500, status: 'Active', type: 'card', accountMask: '•••• 6782', institution: 'Visa' },
  { seedId: 'mastercard-4356', name: 'Mastercard •••• 4356', currency: 'USD', openingBalance: 3320, monthlyLimit: 2500, status: 'Active', type: 'card', accountMask: '•••• 4356', institution: 'Mastercard' },
];

/** Temporary presentation bridge for the still-mock transaction preview. */
export const walletPresentationMetadata: Record<string, { spentThisMonth: number; colorVariant: 'dark' | 'accent' | 'neutral' }> = {
  'usd-main': { spentThisMonth: 3860, colorVariant: 'dark' },
  'eur-travel': { spentThisMonth: 2940, colorVariant: 'accent' },
  'gbp-savings': { spentThisMonth: 0, colorVariant: 'neutral' },
  cash: { spentThisMonth: 540, colorVariant: 'neutral' },
  'visa-6782': { spentThisMonth: 1840, colorVariant: 'dark' },
  'mastercard-4356': { spentThisMonth: 960, colorVariant: 'accent' },
};

export const walletCurrencyOptions = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$', flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '£', flag: '🇬🇧' },
  { value: 'IDR', label: 'IDR — Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
] as const;
