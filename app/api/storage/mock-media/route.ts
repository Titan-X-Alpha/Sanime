import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to sample video
  return NextResponse.redirect('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
}
