import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
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

export async function POST(request: Request) {
  try {
    // Get the source and target paths from the request body
    const body = await request.json();
    const { sourcePath, targetPath } = body;
    
    console.log(`POST /api/media/move-folder - Moving folder: ${sourcePath} to ${targetPath}`);
    
    if (!sourcePath) {
      return NextResponse.json(
        { error: 'Source folder path is required' },
        { status: 400 }
      );
    }
    
    // Normalize paths
    const normalizedSourcePath = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`;
    
    // Determine the folder name from the source path
    const folderName = sourcePath.includes('/') 
      ? sourcePath.split('/').pop() || ''
      : sourcePath;
      
    // Build the target folder path
    const newFolderPath = targetPath 
      ? `${targetPath}/${folderName}` 
      : folderName;
      
    const normalizedTargetPath = newFolderPath.endsWith('/') ? newFolderPath : `${newFolderPath}/`;
    
    console.log(`Moving folder from ${normalizedSourcePath} to ${normalizedTargetPath}`);
    
    // First, list all objects in the source folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedSourcePath
    });
    
    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      // If no objects, just create the new empty folder and delete the old one
      const createFolderCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: normalizedTargetPath,
        Body: '' // Empty content
      });
      
      await s3Client.send(createFolderCommand);
      
      // Delete the old folder marker
      const deleteFolderCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: normalizedSourcePath
      });
      
      await s3Client.send(deleteFolderCommand);
      
      return NextResponse.json({
        success: true,
        message: `Empty folder moved successfully from ${sourcePath} to ${newFolderPath}`
      });
    }
    
    // Process each object: copy to new location, then delete original
    const results = [];
    const errors = [];
    
    for (const object of response.Contents) {
      const sourceKey = object.Key as string;
      
      try {
        // Calculate the new key by replacing the source prefix with the target prefix
        const destinationKey = sourceKey.replace(normalizedSourcePath, normalizedTargetPath);
        
        console.log(`Copying ${sourceKey} to ${destinationKey}`);
        
        // Copy the object to the new location
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${encodeURIComponent(sourceKey)}`,
          Key: destinationKey
        });
        
        await s3Client.send(copyCommand);
        
        // Delete the original
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: sourceKey
        });
        
        await s3Client.send(deleteCommand);
        
        results.push({
          originalKey: sourceKey,
          newKey: destinationKey
        });
      } catch (err) {
        console.error(`Error processing ${sourceKey}:`, err);
        errors.push({ key: sourceKey, error: String(err) });
      }
    }
    
    // Create a folder marker (empty object with trailing slash) in the target location
    try {
      const createFolderCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: normalizedTargetPath,
        Body: '' // Empty content
      });
      
      await s3Client.send(createFolderCommand);
    } catch (err) {
      console.error('Error creating new folder marker:', err);
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      sourcePath: normalizedSourcePath,
      targetPath: normalizedTargetPath,
      itemsProcessed: results.length,
      errors: errors.length > 0 ? errors : null,
      message: `Folder moved successfully from ${sourcePath} to ${newFolderPath}`
    });
  } catch (error) {
    console.error('Error moving folder in S3:', error);
    return NextResponse.json(
      { error: 'Failed to move folder' },
      { status: 500 }
    );
  }
} 