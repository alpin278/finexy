export type SettingsCurrency = 'USD' | 'EUR' | 'GBP' | 'IDR';

export type AppearancePreference = 'light' | 'dark' | 'system';

export type TransactionTypePreference = 'expense' | 'income';

export interface SettingsProfile {
  name: string;
  email: string;
  location: string;
  timezone: string;
}

export interface NotificationPreference {
  id: 'budget-alerts' | 'transaction-notifications' | 'spending-alerts' | 'report-summaries';
  title: string;
  description: string;
  enabled: boolean;
}

export interface SettingsState {
  profile: SettingsProfile;
  currency: SettingsCurrency;
  region: string;
  dateFormat: string;
  numberFormat: string;
  appearance: AppearancePreference;
  transactionType: TransactionTypePreference;
  entryMode: 'quick' | 'detailed';
  autoCategorize: boolean;
  merchantSuggestions: boolean;
  confirmBeforeDeleting: boolean;
  notifications: NotificationPreference[];
  connectedAccount: boolean;
  demoTwoFactorEnabled: boolean;
}
