/**
 * Finexy Design System Tokens
 * Source of truth: Figma (https://www.figma.com/slides/UgqDYZWAmBj1dpOkTYz0s0) & Project Specs
 */

export const colors = {
  pageBg: '#F2F2F0',
  appSurface: '#FAFAF8',
  card: '#FFFFFF',
  textPrimary: '#171714',
  textSecondary: '#777771',
  border: '#ECECE8',
  primaryOrange: '#FF5A36',
  darkAccent: '#22221C',
  success: '#55B88B',
  danger: '#E95E5E',
  warning: '#E8CF56',
} as const;

export const radii = {
  app: '28px',
  card: '20px',
  modal: '24px',
  input: '12px',
  button: '9999px',
  buttonSm: '14px',
  badge: '9999px',
} as const;

export const shadows = {
  app: '0 12px 48px -12px rgba(0, 0, 0, 0.06)',
  card: '0 1px 2px rgba(0, 0, 0, 0.02), 0 4px 16px rgba(0, 0, 0, 0.02)',
  cardHover: '0 2px 4px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.04)',
  dropdown: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
  modal: '0 20px 60px -15px rgba(0, 0, 0, 0.15)',
} as const;

export const typography = {
  pageHeading: 'text-2xl sm:text-[28px] lg:text-[32px] font-bold text-[#171714] tracking-tight leading-tight',
  sectionHeading: 'text-lg sm:text-xl font-semibold text-[#171714] tracking-tight',
  cardHeading: 'text-sm sm:text-base font-semibold text-[#171714]',
  largeFinancialValue: 'text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#171714] tracking-tight',
  metricValue: 'text-2xl sm:text-[26px] font-bold tracking-tight',
  tableHeader: 'text-xs font-medium text-[#777771] tracking-wider uppercase',
  tableCell: 'text-sm font-medium text-[#171714]',
  label: 'text-xs font-medium text-[#777771]',
  metadata: 'text-xs text-[#777771]',
  helper: 'text-[11px] text-[#777771]',
} as const;

export const transitions = {
  default: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  colors: 'transition-colors duration-150 ease-out',
} as const;

export const heights = {
  sidebarIcon: 'h-10 w-10',
  input: 'h-11',
  buttonSm: 'h-8',
  buttonMd: 'h-10',
  buttonLg: 'h-11',
  navbar: 'h-16',
} as const;
