import type { ReportPeriod, ReportSnapshot } from '../types/reports';

const summaryMetrics = [
  { id: 'savings-rate', label: 'Net Savings Rate', value: '66.5%', accent: '4.2%', detail: 'vs. 62.3% last month', supportingLabel: 'Optimal Health', icon: 'savings' as const },
  { id: 'total-inflow', label: 'Total Inflow', value: '$42,850.00', accent: '100%', detail: '4 deposits completed', supportingLabel: 'All On-Time', icon: 'inflow' as const },
  { id: 'total-outflow', label: 'Total Outflow', value: '$14,320.00', accent: '3.8%', detail: 'Below monthly budget cap', supportingLabel: 'Cap: $14,900', icon: 'outflow' as const },
  { id: 'net-retained', label: 'Net Cash Retained', value: '+$28,530.00', accent: 'Surplus liquidity secured', detail: '', supportingLabel: 'Growth Vaults', icon: 'retained' as const },
];

const monthlyCashFlow = [
  { month: 'Jan', inflow: 32000, outflow: 10500, netMargin: 21500 },
  { month: 'Feb', inflow: 38000, outflow: 12400, netMargin: 25600 },
  { month: 'Mar', inflow: 35500, outflow: 11800, netMargin: 23700 },
  { month: 'Apr 26', inflow: 42850, outflow: 14320, netMargin: 28530 },
  { month: 'May', inflow: 44200, outflow: 13600, netMargin: 30600 },
  { month: 'Jun', inflow: 48200, outflow: 15100, netMargin: 33100 },
  { month: 'Jul', inflow: 40600, outflow: 12900, netMargin: 27700 },
  { month: 'Aug', inflow: 46400, outflow: 14500, netMargin: 31900 },
];

const liquidity = [
  { id: 'operating-inflow', label: 'Operating Inflow', description: 'Consulting retainers, SaaS distributions, client billings', amount: 36450, tone: 'positive' as const },
  { id: 'investment-yield', label: 'Investment Yield & Dividends', description: 'Treasury bonds, index disbursements, staking reward yield', amount: 6400, tone: 'positive' as const },
  { id: 'fixed-overhead', label: 'Fixed Overhead', description: 'Mortgage, utilities, vehicle leases, insurance subscriptions', amount: -6800, tone: 'negative' as const },
  { id: 'discretionary-spending', label: 'Discretionary Spending', description: 'Dining, travel bookings, electronics, personal lifestyle', amount: -4320, tone: 'negative' as const },
  { id: 'tax-escrow', label: 'Tax & Escrow Provision', description: 'Quarterly statutory reserve and legal retainers', amount: -3200, tone: 'negative' as const },
  { id: 'net-retained-capital', label: 'Net Retained Capital (Surplus)', description: 'Balance after the April mock liquidity reconciliation', amount: 28530, tone: 'total' as const },
];

const expenses = [
  { id: 'housing', label: 'Housing & Utilities', amount: 4582, percentage: 32, color: '#FF5A36' },
  { id: 'food', label: 'Food & Dining', amount: 3150, percentage: 22, color: '#F29B62' },
  { id: 'travel', label: 'Travel & Flights', amount: 2577, percentage: 18, color: '#E8CF56' },
  { id: 'shopping', label: 'Shopping & Goods', amount: 2004, percentage: 14, color: '#75B7A0' },
  { id: 'entertainment', label: 'Entertainment & Tech', amount: 1288, percentage: 9, color: '#7C91B8' },
  { id: 'health', label: 'Health & Fitness', amount: 719, percentage: 5, color: '#B6A0C7' },
];

const thisMonthSnapshot: ReportSnapshot = {
  period: 'this-month',
  periodLabel: 'This Month (Apr 2026)',
  summaryMetrics,
  cashFlow: monthlyCashFlow,
  cashFlowStats: { averageMonthlyBurn: '$13,800.00', peakInflow: 'Jun ($48,200)', capitalRetention: '66.5% Yield' },
  highlight: { period: 'Apr 2026', netRate: '+66.5% Net', inflow: '+$42.8k', outflow: '-$14.3k', balance: '+$28,530.00' },
  liquidity,
  expenses,
  health: { score: 88, grade: 'A+', label: 'SUPERB WEALTH STABILITY', runway: '4.8 Years at current burn', context: 'Prototype indicator based on this mock dataset, not financial advice.' },
  surplusInsight: 'You have $12,400 in mock surplus cash above the configured safety buffer in this prototype dataset.',
  peerBenchmark: 'Demo benchmark based on mock dataset.',
};

function createPeriodSnapshot(period: ReportPeriod, periodLabel: string, overrides: Partial<ReportSnapshot> = {}): ReportSnapshot {
  return { ...thisMonthSnapshot, ...overrides, period, periodLabel };
}

export const reportSnapshots: Record<ReportPeriod, ReportSnapshot> = {
  'this-week': createPeriodSnapshot('this-week', 'This Week (Apr 20-26, 2026)', {
    summaryMetrics: summaryMetrics.map((metric) => metric.id === 'total-inflow' ? { ...metric, value: '$9,840.00', detail: '1 deposit completed' } : metric.id === 'total-outflow' ? { ...metric, value: '$3,180.00', supportingLabel: 'Cap: $3,725' } : metric.id === 'net-retained' ? { ...metric, value: '+$6,660.00' } : metric),
  }),
  'this-month': thisMonthSnapshot,
  'last-month': createPeriodSnapshot('last-month', 'Last Month (Mar 2026)', {
    summaryMetrics: summaryMetrics.map((metric) => metric.id === 'savings-rate' ? { ...metric, value: '62.3%', accent: '3.1%', detail: 'vs. 60.4% prior month' } : metric.id === 'total-inflow' ? { ...metric, value: '$39,610.00' } : metric.id === 'total-outflow' ? { ...metric, value: '$14,940.00' } : metric.id === 'net-retained' ? { ...metric, value: '+$24,670.00' } : metric),
  }),
  'this-year': createPeriodSnapshot('this-year', 'This Year (Jan-Dec 2026)', {
    summaryMetrics: summaryMetrics.map((metric) => metric.id === 'total-inflow' ? { ...metric, value: '$312,480.00', detail: '31 deposits completed' } : metric.id === 'total-outflow' ? { ...metric, value: '$105,820.00', supportingLabel: 'Cap: $119,200' } : metric.id === 'net-retained' ? { ...metric, value: '+$206,660.00' } : metric),
  }),
  'custom-range': createPeriodSnapshot('custom-range', 'Custom Range (Apr 1-30, 2026)'),
};

export const reportPeriodOptions: { id: ReportPeriod; label: string }[] = [
  { id: 'this-week', label: 'This Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'this-year', label: 'This Year' },
  { id: 'custom-range', label: 'Custom Range' },
];

export const expenseTotal = expenses.reduce((total, category) => total + category.amount, 0);
export const liquidityTotal = liquidity.slice(0, -1).reduce((total, item) => total + item.amount, 0);
