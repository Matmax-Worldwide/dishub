import { NextRequest } from 'next/server';

interface FeatureFlagOptions {
  percentage?: number;
  userIds?: string[];
  headers?: Record<string, string>;
  // Add other targeting options like geo-location, etc.
}

// A more fleshed-out example based on the guide for getFeatureFlag
export async function getFeatureFlag(
  request: NextRequest,
  flagName: string,
  options?: FeatureFlagOptions
): Promise<boolean> {
  // 1. Check for direct query parameter override (for testing)
  const queryParam = request.nextUrl.searchParams.get(flagName);
  if (queryParam) {
    return queryParam === 'true';
  }

  // 2. Check for header overrides (e.g., from Edge Config or upstream proxy)
  if (options?.headers) {
    for (const headerName in options.headers) {
      if (request.headers.get(headerName) === options.headers[headerName]) {
        return true;
      }
    }
  }

  // 3. Vercel Edge Config or similar (conceptual - requires actual SDK/API calls)
  // This is a placeholder for actual Edge Config integration
  // For example, using @vercel/edge-config:
  // if (process.env.EDGE_CONFIG) {
  //   try {
  //     const flagValue = await get(flagName); // from @vercel/edge-config
  //     if (typeof flagValue === 'boolean') return flagValue;
  //     // Add more complex logic based on Edge Config item structure if needed
  //   } catch (error) {
  //     console.error(`Error fetching flag ${flagName} from Edge Config:`, error);
  //   }
  // }


  // 4. User ID targeting
  // const userId = request.headers.get('x-user-id'); // Assuming user ID is available in header
  // if (userId && options?.userIds?.includes(userId)) {
  //   return true;
  // }

  // 5. Percentage rollout (simplified example)
  // This needs a consistent way to bucket users, often using the user ID or a session ID.
  // if (options?.percentage && options.percentage > 0) {
  //   const randomNumber = Math.random() * 100; // Inconsistent for same user across requests
  //   // A more stable approach would use a hash of userId/sessionId % 100
  //   if (randomNumber < options.percentage) {
  //     return true;
  //   }
  // }

  // Default to false if no other condition met
  return false;
}

// Simpler isFeatureEnabled for basic cookie/query param checks if not using complex getFeatureFlag
export function isSimpleFeatureEnabled(req: NextRequest, flagName: string): boolean {
  const queryParam = req.nextUrl.searchParams.get(flagName);
  if (queryParam) return queryParam === 'true';

  const cookie = req.cookies.get(flagName);
  if (cookie) return (typeof cookie === 'string' ? cookie : cookie.value) === 'true';

  return false; // Default to false
}
