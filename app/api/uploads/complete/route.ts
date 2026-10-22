import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { r2Storage } from '@/lib/storage/r2';
import { uploadCompleteSchema } from '@/lib/validation/schemas';
import { getStorageLedger } from '@/lib/quota/ledger';

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const body = await request.json();
    const result = uploadCompleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { job_id, object_key, actual_size_bytes, duration_seconds } = result.data;
    const job = await db.getUploadJobById(job_id);

    if (!job || job.profile_id !== profile.id) {
      return NextResponse.json({ error: 'Upload reservation not found or unauthorized' }, { status: 404 });
    }

    // Verify actual object in R2
    const verification = await r2Storage.verifyObject(object_key, actual_size_bytes);
    if (!verification.verified) {
      await db.updateUploadJobStatus(job_id, 'failed');
      return NextResponse.json({ error: 'Uploaded object could not be verified in Cloudflare R2' }, { status: 400 });
    }

    // Episode details from request payload
    const { anime_id, episode_title, season_number = 1, episode_number = 1, original_filename = 'video.mp4' } = body;

    // Create episode record if anime_id is provided
    let episodeId = body.episode_id;
    if (!episodeId && anime_id) {
      const episode = await db.createEpisode({
        anime_id,
        season_number: Number(season_number),
        episode_number: Number(episode_number),
        title: episode_title || `Episode ${episode_number}`,
        duration_seconds: duration_seconds || 1420,
        thumbnail_url: body.thumbnail_url || '/images/hero-banner.jpg',
      });
      episodeId = episode.id;
    }

    // Create Media Asset
    const ext = original_filename.split('.').pop() || 'mp4';
    const mediaAsset = await db.createMediaAsset({
      episode_id: episodeId,
      object_key,
      original_filename,
      mime_type: body.mime_type || 'video/mp4',
      actual_size_bytes: verification.actualSizeBytes,
      upload_status: 'completed',
      media_format: ext.toLowerCase(),
      verified_at: new Date().toISOString(),
    });

    // Mark upload job as completed
    await db.updateUploadJobStatus(job_id, 'completed');

    // Fetch updated ledger
    const summary = await getStorageLedger(profile.id);

    return NextResponse.json({
      success: true,
      message: 'Upload completed and verified successfully',
      media_asset: mediaAsset,
      storage_summary: summary,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to complete upload' }, { status: 500 });
  }
}
