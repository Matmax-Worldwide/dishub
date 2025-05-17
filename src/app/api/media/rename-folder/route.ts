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
    // Get the oldPath and newName from request body
    const body = await request.json();
    const { oldPath, newName } = body;
    
    console.log(`POST /api/media/rename-folder - Renaming folder: ${oldPath} to ${newName}`);
    
    if (!oldPath || !newName) {
      return NextResponse.json(
        { error: 'Old path and new name are required' },
        { status: 400 }
      );
    }
    
    // Normalize paths
    const normalizedOldPath = oldPath.endsWith('/') ? oldPath : `${oldPath}/`;
    
    // Extract parent path and build new path
    let parentPath = '';
    let newPath = newName;
    
    // Handle nested folders
    if (oldPath.includes('/')) {
      const pathParts = oldPath.split('/');
      pathParts.pop(); // Remove the old folder name
      parentPath = pathParts.join('/');
      newPath = parentPath ? `${parentPath}/${newName}` : newName;
    }
    
    const normalizedNewPath = newPath.endsWith('/') ? newPath : `${newPath}/`;
    
    console.log(`Renaming folder from ${normalizedOldPath} to ${normalizedNewPath}`);
    
    // First, list all objects in the folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedOldPath
    });
    
    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      // If no objects, just create the new empty folder and delete the old one
      const createFolderCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: normalizedNewPath,
        Body: '' // Empty content
      });
      
      await s3Client.send(createFolderCommand);
      
      // Delete the old folder marker
      const deleteFolderCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: normalizedOldPath
      });
      
      await s3Client.send(deleteFolderCommand);
      
      return NextResponse.json({
        success: true,
        message: 'Empty folder renamed successfully'
      });
    }
    
    // Process each object: copy to new location, then delete original
    const results = [];
    const errors = [];
    for (const object of response.Contents) {
      const sourceKey = object.Key as string;
      
      // Skip if not in this exact folder (could be in subfolder)
      if (sourceKey === normalizedOldPath) continue; // This is the folder marker
      
      // Replace the old path prefix with the new path
      const destinationKey = sourceKey.replace(normalizedOldPath, normalizedNewPath);
      
      console.log(`Copying ${sourceKey} to ${destinationKey}`);
      
      // Copy the object to the new location
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${encodeURIComponent(sourceKey)}`,
        Key: destinationKey
      });
      
      try {
        await s3Client.send(copyCommand);
        results.push({
          originalKey: sourceKey,
          newKey: destinationKey
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({
          originalKey: sourceKey,
          error: errorMessage
        });
      }
      
      // Delete the original
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: sourceKey
      });
      
      await s3Client.send(deleteCommand);
    }
    
    // Create the new folder marker (empty object with a trailing slash)
    const folderMarkerCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: normalizedNewPath,
      Body: '' // Empty content
    });
    
    await s3Client.send(folderMarkerCommand);
    
    // Delete the old folder marker
    const deleteFolderCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: normalizedOldPath
    });
    
    await s3Client.send(deleteFolderCommand);
    
    return NextResponse.json({
      success: true,
      oldPath: normalizedOldPath,
      newPath: normalizedNewPath,
      itemsProcessed: results.length,
      errors: errors.length > 0 ? errors : null,
      message: `Carpeta renombrada con éxito. ${results.length} archivos movidos de ${normalizedOldPath} a ${normalizedNewPath}`
    });
  } catch (error) {
    console.error('Error renaming folder in S3:', error);
    return NextResponse.json(
      { error: 'Failed to rename folder' },
      { status: 500 }
    );
  }
} 