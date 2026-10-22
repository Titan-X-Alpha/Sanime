import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { r2Storage } from '@/lib/storage/r2';

export async function POST(request: Request) {
  try {
    await requireAuth();
    const { object_key, original_filename } = await request.json();

    if (!object_key) {
      return NextResponse.json({ error: 'object_key is required' }, { status: 400 });
    }

    const downloadUrl = await r2Storage.createPresignedDownloadUrl(object_key, original_filename);

    return NextResponse.json({ success: true, download_url: downloadUrl });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to generate download URL' }, { status: 500 });
  }
}
