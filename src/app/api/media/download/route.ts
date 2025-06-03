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

// Enhanced content type detection
function getContentTypeFromFilename(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'zip':
      return 'application/zip';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

// Basic SVG sanitization function
function sanitizeSVG(svgContent: string): string {
  // Remove script tags and event handlers
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, 'data:text/plain')
    .replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const viewMode = searchParams.get('view') === 'true';
    
    if (!key) {
      console.error('No key provided in request');
      return NextResponse.json(
        { error: 'No key provided' }, 
        { status: 400 }
      );
    }
    
    // Log the request details
    console.log(`📥 Download request for key: ${key}, view mode: ${viewMode}`);
    
    try {
      // Create get object command
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      // Get file from S3
      console.log(`🔍 Fetching from S3: bucket=${bucketName}, key=${key}`);
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        console.error(`❌ File not found in S3: ${key}`);
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
      console.log(`📦 File loaded: ${buffer.length} bytes`);
      
      // Extract filename from key
      const filename = key.split('/').pop() || 'download';
      
      // Determine content type with enhanced detection
      let contentType = response.ContentType || getContentTypeFromFilename(filename);
      
      // Override S3 content type if it's generic
      if (contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
        contentType = getContentTypeFromFilename(filename);
        console.log(`🔧 Fixed content type for ${filename}: ${contentType}`);
      }
      
      // Special handling for different file types
      let finalBuffer = buffer;
      
      // Sanitize SVG content for security
      if (contentType === 'image/svg+xml') {
        try {
          const svgContent = buffer.toString('utf-8');
          const sanitizedContent = sanitizeSVG(svgContent);
          finalBuffer = Buffer.from(sanitizedContent, 'utf-8');
          console.log(`🧹 Sanitized SVG file: ${filename}`);
        } catch (error) {
          console.error(`❌ Error sanitizing SVG ${filename}:`, error);
          // If sanitization fails, serve original but with strict CSP
        }
      }
      
      // Log the file details
      console.log(`✅ Serving file: ${filename}, Content-Type: ${contentType}, Size: ${finalBuffer.length}`);
      
      // Create appropriate headers based on view mode and file type
      const headers: HeadersInit = {
        'Content-Type': contentType,
        'Content-Length': finalBuffer.length.toString(),
        // Add CORS headers to allow image loading from any origin
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
      };
      
      // Set cache control based on file type and view mode
      if (viewMode && (contentType.startsWith('image/') || contentType.startsWith('video/'))) {
        // Cache images and videos for longer when viewing
        headers['Cache-Control'] = 'public, max-age=86400, s-maxage=86400'; // 24 hours
      } else {
        // Shorter cache for downloads or other files
        headers['Cache-Control'] = 'public, max-age=3600, s-maxage=3600'; // 1 hour
      }
      
      // Add security headers for SVG files
      if (contentType === 'image/svg+xml') {
        headers['X-Content-Type-Options'] = 'nosniff';
        headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none';";
        headers['X-Frame-Options'] = 'DENY';
        headers['Referrer-Policy'] = 'no-referrer';
      }
      
      // Set Content-Disposition based on view mode
      if (!viewMode) {
        // Force download
        headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      } else {
        // Allow inline viewing
        headers['Content-Disposition'] = `inline; filename="${filename}"`;
      }
      
      // Create response with file data
      const res = new NextResponse(finalBuffer, {
        status: 200,
        headers
      });
      
      console.log(`🚀 Response sent for ${filename}`);
      return res;
      
    } catch (s3Error) {
      console.error(`❌ S3 Error for key ${key}:`, s3Error);
      return NextResponse.json(
        { error: 'File not found in storage', details: String(s3Error) },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('❌ General error in download route:', error);
    return NextResponse.json(
      { error: 'Failed to access file', details: String(error) },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 