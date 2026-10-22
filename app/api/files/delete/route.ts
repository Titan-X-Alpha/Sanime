import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { r2Storage } from '@/lib/storage/r2';
import { getStorageLedger } from '@/lib/quota/ledger';

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const { asset_id, object_key, episode_id } = await request.json();

    if (!asset_id && !object_key && !episode_id) {
      return NextResponse.json({ error: 'asset_id, episode_id, or object_key is required' }, { status: 400 });
    }

    if (episode_id) {
      const media = await db.getMediaAssetByEpisodeId(episode_id);
      if (media?.object_key) {
        await r2Storage.deleteObject(media.object_key);
      }
      await db.deleteEpisode(episode_id);
    }

    if (asset_id) {
      const allAssets = await db.getAllMediaAssets();
      const asset = allAssets.find((a) => a.id === asset_id);
      if (asset?.object_key) {
        await r2Storage.deleteObject(asset.object_key);
      }
      await db.deleteMediaAsset(asset_id);
    }

    if (object_key) {
      await r2Storage.deleteObject(object_key);
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
