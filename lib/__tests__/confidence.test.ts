import { describe, it, expect } from 'vitest';
import {
  isLowConfidence,
  shouldAutoFlag,
  getConfidenceScores,
  HIGHLIGHT_THRESHOLD,
  AUTO_FLAG_THRESHOLD,
} from '../confidence';
import type { ScanResult } from '@/types';

describe('isLowConfidence', () => {
  it('returns true when score is below HIGHLIGHT_THRESHOLD', () => {
    expect(isLowConfidence(HIGHLIGHT_THRESHOLD - 0.01)).toBe(true);
  });

  it('returns false when score is at HIGHLIGHT_THRESHOLD', () => {
    expect(isLowConfidence(HIGHLIGHT_THRESHOLD)).toBe(false);
  });

  it('returns false when score is above HIGHLIGHT_THRESHOLD', () => {
    expect(isLowConfidence(0.99)).toBe(false);
  });

  it('returns false when score is null', () => {
    expect(isLowConfidence(null)).toBe(false);
  });
});

describe('shouldAutoFlag', () => {
  it('returns true when any score is below AUTO_FLAG_THRESHOLD', () => {
    expect(shouldAutoFlag([0.95, 0.88, AUTO_FLAG_THRESHOLD - 0.01])).toBe(true);
  });

  it('returns false when a score is exactly at AUTO_FLAG_THRESHOLD', () => {
    expect(shouldAutoFlag([AUTO_FLAG_THRESHOLD])).toBe(false);
  });

  it('returns false when all scores are above AUTO_FLAG_THRESHOLD', () => {
    expect(shouldAutoFlag([0.95, 0.88, 0.75])).toBe(false);
  });

  it('ignores null scores', () => {
    expect(shouldAutoFlag([null, null])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(shouldAutoFlag([])).toBe(false);
  });
});

describe('getConfidenceScores', () => {
  it('returns a map of field names to confidence values', () => {
    const scanResult: ScanResult = {
      name: { value: 'Pottery by Mia', confidence: 0.97 },
      email: { value: 'mia@email.com', confidence: 0.95 },
      phone: { value: '718-555-0192', confidence: 0.61 },
      website: { value: null, confidence: null },
      social_handles: { value: { instagram: '@mia' }, confidence: 0.88 },
    };

    const scores = getConfidenceScores(scanResult);
    expect(scores).toEqual({
      name: 0.97,
      email: 0.95,
      phone: 0.61,
      website: null,
      social_handles: 0.88,
    });
  });
});
