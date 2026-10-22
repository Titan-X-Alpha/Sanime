import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    let filePath: string | null = null;
    let mimeType = 'video/mp4';

    if (key) {
      const cleanKey = key.replace(/\.\./g, '');
      const candidate = path.join(process.cwd(), '.data', 'uploads', cleanKey);
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        if (cleanKey.endsWith('.mkv')) {
          mimeType = 'video/x-matroska';
        } else if (cleanKey.endsWith('.webm')) {
          mimeType = 'video/webm';
        }
      }
    }

    // Fallback to local sample video if not found
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'videos', 'sample.mp4');
      mimeType = 'video/mp4';
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Video not found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      const headers = new Headers();
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', String(chunksize));
      headers.set('Content-Type', mimeType);

      // @ts-ignore
      return new Response(stream, {
        status: 206,
        headers,
      });
    }

    const headers = new Headers();
    headers.set('Content-Length', String(fileSize));
    headers.set('Content-Type', mimeType);
    headers.set('Accept-Ranges', 'bytes');

    const stream = fs.createReadStream(filePath);
    // @ts-ignore
    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
