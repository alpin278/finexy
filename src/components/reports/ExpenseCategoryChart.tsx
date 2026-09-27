import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReportCategory } from '../../lib/reports';
import type { WalletCurrencyCode } from '../../types/finance';
import { Card } from '../ui/Card';
import { formatMoney } from './reportUtils';

type ChartSize = { width: number; height: number };

const OTHERS_COLOR = '#8E8E93';

const FINE_PALETTE = [
  '#FF5A36', // Coral Orange
  '#7C91B8', // Slate Blue
  '#55B88B', // Emerald Green
  '#F29B62', // Warm Peach
  '#B6A0C7', // Soft Lavender
  '#E8CF56', // Warm Yellow
  '#0284C7', // Vivid Ocean Blue
  '#0D9488', // Deep Teal
  '#E11D48', // Crimson Red
  '#8B5CF6', // Purple
  '#D97706', // Amber Ochre
  '#2563EB', // Royal Blue
];

function isTooPaleOrInvalid(c?: string | null): boolean {
  if (!c || typeof c !== 'string') return true;
  const s = c.trim().toLowerCase();
  if (!s || s === 'transparent' || s === 'none' || s === 'inherit' || s === 'currentcolor') return true;
  if (s === '#fff' || s === '#ffffff' || s === 'white') return true;

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    let r = 255;
    let g = 255;
    let b = 255;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    // High brightness / near white or near app background (#FAFAF8, #F2F2F0)
    if (r > 228 && g > 228 && b > 224) return true;
  }
  return false;
}

function resolveSliceColor(category: { id: string; color?: string | null }, index: number): string {
  if (category.id === 'finexy-cat-others') {
    return OTHERS_COLOR;
  }
  if (category.color && !isTooPaleOrInvalid(category.color)) {
    return category.color;
  }
  return FINE_PALETTE[index % FINE_PALETTE.length];
}

