import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/app/lib/auth';
import { locales } from './src/app/i18n';

interface DecodedToken {
  userId: string;
  role: string;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session-token')?.value;
  const pathname = request.nextUrl.pathname;

  console.log('Middleware processing path:', pathname);
  console.log('Token present:', !!token);

  // Exclude API and GraphQL routes from middleware
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/graphql')) {
    console.log('Skipping middleware for API/GraphQL route');
    return NextResponse.next();
  }

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If the pathname doesn't have a locale, redirect to default locale (en)
  if (!pathnameHasLocale) {
    console.log('No locale found, redirecting to default locale');
    const url = new URL(`/en${pathname === '/' ? '' : pathname}`, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Extract the locale and the path without locale
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  console.log('Current path without locale:', pathWithoutLocale);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathWithoutLocale)) {
    console.log('Public route, allowing access');
    return NextResponse.next();
  }

  // Verify token for protected routes
  if (!token) {
    console.log('No token found, redirecting to login');
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = await verifyToken(token) as DecodedToken | null;
  if (!decoded) {
    console.log('Invalid token, redirecting to login');
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For API routes, add user info to headers
  if (pathWithoutLocale.startsWith('/api')) {
    console.log('Valid token for API route');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  console.log('Valid token, allowing access to:', pathWithoutLocale);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 