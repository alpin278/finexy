import type { Wallet } from '../types/finance';

// These local records intentionally mirror the labels used by transactions.
// Card payment sources remain visual payment methods on Overview; here they are
// also represented as manageable wallet records without storing card credentials.
export const mockWalletAccounts: Wallet[] = [
  { id: 'w-usd-main', name: 'USD Main Account', currency: 'USD', symbol: '$', flag: '🇺🇸', balance: 22678, monthlyLimit: 10000, spentThisMonth: 3860, status: 'Active', type: 'bank', accountMask: '•••• 2481', institution: 'Finexy Bank', colorVariant: 'dark' },
  { id: 'w-eur-travel', name: 'EUR Travel Wallet', currency: 'EUR', symbol: '€', flag: '🇪🇺', balance: 18345, monthlyLimit: 8000, spentThisMonth: 2940, status: 'Active', type: 'travel', accountMask: '•••• 9017', institution: 'Finexy Travel', colorVariant: 'accent' },
  { id: 'w-gbp', name: 'GBP Wallet', currency: 'GBP', symbol: '£', flag: '🇬🇧', balance: 15000, monthlyLimit: 7500, spentThisMonth: 0, status: 'Inactive', type: 'savings', accountMask: '•••• 6620', institution: 'Finexy Savings', colorVariant: 'neutral' },
  { id: 'w-cash', name: 'Cash Wallet', currency: 'USD', symbol: '$', flag: '💵', balance: 1249, monthlyLimit: 1500, spentThisMonth: 540, status: 'Active', type: 'cash', colorVariant: 'neutral' },
  { id: 'w-visa-6782', name: 'Visa •••• 6782', currency: 'USD', symbol: '$', flag: '💳', balance: 4280, monthlyLimit: 4500, spentThisMonth: 1840, status: 'Active', type: 'card', accountMask: '•••• 6782', institution: 'Visa', colorVariant: 'dark' },
  { id: 'w-mastercard-4356', name: 'Mastercard •••• 4356', currency: 'USD', symbol: '$', flag: '💳', balance: 3320, monthlyLimit: 2500, spentThisMonth: 960, status: 'Active', type: 'card', accountMask: '•••• 4356', institution: 'Mastercard', colorVariant: 'accent' },
];

export const walletCurrencyOptions = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$', flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '£', flag: '🇬🇧' },
  { value: 'IDR', label: 'IDR — Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
] as const;
