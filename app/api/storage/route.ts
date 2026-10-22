import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { getStorageLedger } from '@/lib/quota/ledger';

export async function GET() {
  const profile = await getCurrentSession();
  const summary = await getStorageLedger(profile?.id);
  return NextResponse.json(summary);
}
