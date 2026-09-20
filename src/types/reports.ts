export type ReportPeriod = 'this-week' | 'this-month' | 'last-month' | 'this-year' | 'custom-range';

export interface ReportSummaryMetric {
  id: 'savings-rate' | 'total-inflow' | 'total-outflow' | 'net-retained';
  label: string;
  value: string;
  accent: string;
  detail: string;
  icon: 'savings' | 'inflow' | 'outflow' | 'retained';
}

export interface ReportStat { label: string; value: string; icon: string; }
