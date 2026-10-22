import { NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { episodeCreateSchema } from '@/lib/validation/schemas';
import { getCurrentSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const profile = await getCurrentSession();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = episodeCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const created = await db.createEpisode(result.data);
    return NextResponse.json({ success: true, episode: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create episode' }, { status: 500 });
  }
}
