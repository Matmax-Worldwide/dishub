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
    
    if (!key) {
      return NextResponse.json(
        { error: 'No key provided' }, 
        { status: 400 }
      );
    }
    
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
    const contentType = response.ContentType || 'application/octet-stream';
    
    // Create response with file data
    const res = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      }
    });
    
    return res;
  } catch (error) {
    console.error('Error downloading from S3:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 