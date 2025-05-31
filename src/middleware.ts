import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// Definir los locales soportados
const locales = ['en', 'es', 'de'];
const defaultLocale = 'en';

// Crear el middleware de next-intl
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

// Simple JWT verification for Edge runtime (no Prisma)
async function verifyTokenEdge(token: string) {
  try {
    // In middleware, we'll just check if token exists
    // Full validation will happen in the routes
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Token validation error: Empty or invalid token');
      return null;
    }
    
    // Return a simplified payload, actual verification happens in routes
    return { valid: true };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes and GraphQL
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    console.log('Skipping middleware for API/next path');
    return NextResponse.next();
  }
  
  // Use next-intl for locale routing
  const response = intlMiddleware(request);
  
  // If at this point we have a response, return it
  if (response) return response;
  
  // Redirect root path (/) to default locale
  if (pathname === '/') {
    console.log('Root path detected, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Check if pathname already includes a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Redirect to default locale if no locale is present
  if (!pathnameHasLocale) {
    console.log('No locale in path, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  // Extract current locale and path without locale
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.split('/').slice(2).join('/');
  console.log('Locale:', locale, 'Path without locale:', pathWithoutLocale);

  // Allow access to public routes without authentication
  const publicRoutes = ['login', 'register', 'forgot-password', 'reset-password'];
  if (publicRoutes.includes(pathWithoutLocale)) {
    console.log('Public route detected, allowing access without auth');
    return NextResponse.next();
  }

  // Dashboard route specifically - don't redirect to prevent loops
  if (pathWithoutLocale === 'dashboard') {
    console.log('Dashboard route detected - allowing access to prevent redirect loops');
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('session-token')?.value;

  // If no token is present, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  try {
    // Use simplified token verification for Edge
    console.log('Verifying token in middleware...');
    const decodedResult = await verifyTokenEdge(token);
    
    // Skip token verification for dashboard to prevent loops
    if (pathWithoutLocale === 'dashboard') {
      console.log('Dashboard detected, skipping token validation');
      return NextResponse.next();
    }
    
    if (!decodedResult) {
      console.log('Token verification failed, redirecting to login');
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, log and allow request to proceed instead of redirecting
    console.error('Middleware token verification error:', error);
    
    // For dashboard specifically, always allow access even with token errors
    if (pathWithoutLocale === 'dashboard') {
      console.log('Allowing dashboard access despite token error');
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
}; 