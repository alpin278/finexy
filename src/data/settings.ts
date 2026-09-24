import type { SelectOption } from '../components/ui/Select';
import type { SettingsState } from '../types/settings';

export const settingsCurrencyOptions: SelectOption[] = [
  { value: 'USD', label: 'USD · US Dollar' },
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'GBP', label: 'GBP · British Pound' },
  { value: 'IDR', label: 'IDR · Indonesian Rupiah' },
];

export const settingsRegionOptions: SelectOption[] = [
  { value: 'en-US', label: 'United States · English' },
  { value: 'en-GB', label: 'United Kingdom · English' },
  { value: 'id-ID', label: 'Indonesia · Bahasa Indonesia' },
  { value: 'de-DE', label: 'Germany · Deutsch' },
];

export const dateFormatOptions: SelectOption[] = [
  { value: 'MMM d, yyyy', label: 'Jan 24, 2026' },
  { value: 'dd/MM/yyyy', label: '24/01/2026' },
  { value: 'yyyy-MM-dd', label: '2026-01-24' },
];

export const numberFormatOptions: SelectOption[] = [
  { value: '1,234.56', label: '1,234.56' },
  { value: '1.234,56', label: '1.234,56' },
  { value: '1 234,56', label: '1 234,56' },
];

export const defaultSettingsState: SettingsState = {
  profile: {
    name: 'Sajibur Rahman',
    email: 'sajibur.rahman@gmail.com',
    location: 'Jakarta, Indonesia',
    timezone: 'Asia/Jakarta (GMT+7)',
  },
  currency: 'USD',
  region: 'en-US',
  dateFormat: 'MMM d, yyyy',
  numberFormat: '1,234.56',
  appearance: 'light',
  transactionType: 'expense',
  entryMode: 'quick',
  autoCategorize: true,
  merchantSuggestions: true,
  confirmBeforeDeleting: true,
  notifications: [
    { id: 'budget_near_limit', title: 'Budget near limit', description: 'Get a reminder when a budget reaches 80% of its monthly limit.', enabled: true },
    { id: 'budget_over_limit', title: 'Budget over limit', description: 'Get a reminder when a budget reaches or exceeds its monthly limit.', enabled: true },
    { id: 'transaction-notifications', title: 'Transaction notifications', description: 'Show a local confirmation when a transaction is added.', enabled: true },
    { id: 'spending-alerts', title: 'Spending alerts', description: 'Highlight unusual or higher-than-usual spending patterns.', enabled: false },
    { id: 'report-summaries', title: 'Monthly report summaries', description: 'Receive a monthly summary of your inflow, outflow, and savings.', enabled: true },
  ],
  connectedAccount: false,
  demoTwoFactorEnabled: false,
};

export const appearanceOptions = [
  { value: 'light', label: 'Light', description: 'Bright and calm' },
  { value: 'dark', label: 'Dark', description: 'Low-light friendly' },
  { value: 'system', label: 'System', description: 'Follow your device' },
] as const;
