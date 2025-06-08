import { MediaItem } from './types';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';

/**
 * Configuration for AWS S3
 * These should be set in your environment variables
 */
interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlPrefix: string;
}

// Check if environment variables are set
const isConfigured = (): boolean => {
  // Check both process.env and window.env (if in browser)
  console.log('Environment mode:', process.env.NODE_ENV);
  console.log('S3 Environment Variables:');
  console.log('NEXT_PUBLIC_S3_REGION:', process.env.NEXT_PUBLIC_S3_REGION);
  console.log('NEXT_PUBLIC_S3_BUCKET_NAME:', process.env.NEXT_PUBLIC_S3_BUCKET_NAME);
  console.log('NEXT_PUBLIC_S3_ACCESS_KEY_ID:', process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID ? 'Set (hidden for security)' : 'Not set');
  console.log('NEXT_PUBLIC_S3_SECRET_ACCESS_KEY:', process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY ? 'Set (hidden for security)' : 'Not set');
  console.log('NEXT_PUBLIC_S3_URL_PREFIX:', process.env.NEXT_PUBLIC_S3_URL_PREFIX);
  
  // For browser debugging - check if env variables are properly exposed
  if (typeof window !== 'undefined') {
    console.log('Running in browser environment');
  } else {
    console.log('Running in server environment');
  }
  
  // Additional debug information to help troubleshoot
  if (!process.env.NEXT_PUBLIC_S3_REGION) console.log('Missing: NEXT_PUBLIC_S3_REGION');
  if (!process.env.NEXT_PUBLIC_S3_BUCKET_NAME) console.log('Missing: NEXT_PUBLIC_S3_BUCKET_NAME');
  if (!process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID) console.log('Missing: NEXT_PUBLIC_S3_ACCESS_KEY_ID');
  if (!process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY) console.log('Missing: NEXT_PUBLIC_S3_SECRET_ACCESS_KEY');
  
  return !!(
    process.env.NEXT_PUBLIC_S3_BUCKET_NAME &&
    process.env.NEXT_PUBLIC_S3_REGION &&
    process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID &&
    process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY
  );
};

// This should be configured from environment variables
export const getS3Config = (): S3Config => {
  if (!isConfigured()) {
    console.warn('AWS S3 is not properly configured. Please set environment variables.');
  }
  
  return {
    bucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'vercelvendure',
    region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
    publicUrlPrefix: process.env.NEXT_PUBLIC_S3_URL_PREFIX || 'https://vercelvendure.s3.amazonaws.com',
  };
};

// Create S3 client instance
export const getS3Client = (): S3Client => {
  const config = getS3Config();
  
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('AWS credentials are not properly configured');
  }
  
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    }
  });
};

/**
 * Generates a unique file name for S3 upload
 */
export const generateS3FileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `uploads/${timestamp}-${randomString}-${sanitizedName}`;
};

/**
 * Creates a full S3 URL from the key
 */
export const getS3PublicUrl = (key: string): string => {
  const { publicUrlPrefix } = getS3Config();
  return `${publicUrlPrefix}/${key}`;
};

/**
 * Get dimensions of an image
 */
export const getImageDimensions = async (file: File): Promise<string | undefined> => {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up
      resolve(`${img.width}x${img.height}`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      resolve(undefined);
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Prepares media item for display after upload
 */
export const createMediaItemFromUpload = async (
  file: File, 
  uploadedUrl: string,
  s3Key: string
): Promise<MediaItem> => {
  const dimensions = await getImageDimensions(file);
  
  return {
    id: `s3-${Date.now()}`,
    title: file.name.split('.')[0],
    fileUrl: uploadedUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString().split('T')[0],
    dimensions,
    s3Key // Store the S3 key to use when deleting the object
  };
};

/**
 * Uploads a file to S3
 */
export const uploadToS3 = async (
  file: File, 
  progressCallback: (progress: number) => void
): Promise<{ url: string; key: string }> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  const s3Key = generateS3FileName(file.name);
  
  try {
    progressCallback(10); // Started upload
    
    // Ensure proper content type for PDFs
    let contentType = file.type;
    if (file.name.toLowerCase().endsWith('.pdf') && (!contentType || contentType === 'application/octet-stream')) {
      contentType = 'application/pdf';
      console.log('Client-side: Detected PDF file, setting content type to application/pdf');
    }

    // Create upload command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: file,
      ContentType: contentType,
      ContentDisposition: `inline; filename="${file.name}"`,
    });

    // Execute upload
    progressCallback(30);
    await s3Client.send(command);
    progressCallback(90);

    // Get the public URL
    const publicUrl = getS3PublicUrl(s3Key);
    progressCallback(100);
    
    return { url: publicUrl, key: s3Key };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

/**
 * Fetches a list of media items from S3
 */
export const fetchMediaItemsFromS3 = async (): Promise<MediaItem[]> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    // List objects in the bucket with prefix
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
      MaxKeys: 100, // Adjust as needed
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }
    
    // Convert S3 objects to MediaItems
    return response.Contents.map(item => {
      const key = item.Key as string;
      const fileName = key.split('/').pop() || key;
      
      // Extract original filename from our pattern: timestamp-randomstring-originalfilename
      // The filename is everything after the second dash
      const parts = fileName.split('-');
      const originalFileName = parts.length >= 3 
        ? parts.slice(2).join('-')  // Join all parts after the second dash
        : fileName;
      
      const title = originalFileName.split('.')[0];
      const fileExt = originalFileName.split('.').pop() || '';
      let fileType = 'application/octet-stream';
      
      // Infer file type from extension
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt.toLowerCase())) {
        fileType = `image/${fileExt.toLowerCase() === 'jpg' ? 'jpeg' : fileExt.toLowerCase()}`;
      } else if (['pdf'].includes(fileExt.toLowerCase())) {
        fileType = 'application/pdf';
      } else if (['doc', 'docx'].includes(fileExt.toLowerCase())) {
        fileType = 'application/msword';
      } else if (['mp4', 'webm', 'ogg'].includes(fileExt.toLowerCase())) {
        fileType = `video/${fileExt.toLowerCase()}`;
      }
      
      return {
        id: `s3-${key}`,
        title: title || fileName,
        fileUrl: getS3PublicUrl(key),
        fileName: originalFileName || fileName,
        fileSize: item.Size || 0,
        fileType,
        uploadedAt: item.LastModified ? item.LastModified.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        s3Key: key,
      };
    });
  } catch (error) {
    console.error('Error fetching from S3:', error);
    throw error;
  }
};

