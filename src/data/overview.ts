import type {
  Wallet,
  MetricData,
  CashFlowMonth,
  SpendingLimit,
  PaymentCardData,
  RecentActivity,
} from '../types/finance';

export const totalBalanceData = {
  amount: 689372.0,
  currency: 'USD',
  symbol: '$',
  changePercentage: 5,
  period: 'than last month',
  isPositive: true,
};

// Overview figures are USD-denominated product-level mock aggregates. They
// intentionally do not reconcile to the compact multi-currency wallet preview.

export const mockWallets: Wallet[] = [
  {
    id: 'w-usd',
    currency: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    name: 'US Dollar',
    balance: 22678,
    monthlyLimit: 10000,
    status: 'Active',
  },
  {
    id: 'w-eur',
    currency: 'EUR',
    symbol: '€',
    flag: '🇪🇺',
    name: 'Euro',
    balance: 18345,
    monthlyLimit: 8000,
    status: 'Active',
  },
  {
    id: 'w-gbp',
    currency: 'GBP',
    symbol: '£',
    flag: '🇬🇧',
    name: 'British Pound',
    balance: 15000,
    monthlyLimit: 7500,
    status: 'Inactive',
  },
];

// Only three wallet rows are shown here as an Overview preview; the header's
// six-wallet count is an independent product-level mock aggregate.

export const mockMetrics: MetricData[] = [
  {
    id: 'income',
    title: 'Income',
    amount: 1050,
    changePercentage: 7,
    period: 'This month',
    isPositive: true,
    highlighted: true, // Primary orange-coral treatment
  },
  {
    id: 'expenses',
    title: 'Expenses',
    amount: 700,
    changePercentage: -5,
    period: 'This month',
    isPositive: true,
    highlighted: false,
    trendLabel: '5% lower',
  },
  {
    id: 'net-cash-flow',
    title: 'Net Cash Flow',
    amount: 350,
    changePercentage: 8,
    period: 'This month',
    isPositive: true,
    highlighted: false,
  },
  {
    id: 'savings-rate',
    title: 'Savings Rate',
    amount: 33.3,
    changePercentage: 2.4,
    period: 'This month',
    isPositive: true,
    highlighted: false,
    format: 'percentage',
  },
];

export const mockCashFlowData: CashFlowMonth[] = [
  { month: 'Jan', income: 3200, expenses: 1400 },
  { month: 'Feb', income: 4100, expenses: 1200 },
  { month: 'Mar', income: 3800, expenses: 2100 },
  { month: 'Apr', income: 5400, expenses: 1600 },
  { month: 'May', income: 4600, expenses: 2400 },
  { month: 'Jun', income: 6200, expenses: 1800 },
  { month: 'Jul', income: 5800, expenses: 2200 },
  { month: 'Aug', income: 6900, expenses: 1500 },
];

// Category insight is a separate readable mock aggregate, not a roll-up of
// the small recent-transaction preview rendered below it.
export const mockSpendingCategories = [
  { id: 'housing', label: 'Housing & Bills', amount: 3200, percentage: 32, color: '#FF5A36' },
  { id: 'food', label: 'Food & Dining', amount: 1450, percentage: 22, color: '#F29B62' },
  { id: 'shopping', label: 'Shopping & Goods', amount: 1750, percentage: 18, color: '#E8CF56' },
] as const;

// This compact Overview budget gauge is an independent mock snapshot from
// the detailed Budgets page totals.
export const mockSpendingLimit: SpendingLimit = {
  spent: 1400.0,
  totalLimit: 5500.0,
  period: 'Monthly',
};

export const mockPaymentCards: PaymentCardData[] = [
  {
    id: 'card-1',
    variant: 'dark',
    status: 'Active',
    last4: '6782',
    expiry: '09/29',
    cvv: '611',
    cardHolder: 'SAJIBUR RAHMAN',
    type: 'mastercard',
  },
  {
    id: 'card-2',
    variant: 'orange',
    status: 'Active',
    last4: '4356',
    expiry: '11/28',
    cvv: '342',
    cardHolder: 'SAJIBUR RAHMAN',
    type: 'visa',
  },
];

export const mockRecentActivities: RecentActivity[] = [
  {
    id: 'act-1',
    invoiceId: 'INV_000076',
    name: 'Mobile App Purchase',
    category: 'Software & Tools',
    amount: 25500,
    status: 'Completed',
    date: '17 Apr, 2026 03:45 PM',
  },
  {
    id: 'act-2',
    invoiceId: 'INV_000075',
    name: 'Hotel Booking',
    category: 'Travel & Accommodation',
    amount: 32750,
    status: 'Pending',
    date: '15 Apr, 2026 11:30 AM',
  },
  {
    id: 'act-3',
    invoiceId: 'INV_000074',
    name: 'Flight Ticket Booking',
    category: 'Travel & Logistics',
    amount: 40200,
    status: 'Completed',
    date: '15 Apr, 2026 12:00 PM',
  },
  {
    id: 'act-4',
    invoiceId: 'INV_000073',
    name: 'Grocery Purchase',
    category: 'Food & Groceries',
    amount: 50200,
    status: 'In Progress',
    date: '14 Apr, 2026 09:15 PM',
  },
  {
    id: 'act-5',
    invoiceId: 'INV_000072',
    name: 'Software License',
    category: 'Subscriptions',
    amount: 15900,
    status: 'Completed',
    date: '10 Apr, 2026 06:00 AM',
  },
];
