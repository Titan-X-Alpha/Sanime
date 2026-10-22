import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { r2Storage } from '@/lib/storage/r2';
import { getStorageLedger } from '@/lib/quota/ledger';

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const { asset_id, object_key } = await request.json();

    if (!asset_id && !object_key) {
      return NextResponse.json({ error: 'asset_id or object_key is required' }, { status: 400 });
    }

    if (object_key) {
      await r2Storage.deleteObject(object_key);
    }

    if (asset_id) {
      await db.deleteMediaAsset(asset_id);
    }

    const summary = await getStorageLedger(profile.id);

    return NextResponse.json({
      success: true,
      message: 'File deleted from Cloudflare R2 and database ledger updated',
      storage_summary: summary,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to delete file' }, { status: 500 });
  }
}
