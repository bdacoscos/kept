import type { ScanResult } from '@/types';
import Anthropic from '@anthropic-ai/sdk';

export function parseScanResponse(text: string): ScanResult {
  try {
    const cleaned = text
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    return {
      name: {
        value: parsed.name?.value ?? null,
        confidence: parsed.name?.confidence ?? null,
      },
      email: {
        value: parsed.email?.value ?? null,
        confidence: parsed.email?.confidence ?? null,
      },
      phone: {
        value: parsed.phone?.value ?? null,
        confidence: parsed.phone?.confidence ?? null,
      },
      website: {
        value: parsed.website?.value ?? null,
        confidence: parsed.website?.confidence ?? null,
      },
      social_handles: {
        value: parsed.social_handles?.value ?? null,
        confidence: parsed.social_handles?.confidence ?? null,
      },
    };
  } catch (e) {
    throw new Error('Failed to parse scan response', { cause: e });
  }
}

const SCAN_PROMPT = `Extract business contact information from this business card image. Return only a JSON object with no additional text, using this exact structure:
{
  "name": { "value": "business or person name", "confidence": 0.95 },
  "email": { "value": "email@example.com", "confidence": 0.98 },
  "phone": { "value": "555-123-4567", "confidence": 0.85 },
  "website": { "value": "https://example.com", "confidence": 0.92 },
  "social_handles": { "value": { "instagram": "@handle" }, "confidence": 0.88 }
}

Rules:
- Set value to null and confidence to null if a field is not present on the card
- confidence is a float 0.0–1.0 (1.0 = completely certain, 0.0 = complete guess)
- social_handles.value is a map of platform name to handle, e.g. { "instagram": "@handle", "tiktok": "@other" }
- Return only the JSON object, no markdown, no explanation`;

let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

export async function scanBusinessCard(
  base64Image: string,
  mediaType: string
): Promise<ScanResult> {
  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
              data: base64Image,
            },
          },
          { type: 'text', text: SCAN_PROMPT },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  if (!text) throw new Error('No text content in scan response');
  return parseScanResponse(text);
}
