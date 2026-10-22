import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const filename = searchParams.get('filename') || 'episode.mp4';

    let filePath: string | null = null;

    if (key) {
      const cleanKey = key.replace(/\.\./g, '');
      const candidate = path.join(process.cwd(), '.data', 'uploads', cleanKey);
      if (fs.existsSync(candidate)) {
        filePath = candidate;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'videos', 'sample.mp4');
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Length', String(stat.size));

    // @ts-ignore
    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new NextResponse('Failed to download file', { status: 500 });
  }
}
