import { NextResponse } from 'next/server';

export async function PUT() {
  // Local mock upload receiver simulating Cloudflare R2 direct PUT upload
  return new NextResponse(null, { status: 200 });
}

export async function POST() {
  return new NextResponse(null, { status: 200 });
}
