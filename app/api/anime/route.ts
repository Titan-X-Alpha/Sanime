import { NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { animeCreateSchema } from '@/lib/validation/schemas';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') || undefined;
  const animeList = await db.getAllAnime(search);
  return NextResponse.json({ anime: animeList });
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentSession();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = animeCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const created = await db.createAnime(result.data);
    return NextResponse.json({ success: true, anime: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create anime' }, { status: 500 });
  }
}
