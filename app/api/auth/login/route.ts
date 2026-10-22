import { NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { loginSchema } from '@/lib/validation/schemas';
import { normalizeUsername, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const normalized = normalizeUsername(result.data.username);
    const profile = await db.getProfileByNormalizedUsername(normalized);

    if (!profile) {
      return NextResponse.json(
        { error: `User "${result.data.username}" not found. Please register first.` },
        { status: 404 }
      );
    }

    await setSessionCookie(profile);

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
