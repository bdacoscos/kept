import type { ScanResult } from '@/types';

export const HIGHLIGHT_THRESHOLD = 0.75;
export const AUTO_FLAG_THRESHOLD = 0.60;

export function isLowConfidence(score: number | null): boolean {
  if (score === null) return false;
  return score < HIGHLIGHT_THRESHOLD;
}

export function shouldAutoFlag(scores: (number | null)[]): boolean {
  return scores.some(
    (score) => score !== null && score < AUTO_FLAG_THRESHOLD
  );
}

export function getConfidenceScores(
  scanResult: ScanResult
): Record<string, number | null> {
  return Object.fromEntries(
    Object.entries(scanResult).map(([key, field]) => [key, field.confidence])
  );
}