function getDistinctCategoryColors(categories: ReportCategory[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  const nonZero = categories.filter((c) => c.amount > 0);

  nonZero.forEach((category, i) => {
    if (category.id === 'finexy-cat-others') {
      colorMap.set(category.id, OTHERS_COLOR);
      return;
    }
    let resolved = resolveSliceColor(category, i);
    // Ensure adjacent slices do not share identical colors
    if (i > 0) {
      const prevColor = colorMap.get(nonZero[i - 1].id);
      if (prevColor && prevColor.toLowerCase() === resolved.toLowerCase()) {
        resolved = FINE_PALETTE[(i + 3) % FINE_PALETTE.length];
      }
    }
    // Ensure the last slice does not duplicate the first slice
    if (i === nonZero.length - 1 && i > 1) {
      const firstColor = colorMap.get(nonZero[0].id);
      if (firstColor && firstColor.toLowerCase() === resolved.toLowerCase()) {
        resolved = FINE_PALETTE[(i + 5) % FINE_PALETTE.length];
      }
    }
    colorMap.set(category.id, resolved);
  });

  return colorMap;
}

type SliceGeometry = {
  id: string;
  index: number;
  category: ReportCategory;
  midAngle: number;
  side: 'left' | 'right';
  cosA: number;
  sinA: number;
  anchorX: number;
  anchorY: number;
  naturalY: number;
  color: string;
};

type Annotation = SliceGeometry & {
  elbowX: number;
  lineEndX: number;
  labelX: number;
  labelY: number;
  labelWidth: number;
};

type ChartLayout = {
  cx: number;
  cy: number;
  donutRadius: number;
  innerRadius: number;
  annotationSafeTop: number;
  annotationSafeBottom: number;
  leftLabelX: number;
  rightLabelX: number;
  labelWidth: number;
  minVerticalGap: number;
  radialExit: number;
  runnerLen: number;
  lineToTextGap: number;
  leftLineEndX: number;
  rightLineEndX: number;
  leftElbowX: number;
  rightElbowX: number;
};

function getChartLayout(width: number, height: number): ChartLayout {
  const cx = width / 2;
  const cy = height / 2;

  const isNarrowMobile = width < 340;
  const isMobile = width < 380;
  const isTabletOrWide = width >= 540;

  let donutRadius: number;
  let innerRadius: number;
  let paddingX: number;
  let lineToTextGap: number;
  let radialExit: number;
  let runnerLen: number;
  let minVerticalGap: number;
  let maxLabelWidth: number;

  if (isNarrowMobile) {
    // 320px viewport (~290px container)
    donutRadius = Math.round(Math.min(52, height * 0.21));
    innerRadius = Math.round(donutRadius * 0.65);
    paddingX = 6;
    lineToTextGap = 5;
    radialExit = 6;
    runnerLen = 10;
    minVerticalGap = 32;
    maxLabelWidth = 76;
  } else if (isMobile) {
    // 360px - 390px viewport (~320px - 360px container)
    donutRadius = Math.round(Math.min(56, height * 0.22));
    innerRadius = Math.round(donutRadius * 0.65);
    paddingX = 6;
    lineToTextGap = 6;
    radialExit = 6;
    runnerLen = 12;
    minVerticalGap = 34;
    maxLabelWidth = 86;
  } else if (!isTabletOrWide) {
    // Desktop card in 2-column grid (~380px - 540px container on 1280px / 1440px)
    donutRadius = Math.round(Math.min(64, height * 0.23));
    innerRadius = Math.round(donutRadius * 0.65);
    paddingX = 8;
    lineToTextGap = 6;
    radialExit = 8;
    runnerLen = 14;
    minVerticalGap = 38;
    maxLabelWidth = 118;
  } else {
    // Wide tablet or full-width container (768px / 1024px single column, 540px+)
    donutRadius = Math.round(Math.min(74, height * 0.25));
    innerRadius = Math.round(donutRadius * 0.65);
    paddingX = 12;
    lineToTextGap = 8;
    radialExit = 8;
    runnerLen = 18;
    minVerticalGap = 42;
    maxLabelWidth = 140;
  }

  // Safe vertical band: 10% to 90% on mobile, 12% to 88% on desktop
  const safeBandTopRatio = isMobile ? 0.10 : 0.12;
  const safeBandBottomRatio = isMobile ? 0.90 : 0.88;
  const minSafeMarginY = isMobile ? 26 : 32;

  const annotationSafeTop = Math.max(minSafeMarginY, Math.round(height * safeBandTopRatio));
  const annotationSafeBottom = Math.min(height - minSafeMarginY, Math.round(height * safeBandBottomRatio));

  // Calculate actual labelWidth ensuring guaranteed clearance from donut
  const availableWidth = cx - donutRadius - radialExit - runnerLen - lineToTextGap - paddingX - 8;
  const labelWidth = Math.max(isMobile ? 64 : 90, Math.min(maxLabelWidth, Math.round(availableWidth)));

  // Fixed column X positions
  const leftLabelX = paddingX;
  const rightLabelX = width - paddingX - labelWidth;

  // Fixed leader line X endpoints (just to the right of left text, just to the left of right text)
  const leftLineEndX = leftLabelX + labelWidth + lineToTextGap;
  const rightLineEndX = rightLabelX - lineToTextGap;

  // Fixed elbow X positions (guarantees consistent horizontal runner length)
  const leftElbowX = leftLineEndX + runnerLen;
  const rightElbowX = rightLineEndX - runnerLen;

  return {
    cx,
    cy,
    donutRadius,
    innerRadius,
    annotationSafeTop,
    annotationSafeBottom,
    leftLabelX,
    rightLabelX,
    labelWidth,
    minVerticalGap,
    radialExit,
    runnerLen,
    lineToTextGap,
    leftLineEndX,
    rightLineEndX,
    leftElbowX,
    rightElbowX,
  };
}

/**
 * Computes exact midAngles matching Recharts Pie layout with startAngle=90, endAngle=-270, paddingAngle=(count>1?1:0).
 */
function computeSliceMidAngles(categories: ReportCategory[]): Map<string, number> {
  const nonZero = categories.filter((c) => c.amount > 0);
  const sum = nonZero.reduce((acc, cat) => acc + cat.amount, 0);
  if (sum <= 0) return new Map();

  const midAngles = new Map<string, number>();

  if (nonZero.length === 1) {
    // Single category full ring: place anchor at 0 deg (equator, right side)
    midAngles.set(nonZero[0].id, 0);
    return midAngles;
  }

  const count = nonZero.length;
  const paddingAngle = count > 1 ? 1 : 0;
  const totalPadding = count * paddingAngle;
  const realTotalAngle = 360 - totalPadding;

  let currentStart = 90;

  for (const cat of categories) {
    if (cat.amount <= 0) continue;
    const fraction = cat.amount / sum;
    const sliceAngle = fraction * realTotalAngle;
    const end = currentStart - sliceAngle;
    const mid = (currentStart + end) / 2;
    midAngles.set(cat.id, mid);
    currentStart = end - paddingAngle;
  }

  return midAngles;
}

function computeAnnotations(
  visualCategories: ReportCategory[],
  size: ChartSize,
  layout: ChartLayout,
  colorMap: Map<string, string>
): Annotation[] {
  if (visualCategories.length === 0 || size.width <= 0 || size.height <= 0) return [];

  const midAngles = computeSliceMidAngles(visualCategories);

  // Compute base slice geometry without interactive popOffset so slots stay 100% stable
  const rawSlices: SliceGeometry[] = visualCategories.map((category, index) => {
    const midAngle = midAngles.get(category.id) ?? 90;
    const rad = (-midAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const side: 'left' | 'right' = cosA >= 0 ? 'right' : 'left';

    const anchorX = layout.cx + cosA * (layout.donutRadius + 1);
    const anchorY = layout.cy + sinA * (layout.donutRadius + 1);

    return {
      id: category.id,
      index,
      category,
      midAngle,
      side,
      cosA,
      sinA,
      anchorX,
      anchorY,
      naturalY: anchorY,
      color: colorMap.get(category.id) ?? resolveSliceColor(category, index),
    };
  });

  return (['left', 'right'] as const).flatMap((side) => {
    // Preserve natural top-to-bottom order according to slice geometry:
    // Natural slice outer anchor Y orders slices strictly from top to bottom
    const group = rawSlices
      .filter((s) => s.side === side)
      .sort((a, b) => a.anchorY - b.anchorY);

    if (group.length === 0) return [];

    const n = group.length;

    // Start positions clamped within safe annotation band
    const pos = group.map((s) => Math.max(layout.annotationSafeTop, Math.min(layout.annotationSafeBottom, s.anchorY)));

    // Forward relaxation pass: enforce consistent minVerticalGap from top to bottom
    for (let i = 1; i < n; i++) {
      if (pos[i] < pos[i - 1] + layout.minVerticalGap) {
        pos[i] = pos[i - 1] + layout.minVerticalGap;
      }
    }

    // Backward relaxation pass: pull back if bottom exceeds annotationSafeBottom
    if (pos[n - 1] > layout.annotationSafeBottom) {
      pos[n - 1] = layout.annotationSafeBottom;
      for (let i = n - 2; i >= 0; i--) {
        if (pos[i] > pos[i + 1] - layout.minVerticalGap) {
          pos[i] = pos[i + 1] - layout.minVerticalGap;
        }
      }
    }

    // Top bound check: if shifted above annotationSafeTop, shift down or compress gap proportionally
    if (pos[0] < layout.annotationSafeTop) {
      const span = layout.annotationSafeBottom - layout.annotationSafeTop;
      const neededSpan = (n - 1) * layout.minVerticalGap;
      if (neededSpan <= span) {
        const shift = layout.annotationSafeTop - pos[0];
        for (let i = 0; i < n; i++) {
          pos[i] += shift;
        }
      } else {
        const effectiveGap = span / Math.max(1, n - 1);
        for (let i = 0; i < n; i++) {
          pos[i] = layout.annotationSafeTop + i * effectiveGap;
        }
      }
    }

    const isLeft = side === 'left';
    const labelX = isLeft ? layout.leftLabelX : layout.rightLabelX;
    const lineEndX = isLeft ? layout.leftLineEndX : layout.rightLineEndX;
    const elbowX = isLeft ? layout.leftElbowX : layout.rightElbowX;

    return group.map((item, i) => ({
      ...item,
      labelX,
      labelY: pos[i],
      labelWidth: layout.labelWidth,
      lineEndX,
      elbowX,
    }));
  });
}

function formatCenterTotal(amount: number, currency: WalletCurrencyCode): string {
  if (currency === 'IDR') {
    return `Rp${Math.round(amount).toLocaleString('id-ID')}`;
  }
  return formatMoney(amount, currency);
}

export function ExpenseCategoryChart({
  categories,
  currency,
}: {
  categories: ReportCategory[];
  currency: WalletCurrencyCode;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [size, setSize] = useState<ChartSize>({ width: 440, height: 280 });
  const chartRef = useRef<HTMLDivElement>(null);

  // Total calculated from actual original categories
  const total = useMemo(
    () => categories.reduce((sum, cat) => sum + (cat.amount > 0 ? cat.amount : 0), 0),
    [categories]
  );

  // Original real non-zero categories for the full expanded details list
  const originalNonZeroCategories = useMemo(
    () => categories.filter((category) => category.amount > 0),
    [categories]
  );

  // Derived presentation categories for the DONUT ONLY:
  // 1-5 categories: render all individually
  // 6+ categories: Top 5 by spending + 1 aggregated "Others" slice (maximum 6 visual slices)
  const visualCategories = useMemo<ReportCategory[]>(() => {
    const sorted = categories
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (sorted.length <= 5) {
      return sorted;
    }

    const top5 = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    const othersAmount = remaining.reduce((sum, c) => sum + c.amount, 0);
    const othersPercentage = total > 0 ? (othersAmount / total) * 100 : 0;

    if (othersAmount <= 0) {
      return top5;
    }

    return [
      ...top5,
      {
        id: 'finexy-cat-others',
        label: 'Others',
        amount: othersAmount,
        percentage: othersPercentage,
        color: OTHERS_COLOR,
      },
    ];
  }, [categories, total]);

  const colorMap = useMemo(() => getDistinctCategoryColors(visualCategories), [visualCategories]);

  const layout = useMemo(
    () => getChartLayout(size.width, size.height),
    [size.width, size.height]
  );

  const active = previewIndex !== null && visualCategories[previewIndex] ? visualCategories[previewIndex] : null;
  const activeColor = active
    ? colorMap.get(active.id) ?? resolveSliceColor(active, previewIndex!)
    : '#777771';

  const preview = (index: number) => {
    if (visualCategories[index] && visualCategories[index].amount > 0) {
      setPreviewIndex(index);
    } else {
      setPreviewIndex(null);
    }
  };

  useEffect(() => {
    const updateSize = () => {
      const chart = chartRef.current?.getBoundingClientRect();
      if (chart && chart.width > 0 && chart.height > 0) {
        setSize({
          width: Math.round(chart.width),
          height: Math.round(chart.height),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  // Stable annotation slots: interaction previewIndex does NOT recalculate layout slots
  const annotations = useMemo(
    () => computeAnnotations(visualCategories, size, layout, colorMap),
    [visualCategories, size, layout, colorMap]
  );

  return (
    <Card padding="none" data-money-chart className="h-full overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary sm:text-lg">
            Expenses by Category
          </h2>
          <p className="mt-1 text-xs text-secondary">Completed expense transactions for this period.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">Total</p>
          <p className="money-value mt-1 text-base font-bold text-primary">
            {formatMoney(total, currency)}
          </p>
        </div>
      </div>

      {categories.length > 0 && total > 0 ? (
        <>
          {/* Fixed-height Centered Chart Viewport */}
          <div
            ref={chartRef}
            className="expense-category-donut relative mt-4 h-[250px] select-none sm:h-[280px] lg:h-[300px]"
            onMouseLeave={() => setPreviewIndex(null)}
            onTouchEnd={() => setPreviewIndex(null)}
            onTouchCancel={() => setPreviewIndex(null)}
            onMouseDown={(e) => {
              // Prevent browser from setting focus ring on SVG elements
              if (e.target instanceof SVGElement) {
                e.preventDefault();
              }
            }}
          >
            {/* Outside Leader Lines (At most 6) */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${size.width} ${size.height}`}
              aria-hidden="true"
            >
              {annotations.map((annotation) => {
                const isActive = annotation.index === previewIndex;
                const popOffset = isActive ? 5 : 0;
                // Point A: Slice outer edge
                const aX = annotation.anchorX + annotation.cosA * popOffset;
                const aY = annotation.anchorY + annotation.sinA * popOffset;
                // Point B: Radial exit
                const bX = aX + annotation.cosA * layout.radialExit;
                const bY = aY + annotation.sinA * layout.radialExit;
                // Point C: Elbow at (elbowX, labelY)
                // Point D: Horizontal runner endpoint at (lineEndX, labelY)
                const points = `${aX},${aY} ${bX},${bY} ${annotation.elbowX},${annotation.labelY} ${annotation.lineEndX},${annotation.labelY}`;
                return (
                  <polyline
                    key={annotation.id}
                    points={points}
                    fill="none"
                    stroke={annotation.color}
                    strokeOpacity={isActive ? 1 : 0.85}
                    strokeWidth={isActive ? 2 : 1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </svg>

            {/* Donut Chart (Visually centered, Top-5 + Others, max 6 slices) */}
            <div className="pointer-events-auto absolute inset-0 h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={visualCategories}
                    dataKey="amount"
                    nameKey="label"
                    startAngle={90}
                    endAngle={-270}
                    cx={layout.cx}
                    cy={layout.cy}
                    innerRadius={layout.innerRadius}
                    outerRadius={layout.donutRadius}
                    paddingAngle={visualCategories.length > 1 ? 1 : 0}
                    minAngle={0}
                    stroke="var(--color-card, #FFFFFF)"
                    strokeWidth={1}
                    rootTabIndex={-1}
                    isAnimationActive={false}
                    onMouseMove={(_, index) => preview(index)}
                    onMouseLeave={() => setPreviewIndex(null)}
                    onTouchStart={(_, index) => preview(index)}
                    onTouchMove={(_, index) => preview(index)}
                    onTouchEnd={() => setPreviewIndex(null)}
                    shape={(props) => {
                      // Omit tabIndex to prevent Chromium from creating a focus box on SVG sectors
                      const { tabIndex: _tabIndex, ...sectorProps } = props;
                      const isHovered = sectorProps.index === previewIndex;
                      return (
                        <Sector
                          {...sectorProps}
                          tabIndex={undefined}
                          style={{ outline: 'none' }}
                          className="outline-none focus:outline-none"
                          outerRadius={sectorProps.outerRadius + (isHovered ? 6 : 0)}
                        />
                      );
                    }}
                  >
                    {visualCategories.map((category, index) => {
                      const color = colorMap.get(category.id) ?? resolveSliceColor(category, index);
                      return (
                        <Cell
                          key={category.id}
                          fill={color}
                          cursor="pointer"
                          tabIndex={-1}
                          style={{ outline: 'none' }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Center Content: One text layer only */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
              <span
                className="money-value whitespace-nowrap text-[12px] font-semibold leading-none tracking-tight text-primary sm:text-[14px]"
                style={active ? { color: activeColor } : undefined}
              >
                {active ? `${active.percentage.toFixed(1)}%` : formatCenterTotal(total, currency)}
              </span>
            </div>

            {/* Outside Category Labels (At most 6, Inward-pointing two-line hierarchy) */}
            {annotations.map((annotation) => {
              const category = annotation.category;
              const isActive = annotation.index === previewIndex;
              const isLeft = annotation.side === 'left';
              return (
                <button
                  key={category.id}
                  type="button"
                  onMouseEnter={() => setPreviewIndex(annotation.index)}
                  onMouseLeave={() => setPreviewIndex(null)}
                  onFocus={() => setPreviewIndex(annotation.index)}
                  onBlur={() => setPreviewIndex(null)}
                  aria-label={`${category.label}, ${category.percentage.toFixed(1)}%`}
                  className={[
                    'absolute -translate-y-1/2 cursor-pointer select-none transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
                    isLeft ? 'text-right' : 'text-left',
                  ].join(' ')}
                  style={{
                    left: annotation.labelX,
                    top: annotation.labelY,
                    width: annotation.labelWidth,
                  }}
                >
                  <span
                    className={[
                      'block truncate text-[11px] font-semibold leading-tight sm:text-xs transition-colors',
                      isActive ? 'text-primary' : 'text-primary/85',
                    ].join(' ')}
                  >
                    {category.label}
                  </span>
                  <span
                    className="block text-[10px] font-medium leading-tight text-secondary mt-0.5 sm:text-[11px] transition-colors"
                    style={{ color: isActive ? annotation.color : undefined }}
                  >
                    {category.percentage.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Button: View all categories / Show fewer */}
          {originalNonZeroCategories.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowAll((open) => !open)}
                aria-expanded={showAll}
                className="group inline-flex items-center gap-1.5 rounded-lg py-1 px-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/5 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <span>{showAll ? 'Show fewer' : 'View all categories'}</span>
                <i
                  className={`bi ${showAll ? 'bi-chevron-up' : 'bi-chevron-down'} text-[11px] transition-transform duration-200`}
                  aria-hidden="true"
                />
              </button>
            </div>
          )}

          {/* Expanded Category Details: ALWAYS shows ALL real categories individually (never "Others") */}
          {showAll && (
            <div
              tabIndex={0}
              role="region"
              aria-label="All expense categories"
              className="mt-3 max-h-56 divide-y divide-border/60 overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-surface/40 p-1.5 sm:max-h-64"
            >
              {originalNonZeroCategories.map((category, index) => {
                const color = resolveSliceColor(category, index);
                // Highlight matching donut slice (or "Others" if this category is in the aggregated tail)
                const matchingVisualIndex = visualCategories.findIndex(
                  (vc) => vc.id === category.id || (vc.id === 'finexy-cat-others' && index >= 5)
                );
                const isHovered = matchingVisualIndex !== -1 && matchingVisualIndex === previewIndex;
                return (
                  <div
                    key={category.id}
                    onMouseEnter={() => {
                      if (matchingVisualIndex !== -1) setPreviewIndex(matchingVisualIndex);
                    }}
                    onMouseLeave={() => setPreviewIndex(null)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs transition-colors ${
                      isHovered ? 'bg-surface font-semibold shadow-xs' : 'hover:bg-surface/60'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-primary">{category.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <span className="font-semibold text-primary">{formatMoney(category.amount, currency)}</span>
                      <span className="w-11 text-[11px] font-semibold text-secondary">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <p className="mt-8 text-sm text-secondary">No qualifying expenses in this period.</p>
      )}
    </Card>
  );
}
