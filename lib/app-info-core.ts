export function formatCopyrightRange(currentYear: number, startYear = 2026) {
  return currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
}
