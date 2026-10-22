import { NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { registerSchema } from '@/lib/validation/schemas';
import { normalizeUsername } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const normalized = normalizeUsername(result.data.username);
    const existing = await db.getProfileByNormalizedUsername(normalized);

    if (existing) {
      return NextResponse.json(
        { error: `Username "${result.data.username}" is already taken.` },
        { status: 409 }
      );
    }

    const profile = await db.createProfile(result.data.username);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      username: profile.username,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
