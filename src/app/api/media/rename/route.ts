import { NextResponse } from 'next/server';
import { 
  S3Client, 
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
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

// Create S3 URL from key
const getS3PublicUrl = (key: string): string => {
  return `${publicUrlPrefix}/${key}`;
};

export async function POST(request: Request) {
  try {
    // Get the key and new name from request body
    const body = await request.json();
    const { key, newName } = body;
    
    console.log(`POST /api/media/rename - Renaming file: ${key} to ${newName}`);
    
    if (!key || !newName) {
      return NextResponse.json(
        { error: 'Key and new name are required' },
        { status: 400 }
      );
    }
    
    // Extract the path and create the new key
    const pathParts = key.split('/');
    pathParts.pop(); // Remove the old filename
    const path = pathParts.join('/');
    const newKey = path ? `${path}/${newName}` : newName;
    
    console.log(`Renaming from ${key} to ${newKey}`);
    
    // Primero, obtener los metadatos y ContentType del objeto original
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const headResponse = await s3Client.send(headCommand);
    const contentType = headResponse.ContentType || 'application/octet-stream';
    const metadata = headResponse.Metadata || {};
    
    console.log(`Original file ContentType: ${contentType}`);
    
    // Copiar el objeto a la nueva ubicación preservando ContentType y metadata
    const copyCommand = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${key}`,
      Key: newKey,
      ContentType: contentType,
      Metadata: metadata,
      MetadataDirective: 'REPLACE' // Usar REPLACE para establecer el nuevo ContentType
    });
    
    await s3Client.send(copyCommand);
    console.log('File copied successfully');
    
    // Then delete the original
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    await s3Client.send(deleteCommand);
    console.log('Original file deleted successfully');
    
    // Return the new information
    return NextResponse.json({
      success: true,
      key: newKey,
      url: getS3PublicUrl(newKey)
    });
  } catch (error) {
    console.error('Error renaming file in S3:', error);
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
} 