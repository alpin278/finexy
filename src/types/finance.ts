import type { CategoryIconName } from './categories';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'IDR' | 'JPY' | 'AUD' | 'CAD';
export type WalletCurrencyCode = 'USD' | 'EUR' | 'GBP' | 'IDR';

export type WalletStatus = 'Active' | 'Inactive';
export type WalletType = 'bank' | 'cash' | 'card' | 'travel' | 'savings';

export type BudgetStatus = 'on_track' | 'near_limit' | 'over_budget';
/** Canonical monthly budget period in YYYY-MM form. */
export type BudgetPeriod = string;

export interface BudgetCategoryOption {
  id: string;
  name: string;
  icon: CategoryIconName;
}

export interface BudgetCurrencyTotal {
  currency: WalletCurrencyCode;
  limit: number;
  spent: number;
  remaining: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  currency: WalletCurrencyCode;
  spent: number;
  transactionCount: number;
  period: BudgetPeriod;
  status: BudgetStatus;
  icon: CategoryIconName;
  notes?: string;
}

export interface Wallet {
  id: string;
  currency: WalletCurrencyCode;
  symbol: string;
  flag: string;
  name: string;
  balance: number;
  monthlyLimit: number | null;
  status: WalletStatus;
  /** Extra fields are optional so the compact Overview wallet module stays stable. */
  type?: WalletType;
  spentThisMonth?: number;
  accountMask?: string;
  institution?: string;
  colorVariant?: 'dark' | 'accent' | 'neutral';
  /** Optional cached reporting-currency estimate. Native balance remains primary. */
  valuation?: { amount: number; currency: WalletCurrencyCode; rateDate: string; provider: string; stale?: boolean };
}

export interface MetricData {
  id: string;
  title: string;
  amount: number;
  changePercentage: number;
  period: string;
  isPositive: boolean;
  highlighted?: boolean;
  format?: 'currency' | 'percentage';
  trendLabel?: string;
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
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

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'completed' | 'pending' | 'canceled';

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
  /** ISO timestamp of when the financial transaction occurred (occurred_at). */
  occurredAt?: string;
  /** ISO timestamp of when this transaction was recorded in Finexy (created_at). */
  createdAt?: string;
  amount: number;
  currency: CurrencyCode;
  status: TransactionStatus;
  transferSourceWallet?: string;
  transferDestinationWallet?: string;
  transferReference?: string;
  /** Transfer metadata is retained on the UI read model so paired ledger legs can be grouped safely. */
  transferId?: string;
  transferLeg?: 'outbound' | 'inbound';
  ledgerTransactionIds?: string[];
  splits?: TransactionSplit[];
}

export interface TransactionSplit {
  id: string;
  categoryId: string;
  category: string;
  amount: number;
  note?: string;
}
