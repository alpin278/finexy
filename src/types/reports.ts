export type ReportPeriod = 'this-week' | 'this-month' | 'last-month' | 'this-year' | 'custom-range';

export interface ReportSummaryMetric {
  id: string;
  label: string;
  value: string;
  accent: string;
  detail: string;
  supportingLabel: string;
  icon: 'savings' | 'inflow' | 'outflow' | 'retained';
}

export interface CashFlowPoint {
  month: string;
  inflow: number;
  outflow: number;
  netMargin: number;
}

export interface LiquidityBreakdownItem {
  id: string;
  label: string;
  description: string;
  amount: number;
  tone: 'positive' | 'negative' | 'total';
}

export interface ExpenseCategoryReport {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface FinancialHealthMetric {
  score: number;
  grade: string;
  label: string;
  runway: string;
  context: string;
}

export interface CashFlowStats {
  averageMonthlyBurn: string;
  peakInflow: string;
  capitalRetention: string;
}

export interface ReportSnapshot {
  period: ReportPeriod;
  periodLabel: string;
  summaryMetrics: ReportSummaryMetric[];
  cashFlow: CashFlowPoint[];
  cashFlowStats: CashFlowStats;
  highlight: {
    period: string;
    netRate: string;
    inflow: string;
    outflow: string;
    balance: string;
  };
  liquidity: LiquidityBreakdownItem[];
  expenses: ExpenseCategoryReport[];
  health: FinancialHealthMetric;
  surplusInsight: string;
  peerBenchmark: string;
}
