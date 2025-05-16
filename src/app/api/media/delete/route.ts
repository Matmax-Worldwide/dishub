import { NextRequest, NextResponse } from 'next/server';
import { 
  S3Client, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;
    
    if (!key) {
      return NextResponse.json(
        { error: 'No key provided' }, 
        { status: 400 }
      );
    }
    
    // Create delete command
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // Execute delete
    await s3Client.send(command);
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 