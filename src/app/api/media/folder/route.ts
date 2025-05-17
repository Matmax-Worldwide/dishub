import { NextResponse } from 'next/server';
import { 
  S3Client, 
  PutObjectCommand,
  ListObjectsV2Command,
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

export async function POST(request: Request) {
  try {
    // Get the folder path from request body
    const body = await request.json();
    const { folderPath } = body;
    
    console.log(`POST /api/media/folder - Creating folder: ${folderPath}`);
    
    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      );
    }
    
    // Ensure the folder path ends with a slash
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    // Create the folder (empty object with a trailing slash)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: normalizedPath,
      Body: '' // Empty content
    });
    
    console.log(`Sending PutObjectCommand to bucket: ${bucketName} for folder: ${normalizedPath}`);
    await s3Client.send(command);
    console.log('Folder created successfully');
    
    return NextResponse.json({ 
      success: true,
      folderPath: normalizedPath
    });
  } catch (error) {
    console.error('Error creating folder in S3:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the folder path from URL
    const url = new URL(request.url);
    const folderPath = url.searchParams.get('path');
    
    console.log(`DELETE /api/media/folder - Deleting folder: ${folderPath}`);
    
    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      );
    }
    
    // Ensure the folder path ends with a slash
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    // First, list all objects in this folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPath
    });
    
    const response = await s3Client.send(listCommand);
    
    // Delete each object in the folder (including the folder itself)
    if (response.Contents && response.Contents.length > 0) {
      for (const object of response.Contents) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: object.Key as string
        });
        
        await s3Client.send(deleteCommand);
      }
    } else {
      // If no objects with this prefix, just try to delete the folder marker
      const deleteFolderCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: normalizedPath
      });
      
      await s3Client.send(deleteFolderCommand);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder in S3:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
} 