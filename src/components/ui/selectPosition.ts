export function moveSelectIndex(currentIndex: number, optionCount: number, direction: 1 | -1) {
  if (optionCount <= 0) return -1;
  if (currentIndex < 0) return direction === 1 ? 0 : optionCount - 1;
  return (currentIndex + direction + optionCount) % optionCount;
}
