import { NextRequest, NextResponse } from 'next/server';
import { createMiddleware } from '@/lib/middleware/factory';
import { newMiddlewareStack } from '@/middleware/enhanced';
import { isSimpleFeatureEnabled } from '@/lib/feature-flags';
// RoleName import removed as legacyRoutePermissions is removed
// import { RoleName } from './hooks/usePermission';

// --- START OF LEGACY MIDDLEWARE LOGIC ---
// Removed: legacyLocales, legacyDefaultLocale, and legacyRoutePermissions constants
// as they are no longer used by the further stripped-down legacyMiddleware.

async function legacyMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  console.log('Legacy middleware (in middleware_temp.ts, i18n, auth, & page_auth parts removed) running on path:', pathname);

  // Skip middleware for API routes and GraphQL (this was the first check)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    console.log('Legacy (temp): Skipping middleware for API/next path');
    return NextResponse.next();
  }
  
  // Removed: Temporary i18n variable recalculations as no subsequent logic uses them.
  // let localeForLegacy = ...
  // let pathWithoutLocaleForLegacy = ...

  // Removed: Page route authorization logic.
  // const isProtectedRoute = Object.keys(legacyRoutePermissions).some(...);
  // if (isProtectedRoute) { ... }

  console.log('Legacy middleware (all core logic removed) completed. Passing to next.');
  // The legacy middleware, when active (flag OFF), now does nothing but log and pass through.
  // All responsibilities are on the new middleware stack or will be progressively added there.
  return NextResponse.next();
}
// --- END OF LEGACY MIDDLEWARE LOGIC ---

export default createMiddleware(async (request: NextRequest) => {
  const baseResponse = NextResponse.next();

  if (isSimpleFeatureEnabled(request, 'use-new-middleware')) {
    console.log('Using new middleware stack.');
    const result = await newMiddlewareStack(request, baseResponse);
    return result || baseResponse;
  } else {
    console.log('Using legacy middleware stack (all core logic removed).');
    return legacyMiddleware(request);
  }
});

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};
