import { NextRequest, NextResponse } from 'next/server';
import { 
  S3Client, 
  PutObjectCommand 
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

// Public URL prefix
const publicUrlPrefix = process.env.NEXT_PUBLIC_S3_URL_PREFIX || 'https://vercelvendure.s3.amazonaws.com';

/**
 * Generates a unique file name for S3 upload
 */
const generateS3FileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `uploads/${timestamp}-${randomString}-${sanitizedName}`;
};

/**
 * Creates a full S3 URL from the key
 */
const getS3PublicUrl = (key: string): string => {
  return `${publicUrlPrefix}/${key}`;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }
    
    // Debug logging for PDF uploads
    console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Convert File to Buffer for S3 upload
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename
    const s3Key = generateS3FileName(file.name);
    console.log(`Generated S3 Key: ${s3Key}`);
    
    // Ensure proper Content-Type for PDFs
    let contentType = file.type;
    if (file.name.toLowerCase().endsWith('.pdf') && (!contentType || contentType === 'application/octet-stream')) {
      contentType = 'application/pdf';
      console.log('Detected PDF file, setting content type to application/pdf');
    }
    
    // Create upload command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: `inline; filename="${file.name}"`,
    });
    
    console.log(`Uploading to S3 with ContentType: ${contentType}`);
    
    // Execute upload
    await s3Client.send(command);
    
    // Get the public URL
    const publicUrl = getS3PublicUrl(s3Key);
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: s3Key,
      fileName: file.name,
      fileSize: buffer.length,
      fileType: contentType // Use our possibly corrected content type
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 