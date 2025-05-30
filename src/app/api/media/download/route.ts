import { NextRequest, NextResponse } from 'next/server';
import { 
  S3Client, 
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Create S3 client (server-side only)
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
  }
});

// S3 bucket name
const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'vercelvendure';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const viewMode = searchParams.get('view') === 'true';
    
    if (!key) {
      return NextResponse.json(
        { error: 'No key provided' }, 
        { status: 400 }
      );
    }
    
    // Log the request details
    console.log(`Download request for key: ${key}, view mode: ${viewMode}`);
    
    // Create get object command
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // Get file from S3
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Convert readable stream to buffer
    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Extract filename from key
    const filename = key.split('/').pop() || 'download';
    
    // Set appropriate content type
    let contentType = response.ContentType || 'application/octet-stream';
    
    // Special case for PDFs: check filename
    if (filename.toLowerCase().endsWith('.pdf') && contentType === 'application/octet-stream') {
      console.log(`Fixed content type for PDF file: ${filename}`);
      contentType = 'application/pdf';
    }
    
    // Special case for SVGs: check filename
    if (filename.toLowerCase().endsWith('.svg') && contentType === 'application/octet-stream') {
      console.log(`Fixed content type for SVG file: ${filename}`);
      contentType = 'image/svg+xml';
    }
    
    // Log the file details
    console.log(`Serving file: ${filename}, Content-Type: ${contentType}, Size: ${buffer.length}`);
    
    // Create appropriate headers based on view mode
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
    };
    
    // Add security headers for SVG files
    if (contentType === 'image/svg+xml') {
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; script-src 'none';";
    }
    
    // If downloading (not viewing), add Content-Disposition header
    if (!viewMode) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    } else {
      // For viewing, use inline disposition
      headers['Content-Disposition'] = `inline; filename="${filename}"`;
    }
    
    // Create response with file data
    const res = new NextResponse(buffer, {
      status: 200,
      headers
    });
    
    return res;
  } catch (error) {
    console.error('Error accessing S3 file:', error);
    return NextResponse.json(
      { error: 'Failed to access file' },
      { status: 500 }
    );
  }
} 