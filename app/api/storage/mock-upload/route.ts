import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    // Local uploads directory: .data/uploads/{key}
    const cleanKey = key.replace(/\.\./g, '');
    const targetPath = path.join(process.cwd(), '.data', 'uploads', cleanKey);
    const dir = path.dirname(targetPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const arrayBuffer = await request.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save local upload' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
