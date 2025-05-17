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
    // Get the key and target folder from request body
    const body = await request.json();
    
    // Handle both single file and batch operations
    if (body.keys && Array.isArray(body.keys)) {
      // Bulk move operation
      const { keys, targetFolder } = body;
      
      console.log(`POST /api/media/move - Moving ${keys.length} files to folder ${targetFolder}`);
      
      if (!keys.length) {
        return NextResponse.json(
          { error: 'No files specified for move operation' },
          { status: 400 }
        );
      }
      
      // Normalize the target folder path
      const normalizedFolder = targetFolder 
        ? (targetFolder.endsWith('/') ? targetFolder : `${targetFolder}/`) 
        : '';
      
      const results = [];
      const errors = [];
      const isMovingToRoot = targetFolder === '';
      
      // Process each file
      for (const key of keys) {
        try {
          // Extract the filename from the key
          const fileName = key.split('/').pop() || '';
          
          if (!fileName) {
            errors.push({ key, error: 'Invalid key format' });
            continue;
          }
          
          // Create the new key
          const newKey = `${normalizedFolder}${fileName}`;
          
          // Don't do anything if the source and destination are the same
          if (key === newKey) {
            results.push({ 
              originalKey: key,
              newKey: key,
              url: getS3PublicUrl(key),
              message: 'Source and destination are the same, no action taken'
            });
            continue;
          }
          
          console.log(`Moving from ${key} to ${newKey}`);
          
          // Get metadata and ContentType of the original file
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: key
          });
          
          const headResponse = await s3Client.send(headCommand);
          const contentType = headResponse.ContentType || 'application/octet-stream';
          const metadata = headResponse.Metadata || {};
          
          // Copy the object to the new location preserving metadata
          const copyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${key}`,
            Key: newKey,
            ContentType: contentType,
            Metadata: metadata,
            MetadataDirective: 'REPLACE'
          });
          
          await s3Client.send(copyCommand);
          
          // Delete the original
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key
          });
          
          await s3Client.send(deleteCommand);
          
          // Store the result
          results.push({
            originalKey: key,
            newKey: newKey,
            url: getS3PublicUrl(newKey)
          });
        } catch (error) {
          console.error(`Error moving file ${key}:`, error);
          errors.push({ key, error: 'Failed to move file' });
        }
      }
      
      return NextResponse.json({
        success: true,
        results,
        errors,
        totalMoved: results.length,
        totalErrors: errors.length,
        isMovingToRoot
      });
    } else {
      // Single file move operation
      const { key, targetFolder } = body;
      
      console.log(`POST /api/media/move - Moving file: ${key} to folder ${targetFolder}`);
      
      if (!key) {
        return NextResponse.json(
          { error: 'File key is required' },
          { status: 400 }
        );
      }
      
      // Extract the filename from the key
      const fileName = key.split('/').pop() || '';
      
      if (!fileName) {
        return NextResponse.json(
          { error: 'Invalid key format' },
          { status: 400 }
        );
      }
      
      // Normalize the target folder path
      const normalizedFolder = targetFolder 
        ? (targetFolder.endsWith('/') ? targetFolder : `${targetFolder}/`) 
        : '';
      
      // Create the new key
      const newKey = `${normalizedFolder}${fileName}`;
      const isMovingToRoot = targetFolder === '';
      
      // Don't do anything if the source and destination are the same
      if (key === newKey) {
        return NextResponse.json({ 
          success: true,
          key,
          url: getS3PublicUrl(key),
          message: 'Source and destination are the same, no action taken'
        });
      }
      
      console.log(`Moving from ${key} to ${newKey}`);
      
      // Get the metadata and ContentType of the original object
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      const headResponse = await s3Client.send(headCommand);
      const contentType = headResponse.ContentType || 'application/octet-stream';
      const metadata = headResponse.Metadata || {};
      
      console.log(`Original file ContentType: ${contentType}`);
      
      // Copy the object to the new location preserving metadata
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: newKey,
        ContentType: contentType,
        Metadata: metadata,
        MetadataDirective: 'REPLACE'
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
        url: getS3PublicUrl(newKey),
        isMovingToRoot
      });
    }
  } catch (error) {
    console.error('Error moving file in S3:', error);
    return NextResponse.json(
      { error: 'Failed to move file' },
      { status: 500 }
    );
  }
} 