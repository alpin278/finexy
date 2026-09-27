# Donut Chart Layout Spec

## Goal
Create one stable responsive expense-category donut chart for mobile and desktop.

## Non-negotiable rules
- Use only one chart renderer across mobile and desktop.
- No tooltip popup.
- No black focus box.
- No white floating tooltip card.
- Default center state shows TOTAL.
- Hover/tap only updates center content temporarily.
- On pointer leave / touch end, chart returns to TOTAL unless a persistent selection mode is explicitly enabled.
- Use Top 5 categories + Others when category count exceeds 5 (maximum visual slice count = 6).
- Every visible non-zero slice must have a leader line.
- All calculations and category ordering must remain unchanged.

## Donut layout
- Donut remains centered.
- Consistent inner/outer radius.
- Small slices must remain visible.
- Slice colors must remain distinct and never blend into background.

## Annotation layout
- Two columns only: left and right.
- Left labels are right-aligned.
- Right labels are left-aligned.
- Labels stay within a safe vertical band (roughly 12% to 88% of chart height).
- Maintain natural top-to-bottom slice order on each side.
- Enforce minimum vertical gap between labels.
- Do not place labels flush against top or bottom edges.

## Leader line geometry
- Each leader line has three points: anchor -> elbow -> horizontal end.
- Use consistent stroke width.
- Color matches slice color.
- Horizontal runner length should be visually consistent.
- Horizontal segment should stop close to the text block.
- No disconnected stubs.
- No missing lines for visible slices.

## Label formatting
- Two-line layout:
  - category name
  - percentage
- Category name slightly stronger.
- Percentage slightly quieter.
- Consistent line-height.
- Responsive truncation:
  - mobile truncates earlier
  - desktop allows more text width

## Others behavior
- Small categories are grouped into Others.
- Others behaves like a normal category annotation.
- Others must also have a leader line.
- Others must not be placed too close to the top edge.

## Responsive behavior
- Same logic for mobile and desktop.
- Only responsive values may differ:
  - label width
  - label column position
  - chart size
  - vertical gap
  - line length

## Validation
Must pass:
- npm run build
- npm run lint
- git diff --check

DONUT CATEGORY COUNT CONTRACT

1–5 non-zero expense categories:
- render all categories individually
- one annotation + one leader line per slice

More than 5 non-zero categories:
- render Top 5 categories by total spending amount
- aggregate every remaining category into Others
- maximum visual slice count = 6

Leader-line algorithm is identical at every count:
actual slice anchor
→ radial exit
→ collision-aware elbow
→ horizontal runner
→ label

Never create an annotation without a slice.
Never create a slice without an annotation, except the optional single-category
case where the center can provide sufficient identification.

Annotation positions must be derived from geometry and stable label slots,
not hardcoded category names or a specific dataset.

Must also be visually checked with:
- one balanced dataset
- one crowded dataset
- one extreme dataset