/**
 * Deletes a file from S3
 */
export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

/**
 * Gets the total count of media items in S3
 */
export const getMediaItemsCount = async (): Promise<number> => {
  if (!isConfigured()) {
    console.warn('AWS S3 is not properly configured. Returning 0 for media count.');
    return 0;
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    // List objects in the bucket with prefix
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
      MaxKeys: 1000 // Get up to 1000 items
    });
    
    const response = await s3Client.send(command);
    
    // Return the count of items or 0 if none
    return response.Contents ? response.Contents.length : 0;
  } catch (error) {
    console.error('Error getting media count from S3:', error);
    return 0;
  }
};

/**
 * Creates a folder in S3
 * In S3, folders are just objects with a trailing slash and no content
 */
export const createFolderInS3 = async (folderPath: string): Promise<boolean> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  // Ensure the folder path ends with a slash
  const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: normalizedPath,
      Body: ''
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error creating folder in S3:', error);
    return false;
  }
};

/**
 * Lists folders from S3
 */
export const listFoldersFromS3 = async (prefix: string = ''): Promise<string[]> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  // Ensure the prefix ends with a slash if it's not empty
  const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : `${prefix}/`) : '';
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPrefix,
      Delimiter: '/'
    });
    
    const response = await s3Client.send(command);
    
    // Extract folder names from CommonPrefixes
    const folders = response.CommonPrefixes?.map(prefix => {
      const folderPath = prefix.Prefix as string;
      // Get just the folder name (last segment without the trailing slash)
      const folderName = folderPath.split('/').filter(Boolean).pop() || folderPath;
      return folderName;
    }) || [];
    
    return folders;
  } catch (error) {
    console.error('Error listing folders from S3:', error);
    return [];
  }
};

/**
 * Move/rename a file in S3
 * This is done by copying to the new location and then deleting the original
 */
export const moveFileInS3 = async (sourceKey: string, destinationKey: string): Promise<boolean> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    // First, copy the object to the new location
    const copyCommand = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey
    });
    
    await s3Client.send(copyCommand);
    
    // Then delete the original
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: sourceKey
    });
    
    await s3Client.send(deleteCommand);
    
    return true;
  } catch (error) {
    console.error('Error moving/renaming file in S3:', error);
    return false;
  }
};

/**
 * Rename a file in S3
 */
export const renameFileInS3 = async (sourceKey: string, newName: string): Promise<string | null> => {
  // Extract the path without the filename
  const pathParts = sourceKey.split('/');
  const path = pathParts.join('/');
  
  // Create the new destination key with the new name
  const destinationKey = path ? `${path}/${newName}` : newName;
  
  // Move the file
  const success = await moveFileInS3(sourceKey, destinationKey);
  
  return success ? destinationKey : null;
};

/**
 * Move a file to a different folder in S3
 */
export const moveFileToFolderInS3 = async (sourceKey: string, targetFolder: string): Promise<string | null> => {
  // Extract just the filename from the source key
  const fileName = sourceKey.split('/').pop() || '';
  
  // Ensure the target folder has a trailing slash
  const normalizedFolder = targetFolder.endsWith('/') ? targetFolder : `${targetFolder}/`;
  
  // Create the new destination key
  const destinationKey = `${normalizedFolder}${fileName}`;
  
  // Move the file
  const success = await moveFileInS3(sourceKey, destinationKey);
  
  return success ? destinationKey : null;
};

/**
 * Get file metadata from S3
 */
export const getFileMetadataFromS3 = async (key: string): Promise<Record<string, string> | null> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    return response.Metadata || null;
  } catch (error) {
    console.error('Error getting file metadata from S3:', error);
    return null;
  }
};

/**
 * Check if a folder exists in S3
 */
export const checkFolderExistsInS3 = async (folderPath: string): Promise<boolean> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  // Ensure the folder path ends with a slash
  const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPath,
      MaxKeys: 1
    });
    
    const response = await s3Client.send(command);
    
    // If there are any objects with this prefix, the folder exists
    return response.Contents !== undefined && response.Contents.length > 0;
  } catch (error) {
    console.error('Error checking if folder exists in S3:', error);
    return false;
  }
};

/**
 * Deletes a folder and all its contents from S3
 * This requires two steps: 
 * 1. List all objects in the folder
 * 2. Delete each object
 */
export const deleteFolderFromS3 = async (folderPath: string): Promise<boolean> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  // Ensure the folder path ends with a slash
  const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  
  try {
    // First, list all objects in this folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPath
    });
    
    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      // Folder is empty or doesn't exist, just try to delete the folder placeholder
      const deleteFolderCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: normalizedPath
      });
      
      await s3Client.send(deleteFolderCommand);
      return true;
    }
    
    // Delete each object in the folder (including the folder itself)
    for (const object of response.Contents) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: object.Key as string
      });
      
      await s3Client.send(deleteCommand);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting folder from S3:', error);
    return false;
  }
}; 