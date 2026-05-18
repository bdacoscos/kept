import { describe, it, expect } from 'vitest';
import { parseScanResponse } from '../scan';

describe('parseScanResponse', () => {
  it('parses a complete valid response', () => {
    const input = JSON.stringify({
      name: { value: 'Pottery by Mia', confidence: 0.97 },
      email: { value: 'mia@email.com', confidence: 0.95 },
      phone: { value: '718-555-0192', confidence: 0.61 },
      website: { value: null, confidence: null },
      social_handles: { value: { instagram: '@miapottery' }, confidence: 0.88 },
    });

    const result = parseScanResponse(input);
    expect(result.name).toEqual({ value: 'Pottery by Mia', confidence: 0.97 });
    expect(result.phone).toEqual({ value: '718-555-0192', confidence: 0.61 });
    expect(result.website).toEqual({ value: null, confidence: null });
    expect(result.social_handles.value).toEqual({ instagram: '@miapottery' });
  });

  it('strips markdown code fences if present', () => {
    const input =
      '```json\n' +
      JSON.stringify({
        name: { value: 'Test', confidence: 0.9 },
        email: { value: null, confidence: null },
        phone: { value: null, confidence: null },
        website: { value: null, confidence: null },
        social_handles: { value: null, confidence: null },
      }) +
      '\n```';

    const result = parseScanResponse(input);
    expect(result.name.value).toBe('Test');
  });

  it('defaults missing fields to null', () => {
    const input = JSON.stringify({
      name: { value: 'Test Shop', confidence: 0.9 },
    });

    const result = parseScanResponse(input);
    expect(result.email).toEqual({ value: null, confidence: null });
    expect(result.phone).toEqual({ value: null, confidence: null });
    expect(result.website).toEqual({ value: null, confidence: null });
    expect(result.social_handles).toEqual({ value: null, confidence: null });
  });

  it('throws on invalid JSON', () => {
    expect(() => parseScanResponse('not json')).toThrow(
      'Failed to parse scan response'
    );
  });

  it('strips uppercase code fences', () => {
    const input =
      '```JSON\n' +
      JSON.stringify({
        name: { value: 'Test', confidence: 0.9 },
        email: { value: null, confidence: null },
        phone: { value: null, confidence: null },
        website: { value: null, confidence: null },
        social_handles: { value: null, confidence: null },
      }) +
      '\n```';

    const result = parseScanResponse(input);
    expect(result.name.value).toBe('Test');
  });

  it('defaults missing sub-keys within a field to null', () => {
    const input = JSON.stringify({
      name: { value: 'Partial Shop' },
    });

    const result = parseScanResponse(input);
    expect(result.name.confidence).toBeNull();
    expect(result.email).toEqual({ value: null, confidence: null });
  });
});
