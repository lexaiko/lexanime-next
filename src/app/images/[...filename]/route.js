import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    
    if (!filename || filename.length === 0) {
      return new NextResponse('Filename is required', { status: 400 });
    }

    // Get just the base filename if it has a prefix path
    const baseFilename = filename[filename.length - 1];
    const filePath = path.join(process.cwd(), 'public', 'images', baseFilename);

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(baseFilename).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.svg') {
        contentType = 'image/svg+xml';
      } else if (ext === '.webp') {
        contentType = 'image/webp';
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    return new NextResponse('Image not found', { status: 404 });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
