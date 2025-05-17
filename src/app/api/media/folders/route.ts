import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListObjectsV2Command 
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

// Helper function to count subfolders inside a given folder path
async function countSubfolders(folderPath: string): Promise<number> {
  try {
    // Normalize folder path to ensure it ends with a trailing slash
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    // List objects with delimiter to get only direct subfolders
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPath,
      Delimiter: '/'
    });
    
    const response = await s3Client.send(command);
    
    // Count CommonPrefixes which represent subfolders
    return response.CommonPrefixes?.length || 0;
  } catch (error) {
    console.error(`Error counting subfolders for path ${folderPath}:`, error);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    // Get the prefix from query parameters
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    
    console.log(`GET /api/media/folders - Processing request for prefix: ${prefix}`);
    
    // Ensure the prefix ends with a slash if it's not empty
    const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : `${prefix}/`) : '';
    
    // List objects in the bucket with delimiter to get "folders"
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: normalizedPrefix,
      Delimiter: '/'
    });
    
    console.log(`Sending ListObjectsV2Command to bucket: ${bucketName} with prefix: ${normalizedPrefix}`);
    const response = await s3Client.send(command);
    console.log('Response received from S3');
    
    // Extract folder names from CommonPrefixes
    const folders = response.CommonPrefixes?.map(prefix => {
      const folderPath = prefix.Prefix as string;
      // Get just the folder name (last segment without the trailing slash)
      const folderName = folderPath.split('/').filter(Boolean).pop() || '';
      return { path: folderPath, name: folderName };
    }) || [];
    
    console.log(`Found ${folders.length} folders in S3 bucket`);
    
    // Count subfolders for each folder in parallel
    const foldersWithSubfolderCounts = await Promise.all(
      folders.map(async (folder) => {
        const subfolderCount = await countSubfolders(folder.path);
        return {
          name: folder.name,
          subfolderCount
        };
      })
    );
    
    // Extract just the names for backward compatibility with existing code
    const folderNames = folders.map(folder => folder.name);
    
    return NextResponse.json({ 
      folders: folderNames,
      folderDetails: foldersWithSubfolderCounts
    });
  } catch (error) {
    console.error('Error fetching folders from S3:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
} 