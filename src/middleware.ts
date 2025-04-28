import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'
import { cookies } from 'next/headers'

interface DecodedToken {
  userId: string
  role: string
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for API routes and GraphQL
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // Check if pathname already includes a locale
  if (!pathname.startsWith('/en') && !pathname.startsWith('/es')) {
    // Redirect to default locale if no locale is present
    return NextResponse.redirect(new URL('/en' + pathname, request.url))
  }

  // Extract current locale and path without locale
  const locale = pathname.split('/')[1]
  const pathWithoutLocale = pathname.split('/').slice(2).join('/')

  // Allow access to public routes without authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  if (publicRoutes.includes(pathWithoutLocale)) {
    return NextResponse.next()
  }

  // Get token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  // If no token is present, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  try {
    // Verify token
    const decoded = (await verifyToken(token) as unknown) as DecodedToken

    // Add user info to request headers for API routes
    if (pathWithoutLocale.startsWith('/api/')) {
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
  } catch {
    // If token is invalid, redirect to login
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