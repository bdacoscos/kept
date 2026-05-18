import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanBusinessCard } from '@/lib/scan';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { base64Image, mediaType } = await request.json();

    if (!base64Image || !mediaType) {
      return NextResponse.json(
        { error: 'Missing base64Image or mediaType' },
        { status: 400 }
      );
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_TYPES.includes(mediaType)) {
      return NextResponse.json({ error: 'Unsupported media type' }, { status: 400 });
    }

    if (base64Image.length > 1_500_000) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    const result = await scanBusinessCard(base64Image, mediaType);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[scan]', e);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
