
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = file.name.replace(/[^a-zA-Z0-9.]/g, '') + '-' + uniqueSuffix; 
  // Simple sanitization + unique suffix. 
  // Ideally keep extension. 
  // Let's do: name-timestamp.ext
  
  const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = join(process.cwd(), 'public', 'uploads', originalName);

  try {
    await writeFile(path, buffer);
    return NextResponse.json({ success: true, url: `/uploads/${originalName}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
