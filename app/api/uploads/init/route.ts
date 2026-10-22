import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { r2Storage } from '@/lib/storage/r2';
import { uploadInitSchema } from '@/lib/validation/schemas';
import { getStorageLedger } from '@/lib/quota/ledger';

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const body = await request.json();
    const result = uploadInitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { anime_id, filename, filesize, content_type } = result.data;

    // Check storage quota and reservations
    const ledger = await getStorageLedger(profile.id);
    const totalWillBe = ledger.used_bytes + ledger.reserved_bytes + filesize;

    if (totalWillBe > ledger.quota_bytes) {
      // Check if user passed explicit override flag
      const allowOverage = body.allow_overage === true;
      if (!allowOverage) {
        return NextResponse.json(
          {
            error: 'QUOTA_EXCEEDED',
            message: `Uploading this file (${(filesize / (1024 * 1024)).toFixed(1)} MB) would exceed your storage quota of ${(ledger.quota_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB.`,
            used_bytes: ledger.used_bytes,
            reserved_bytes: ledger.reserved_bytes,
            filesize,
            quota_bytes: ledger.quota_bytes,
            requires_confirmation: true,
          },
          { status: 400 }
        );
      }
    }

    // Generate safe unique object key: media/{profile-id}/{uuid}/original.{ext}
    const assetId = crypto.randomUUID();
    const ext = filename.split('.').pop() || 'mp4';
    const objectKey = `media/${profile.id}/${assetId}/original.${ext}`;

    // Reserve capacity in upload_jobs
    const job = await db.createUploadJob({
      profile_id: profile.id,
      object_key: objectKey,
      expected_size_bytes: filesize,
      reserved_size_bytes: filesize,
      status: 'reserved',
    });

    // Create signed upload URL
    const { uploadUrl } = await r2Storage.createPresignedUploadUrl(objectKey, content_type);

    return NextResponse.json({
      success: true,
      job_id: job.id,
      object_key: objectKey,
      upload_url: uploadUrl,
      asset_id: assetId,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to initialize upload' }, { status: 500 });
  }
}
