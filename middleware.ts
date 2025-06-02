import { NextRequest, NextResponse } from 'next/server';
import { createMiddleware } from '@/lib/middleware/factory';
import { newMiddlewareStack } from '@/middleware/enhanced';
import { isSimpleFeatureEnabled } from '@/lib/feature-flags'; // Using the simpler version
import { verifyToken } from './lib/auth'; // Adjusted path assuming this file is at src/
import { cookies } from 'next/headers';
import { RoleName } from './hooks/usePermission'; // Adjusted path

// --- START OF LEGACY MIDDLEWARE LOGIC ---
// Logic from the original middleware.ts is encapsulated here.

const legacyLocales = ['en', 'es', 'de'];
const legacyDefaultLocale = 'es';

const legacyRoutePermissions: Record<string, { roles: RoleName[] }> = {
  'admin': { roles: ['ADMIN'] },
  'admin/users': { roles: ['ADMIN'] },
  'admin/roles': { roles: ['ADMIN'] },
  'dashboard/reports': { roles: ['ADMIN', 'MANAGER'] },
  'dashboard/tasks': { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  'dashboard/staff': { roles: ['ADMIN', 'MANAGER'] },
  'dashboard/cms': { roles: ['ADMIN'] },
};

async function legacyMiddleware(request: NextRequest, response: NextResponse): Promise<NextResponse | undefined> {
  // This function now mirrors the logic of the original middleware.
  // The 'response' parameter is available if needed for modification,
  // but the legacy logic typically creates new NextResponse objects.

  console.log('Legacy middleware (in middleware_temp.ts) running on path:', request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    console.log('Legacy (temp): Skipping middleware for API/next path');
    return NextResponse.next();
  }
  
  if (pathname === '/') {
    console.log('Legacy (temp): Root path detected, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${legacyDefaultLocale}`, request.url));
  }

  const pathnameHasLocale = legacyLocales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    console.log('Legacy (temp): No locale in path, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${legacyDefaultLocale}${pathname}`, request.url));
  }

  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.split('/').slice(2).join('/');
  console.log('Legacy (temp) Locale:', locale, 'Path without locale:', pathWithoutLocale);

  const publicRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'access-denied'];
  if (publicRoutes.includes(pathWithoutLocale)) {
    console.log('Legacy (temp): Public route detected, allowing access without auth');
    return NextResponse.next();
  }

  const cookieStore = cookies();
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    console.log('Legacy (temp): No token found, redirecting to login');
    return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
  }

  try {
    console.log('Legacy (temp): Verifying token in middleware...');
    const decodedResult = await verifyToken(token);
    
    if (!decodedResult) {
      console.log('Legacy (temp): Token verification failed, redirecting to login');
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    
    let userRole = 'USER';
    if (decodedResult.role) {
      if (typeof decodedResult.role === 'string') {
        userRole = decodedResult.role;
      } else if (typeof decodedResult.role === 'object' && 'name' in decodedResult.role) {
        userRole = (decodedResult.role as { name: string }).name;
      }
    }
    
    const decoded = {
      userId: decodedResult.userId as string,
      role: userRole
    };
    
    console.log('Legacy (temp): Token verified for user:', decoded.userId, 'with role:', decoded.role);

    const isProtectedRoute = Object.keys(legacyRoutePermissions).some(route =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
    );

    if (isProtectedRoute) {
      console.log('Legacy (temp): Protected route, checking permissions');
      let matchedRoute = '';
      let matchedConfig = null;
      
      for (const route in legacyRoutePermissions) {
        if (pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)) {
          if (route.length > matchedRoute.length) {
            matchedRoute = route;
            matchedConfig = legacyRoutePermissions[route];
          }
        }
      }
      
      if (matchedConfig && !matchedConfig.roles.includes(decoded.role as RoleName)) {
        console.log(`Legacy (temp): Access denied to ${pathWithoutLocale} for role ${decoded.role}`);
        return NextResponse.redirect(new URL(`/${locale}/access-denied?from=${encodeURIComponent(pathname)}`, request.url));
      }
    }

    if (pathWithoutLocale.startsWith('api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-role', decoded.role);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Legacy (temp): Middleware token verification error:', error);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
}
// --- END OF LEGACY MIDDLEWARE LOGIC ---

// Main exported middleware using the factory pattern
export default createMiddleware(async (request: NextRequest) => {
  const baseResponse = NextResponse.next(); // Initial response for chaining

  if (isSimpleFeatureEnabled(request, 'use-new-middleware')) {
    console.log('Using new middleware stack (from middleware_temp.ts).');
    const result = await newMiddlewareStack(request, baseResponse);
    return result || baseResponse; // Return result or the base if void
  } else {
    console.log('Using legacy middleware stack (from middleware_temp.ts).');
    return legacyMiddleware(request, baseResponse);
  }
});

// Configuration for the middleware
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};
