
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Revalidation-Secret');
  const expectedSecret = process.env.REVALIDATION_SECRET_TOKEN;

  if (!expectedSecret) {
    console.error("REVALIDATION_SECRET_TOKEN is not set in environment variables for the tenant site.");
    return NextResponse.json({ message: 'Revalidation service not configured.' }, { status: 500 });
  }

  if (secret !== expectedSecret) {
    console.warn("Invalid revalidation secret token received.");
    return NextResponse.json({ message: 'Invalid secret token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tags, paths } = body; // Expecting { tags?: string[], paths?: string[] }

    let revalidatedItemsOverall = false; // Tracks if any revalidation was successfully performed
    const revalidationDetails: { type: string, item: string, success: boolean, error?: string, message?: string }[] = [];

    if (tags && Array.isArray(tags)) {
      if (tags.length === 0 && (!paths || (Array.isArray(paths) && paths.length === 0))) {
        // If tags array is empty and paths is also empty or not provided
         // return NextResponse.json({ message: 'No tags or paths provided for revalidation.' }, { status: 400 });
      } else {
        for (const tag of tags) {
          if (typeof tag === 'string' && tag.trim() !== '') {
            try {
              revalidateTag(tag.trim());
              revalidationDetails.push({ type: 'tag', item: tag.trim(), success: true, message: 'Revalidated' });
              console.log(`Revalidated tag: ${tag.trim()}`);
              revalidatedItemsOverall = true;
            } catch (e: unknown) {
              console.error(`Failed to revalidate tag ${tag.trim()}:`, e);
              revalidationDetails.push({ type: 'tag', item: tag.trim(), success: false, error: e instanceof Error ? e.message : 'Unknown error' });
            }
          } else {
            console.warn(`Invalid tag format for revalidation: ${tag}`);
            revalidationDetails.push({ type: 'tag', item: String(tag), success: false, error: 'Invalid tag format, must be a non-empty string' });
          }
        }
      }
    }

    if (paths && Array.isArray(paths)) {
       if (paths.length === 0 && (!tags || (Array.isArray(tags) && tags.length === 0))) {
        // If paths array is empty and tags is also empty or not provided
        // This condition is covered by the final check
      } else {
        for (const path of paths) {
           if (typeof path === 'string' && path.trim().startsWith('/')) {
            try {
              revalidatePath(path.trim());
              revalidationDetails.push({ type: 'path', item: path.trim(), success: true, message: 'Revalidated' });
              console.log(`Revalidated path: ${path.trim()}`);
              revalidatedItemsOverall = true;
            } catch (e: unknown) {
              console.error(`Failed to revalidate path ${path.trim()}:`, e);
              revalidationDetails.push({ type: 'path', item: path.trim(), success: false, error: e instanceof Error ? e.message : 'Unknown error' });
            }
          } else {
              console.warn(`Invalid path format for revalidation: ${path}`);
              revalidationDetails.push({ type: 'path', item: String(path), success: false, error: 'Invalid path format, must start with /' });
          }
        }
      }
    }

    // Check if any valid revalidation targets were provided and processed
    if (revalidationDetails.length === 0) {
      return NextResponse.json({ message: 'Missing or invalid tags or paths to revalidate. Provide "tags": ["tag1"] or "paths": ["/path1"] in JSON body.' }, { status: 400 });
    }

    const allSucceeded = revalidationDetails.every(d => d.success);

    return NextResponse.json({
      revalidatedItemsProcessed: revalidationDetails.length, // How many items were attempted
      anySuccessfulRevalidation: revalidatedItemsOverall, // Were any items actually revalidated successfully?
      allRevalidationsSucceeded: allSucceeded, // Did all attempted items succeed?
      details: revalidationDetails,
      timestamp: new Date().toISOString()
    }, { status: allSucceeded ? 200 : (revalidatedItemsOverall ? 207 : 500) }); // 207 if some succeeded, 500 if all attempted failed

  } catch (error: unknown) {
    console.error("Error processing revalidation request:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) { // More specific check for JSON parsing error
        return NextResponse.json({ message: 'Invalid JSON payload. Please ensure the request body is valid JSON.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error processing revalidation request.', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  // Simple check to see if the revalidation token is configured on the server
  // This does NOT validate any incoming token for GET requests.
  const expectedSecret = process.env.REVALIDATION_SECRET_TOKEN;
  if (!expectedSecret) {
    return NextResponse.json({ status: 'error', message: 'Revalidation secret not configured on server.' }, { status: 500 });
  }
  return NextResponse.json({ status: 'active', message: "Revalidation API is active. Use POST to revalidate." });
}
