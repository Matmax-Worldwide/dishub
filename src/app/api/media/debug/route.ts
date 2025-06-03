import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testFile = searchParams.get('file') || searchParams.get('png') || searchParams.get('webp') || searchParams.get('jpg');
  
  if (testFile) {
    // Test image file serving
    const testUrl = `/api/media/download?key=${encodeURIComponent(testFile)}&view=true`;
    
    // Determine file type
    const fileType = testFile.toLowerCase().includes('.png') ? 'PNG' :
                    testFile.toLowerCase().includes('.webp') ? 'WebP' :
                    testFile.toLowerCase().includes('.jpg') || testFile.toLowerCase().includes('.jpeg') ? 'JPEG' :
                    'Unknown';
    
    try {
      const response = await fetch(new URL(testUrl, request.url));
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      return NextResponse.json({
        success: true,
        fileType,
        testUrl,
        status: response.status,
        contentType,
        contentLength,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        fileType,
        error: String(error),
        testUrl
      });
    }
  }
  
  return NextResponse.json({
    message: 'Image Debug Endpoint',
    usage: 'Add ?file=your-file-key.ext to test image serving',
    supportedParams: ['file', 'png', 'webp', 'jpg'],
    examples: [
      '/api/media/debug?file=image.png',
      '/api/media/debug?webp=image.webp', 
      '/api/media/debug?jpg=image.jpg'
    ]
  });
} 