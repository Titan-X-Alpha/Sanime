import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';

export async function GET() {
  try {
    const profile = await requireAuth();
    const watchlist = await db.getWatchlist(profile.id);
    return NextResponse.json({ watchlist });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const { anime_id } = await request.json();

    if (!anime_id) {
      return NextResponse.json({ error: 'anime_id is required' }, { status: 400 });
    }

    await db.addToWatchlist(profile.id, anime_id);
    return NextResponse.json({ success: true, message: 'Added to watchlist' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update watchlist' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await requireAuth();
    const { anime_id } = await request.json();

    if (!anime_id) {
      return NextResponse.json({ error: 'anime_id is required' }, { status: 400 });
    }

    await db.removeFromWatchlist(profile.id, anime_id);
    return NextResponse.json({ success: true, message: 'Removed from watchlist' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to remove from watchlist' }, { status: 500 });
  }
}
