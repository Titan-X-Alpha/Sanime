import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { playerPreferencesSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const profile = await requireAuth();
    const prefs = await db.getPlayerPreferences(profile.id);
    return NextResponse.json(prefs);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await requireAuth();
    const body = await request.json();
    const result = playerPreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await db.upsertPlayerPreferences({
      profile_id: profile.id,
      ...result.data,
    });

    return NextResponse.json({ success: true, preferences: updated });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update preferences' }, { status: 500 });
  }
}
