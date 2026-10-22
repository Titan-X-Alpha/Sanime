import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { r2Storage } from '@/lib/storage/r2';

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const { job_id } = await request.json();

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    const job = await db.getUploadJobById(job_id);
    if (!job || job.profile_id !== profile.id) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });
    }

    // Clean up partial R2 object if any
    await r2Storage.deleteObject(job.object_key);
    await db.updateUploadJobStatus(job_id, 'aborted');

    return NextResponse.json({ success: true, message: 'Upload aborted and reservation released' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to abort upload' }, { status: 500 });
  }
}
