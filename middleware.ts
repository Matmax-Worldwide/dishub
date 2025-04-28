import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './src/lib/auth'
import { cookies } from 'next/headers'

// Definir los locales soportados
const locales = ['en', 'es']
const defaultLocale = 'en'

export async function middleware(request: NextRequest) {
  // Log the current path
  console.log('Middleware running on path:', request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname

  // Skip middleware for API routes and GraphQL
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    console.log('Skipping middleware for API/next path');
    return NextResponse.next()
  }
  
  // Allow root path (/) to be accessed directly without redirection
  if (pathname === '/') {
    console.log('Root path detected, allowing access without redirection');
    return NextResponse.next()
  }

  // Check if pathname already includes a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Redirect to default locale if no locale is present
  if (!pathnameHasLocale) {
    console.log('No locale in path, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}`, request.url))
  }

  // Extract current locale and path without locale
  const locale = pathname.split('/')[1]
  const pathWithoutLocale = pathname.split('/').slice(2).join('/')
  console.log('Locale:', locale, 'Path without locale:', pathWithoutLocale);

  // Allow access to public routes without authentication
  const publicRoutes = ['login', 'register', 'forgot-password', 'reset-password']
  if (publicRoutes.includes(pathWithoutLocale)) {
    console.log('Public route detected, allowing access without auth');
    return NextResponse.next()
  }

  // Dashboard route specifically - don't redirect to prevent loops
  if (pathWithoutLocale === 'dashboard') {
    console.log('Dashboard route detected - allowing access to prevent redirect loops');
    return NextResponse.next();
  }

  // Get token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  // If no token is present, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  try {
    // Verify token
    console.log('Verifying token in middleware...');
    const decodedResult = await verifyToken(token);
    
    // Skip token verification for dashboard to prevent loops
    if (pathWithoutLocale === 'dashboard') {
      console.log('Dashboard detected, skipping token validation');
      return NextResponse.next();
    }
    
    if (!decodedResult) {
      console.log('Token verification failed, redirecting to login');
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
    
    // Convert payload to expected type
    const decoded = {
      userId: decodedResult.userId as string,
      role: (decodedResult.role || 'USER') as string
    }
    
    console.log('Token verified successfully for user:', decoded.userId, 'with role:', decoded.role);

    // Add user info to request headers for API routes
    if (pathWithoutLocale.startsWith('api/')) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decoded.userId)
      requestHeaders.set('x-user-role', decoded.role)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    return NextResponse.next()
  } catch (error) {
    // If token is invalid, log and allow request to proceed instead of redirecting
    console.error('Middleware token verification error:', error);
    
    // For dashboard specifically, always allow access even with token errors
    if (pathWithoutLocale === 'dashboard') {
      console.log('Allowing dashboard access despite token error');
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
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
} 