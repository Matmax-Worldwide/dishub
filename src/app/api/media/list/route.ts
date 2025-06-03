import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { MediaItem } from '@/components/engines/cms/modules/media/types';

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

export async function GET(request: Request) {
  try {
    // Get the prefix from query parameters
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    
    console.log(`GET /api/media/list - Processing request for folder: ${prefix || 'root'}`);
    
    // Prepare the S3 prefix
    let s3Prefix = '';
    
    // Si estamos en la raíz, buscar tanto archivos en 'uploads/' como en la raíz ''
    if (!prefix) {
      console.log('Getting files from root folder');
      
      // Intentamos obtener todos los archivos en la raíz (sin subcarpetas)
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: '/', // This ensures we only get top-level files
        MaxKeys: 1000,
      });
      
      console.log(`Sending ListObjectsV2Command to bucket: ${bucketName} for root files`);
      const response = await s3Client.send(command);
      console.log('Response received from S3');
      
      if (!response.Contents || response.Contents.length === 0) {
        console.log('No items found in S3 bucket root');
        return NextResponse.json({ items: [] });
      }
      
      console.log(`Found ${response.Contents.length} items in S3 bucket root`);
      
      // Filter files in the root (exclude folder objects)
      const files = response.Contents.filter(item => {
        const key = item.Key as string;
        // Exclude objects that are folders (end with a slash)
        return !key.endsWith('/');
      });
      
      console.log(`Filtered to ${files.length} files in root`);
      
      // Process the files
      const mediaItems: MediaItem[] = files.map(item => {
        const key = item.Key as string;
        const fileName = key.split('/').pop() || key;
        // En caso de archivos en la raíz, no hay formato "timestamp-random-"
        const fileNameParts = fileName.split('-');
        let originalFileName = fileName;
        let title = fileName.split('.')[0];
        
        // Verificar si sigue el formato "timestamp-random-originalname"
        if (fileNameParts.length >= 3 && !isNaN(Number(fileNameParts[0]))) {
          originalFileName = fileNameParts.slice(2).join('-');
          title = originalFileName.split('.')[0];
        }
        
        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
        let fileType = 'application/octet-stream';
        
        // Extract folder path from the key
        const folderPath = key.includes('/') ? key.substring(0, key.lastIndexOf('/')) : '';
        
        // Special case: for files directly in the root (no slashes)
        // explicitly set an empty folder path
        const folder = !key.includes('/') ? '' : folderPath;
        
        // Infer file type from extension
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
          fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        } else if (fileExt === 'pdf') {
          fileType = 'application/pdf';
        } else if (['doc', 'docx'].includes(fileExt)) {
          fileType = 'application/msword';
        } else if (['mp4', 'webm', 'ogg'].includes(fileExt)) {
          fileType = `video/${fileExt}`;
        }
        
        return {
          id: `s3-${key}`,
          title,
          fileUrl: getS3PublicUrl(key),
          fileName: originalFileName,
          fileSize: item.Size || 0,
          fileType,
          uploadedAt: item.LastModified ? item.LastModified.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          s3Key: key,
          folder: folder
        };
      });
      
      console.log(`Returning ${mediaItems.length} media items`);
      return NextResponse.json({ items: mediaItems });
    } else {
      // Si no estamos en la raíz, usar el prefijo proporcionado
      s3Prefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
      
      // List objects in the bucket with prefix
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: s3Prefix,
        MaxKeys: 100,
      });
      
      console.log(`Sending ListObjectsV2Command to bucket: ${bucketName} with prefix: ${s3Prefix}`);
      const response = await s3Client.send(command);
      console.log('Response received from S3');
      
      if (!response.Contents || response.Contents.length === 0) {
        console.log('No items found in S3 bucket with this prefix');
        return NextResponse.json({ items: [] });
      }
      
      // Filter out folder objects (those ending with a slash)
      const files = response.Contents.filter(item => {
        const key = item.Key as string;
        return !key.endsWith('/');
      });
      
      // Convert S3 objects to MediaItems
      const mediaItems: MediaItem[] = files.map(item => {
        const key = item.Key as string;
        const fileName = key.split('/').pop() || key;
        const fileNameParts = fileName.split('-');
        // Get everything after timestamp and random string
        const originalFileName = fileNameParts.length >= 3 && !isNaN(Number(fileNameParts[0])) 
          ? fileNameParts.slice(2).join('-')
          : fileName;
        const title = originalFileName.split('.')[0];
        const fileExt = originalFileName.split('.').pop()?.toLowerCase() || '';
        let fileType = 'application/octet-stream';
        
        // Extract folder path from the key
        const folderPath = key.substring(0, key.lastIndexOf('/'));
        
        // Special case: for files directly in the root (no slashes)
        // explicitly set an empty folder path
        const folder = !key.includes('/') ? '' : folderPath;
        
        // Infer file type from extension
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
          fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        } else if (fileExt === 'pdf') {
          fileType = 'application/pdf';
        } else if (['doc', 'docx'].includes(fileExt)) {
          fileType = 'application/msword';
        } else if (['mp4', 'webm', 'ogg'].includes(fileExt)) {
          fileType = `video/${fileExt}`;
        }
        
        return {
          id: `s3-${key}`,
          title,
          fileUrl: getS3PublicUrl(key),
          fileName: originalFileName,
          fileSize: item.Size || 0,
          fileType,
          uploadedAt: item.LastModified ? item.LastModified.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          s3Key: key,
          folder: folder
        };
      });
      
      console.log(`Returning ${mediaItems.length} media items`);
      return NextResponse.json({ items: mediaItems });
    }
  } catch (error) {
    console.error('Error fetching from S3:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
} 