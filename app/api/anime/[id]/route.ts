import { NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const anime = await db.getAnimeById(params.id);
  if (!anime) {
    return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
  }

  const episodes = await db.getEpisodesByAnimeId(params.id);
  const profile = await getCurrentSession();
  const inWatchlist = profile ? await db.isInWatchlist(profile.id, params.id) : false;

  return NextResponse.json({ anime, episodes, inWatchlist });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentSession();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.deleteAnime(params.id);
    return NextResponse.json({ success: true, message: 'Anime deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete anime' }, { status: 500 });
  }
}
