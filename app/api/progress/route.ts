import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { watchProgressSchema } from '@/lib/validation/schemas';

export async function GET(request: Request) {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episode_id');

    if (episodeId) {
      const progress = await db.getWatchProgress(profile.id, episodeId);
      return NextResponse.json({ progress });
    }

    const type = searchParams.get('type');
    if (type === 'continue') {
      const items = await db.getContinueWatching(profile.id);
      return NextResponse.json({ items });
    }

    const history = await db.getWatchHistory(profile.id);
    return NextResponse.json({ history });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await requireAuth();
    const body = await request.json();
    const result = watchProgressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await db.upsertWatchProgress({
      profile_id: profile.id,
      episode_id: result.data.episode_id,
      position_seconds: result.data.position_seconds,
      duration_seconds: result.data.duration_seconds,
      is_completed: result.data.is_completed,
    });

    return NextResponse.json({ success: true, progress: updated });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to save progress' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const profile = await requireAuth();
    await db.clearWatchHistory(profile.id);
    return NextResponse.json({ success: true, message: 'Watch history cleared' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to clear history' }, { status: 500 });
  }
}
