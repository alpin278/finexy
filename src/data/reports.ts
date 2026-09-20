import type { ReportPeriod } from '../types/reports';

// Presentation-only control labels. Report financial values come from Supabase.
export const reportPeriodOptions: { id: ReportPeriod; label: string }[] = [
  { id: 'this-week', label: 'This Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'this-year', label: 'This Year' },
  { id: 'custom-range', label: 'Custom Range' },
];
