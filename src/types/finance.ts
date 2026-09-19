export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

export type WalletStatus = 'Active' | 'Inactive';

export interface Wallet {
  id: string;
  currency: CurrencyCode;
  symbol: string;
  flag: string;
  name: string;
  balance: number;
  monthlyLimit: number;
  status: WalletStatus;
}

export interface MetricData {
  id: string;
  title: string;
  amount: number;
  changePercentage: number;
  period: string;
  isPositive: boolean;
  highlighted?: boolean;
}

export interface ProfitLossMonth {
  month: string;
  profit: number;
  loss: number;
}

export interface SpendingLimit {
  spent: number;
  totalLimit: number;
  period: string;
}

export type PaymentCardType = 'mastercard' | 'visa';

export interface PaymentCardData {
  id: string;
  variant: 'dark' | 'orange';
  status: 'Active' | 'Inactive';
  last4: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  type: PaymentCardType;
}

export type ActivityStatus = 'Completed' | 'Pending' | 'In Progress';

export interface RecentActivity {
  id: string;
  invoiceId: string;
  name: string;
  category: string;
  amount: number;
  status: ActivityStatus;
  date: string;
}

export type TransactionType = 'income' | 'expense';

export type TransactionStatus = 'completed' | 'pending' | 'in_progress';

export interface Transaction {
  id: string;
  description: string;
  payee: string;
  reference: string;
  secondaryReference: string;
  type: TransactionType;
  category: string;
  wallet: string;
  method: string;
  date: string;
  time: string;
  amount: number;
  currency: CurrencyCode;
  status: TransactionStatus;
}
