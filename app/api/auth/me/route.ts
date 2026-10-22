import { NextResponse } from 'next/server';
import { getCurrentSession, clearSessionCookie } from '@/lib/auth/session';

export async function GET() {
  const profile = await getCurrentSession();
  if (!profile) {
    return NextResponse.json({ authenticated: false, profile: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, profile });
}

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
