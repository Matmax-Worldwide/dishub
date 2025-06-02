import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareFunction } from '@/lib/middleware/factory'; // Adjust if path is different
import { verifyToken } from '@/lib/auth'; // Assuming this path is correct from src/
import { cookies } from 'next/headers';

// Fallback helper if x-active-locale header is not present
const getLocaleFromPath = (pathname: string): string => {
  const defaultLocaleForAuth = 'es';
  const supportedLocales = ['en', 'es', 'de'];

  if (!pathname) return defaultLocaleForAuth;
  const segments = pathname.split('/');
  if (segments.length > 1 && supportedLocales.includes(segments[1])) {
    return segments[1];
  }
  return defaultLocaleForAuth;
};

export const withAuth: MiddlewareFunction = async (req, res) => {
  const { pathname, searchParams, origin } = req.nextUrl;

  // Attempt to read locale and path information from headers set by withI18n
  const activeLocaleFromHeader = req.headers.get('x-active-locale');
  const pathWithoutLocaleFromHeader = req.headers.get('x-path-without-locale');

  // Determine currentLocale: prioritize header, fallback to path parsing
  const currentLocale = activeLocaleFromHeader || getLocaleFromPath(pathname);

  // Determine pathWithoutLocale for public route checks: prioritize header, fallback to calculation
  let pathToUseForPublicCheck: string;
  if (pathWithoutLocaleFromHeader) {
    pathToUseForPublicCheck = pathWithoutLocaleFromHeader;
  } else {
    // Fallback calculation if header is not present
    let calculatedPath = pathname;
    // Use the currentLocale (which could be from header or fallback) for stripping
    if (pathname.startsWith(`/${currentLocale}/`)) {
        calculatedPath = pathname.substring(`/${currentLocale}`.length) || "/";
    } else if (pathname === `/${currentLocale}`) { // Case where pathname is just /<locale>
        calculatedPath = "/";
    }
    // Ensure leading slash for the calculated path if it's not just "/"
    if (calculatedPath !== "/" && !calculatedPath.startsWith("/")) {
        calculatedPath = "/" + calculatedPath;
    }
    pathToUseForPublicCheck = calculatedPath;
  }

  // console.log(`withAuth Debug: currentLocale='${currentLocale}', pathToUseForPublicCheck='${pathToUseForPublicCheck}'`);

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/access-denied'];
  if (publicRoutes.some(pRoute => pathToUseForPublicCheck === pRoute || (pRoute !== '/' && pathToUseForPublicCheck.startsWith(pRoute + '/')))) {
    return; // Allow public routes to pass through
  }

  const cookieStore = cookies();
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    console.log(`withAuth: No token for path '${pathname}'. Redirecting to login using locale '${currentLocale}'.`);
    const callbackUrl = pathname + searchParams.toString();
    const loginUrl = new URL(`/${currentLocale}/login`, origin);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decodedResult = await verifyToken(token);

    if (!decodedResult || !decodedResult.userId) {
      console.log(`withAuth: Token verification failed for path '${pathname}'. Redirecting to login using locale '${currentLocale}'.`);
      const loginUrl = new URL(`/${currentLocale}/login`, origin);
      return NextResponse.redirect(loginUrl);
    }

    let userRole = 'USER';
    if (decodedResult.role) {
      if (typeof decodedResult.role === 'string') {
        userRole = decodedResult.role;
      } else if (typeof decodedResult.role === 'object' && decodedResult.role !== null && 'name' in decodedResult.role) {
        userRole = (decodedResult.role as { name: string }).name;
      }
    }
    const userId = decodedResult.userId as string;

    // console.log(`withAuth: User authenticated: ${userId}, Role: ${userRole} for path '${pathname}'`);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-role', userRole);
    // Also ensure the locale headers set by withI18n are preserved if not already on newHeaders
    if (activeLocaleFromHeader) requestHeaders.set('x-active-locale', activeLocaleFromHeader);
    if (pathWithoutLocaleFromHeader) requestHeaders.set('x-path-without-locale', pathWithoutLocaleFromHeader);


    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error(`withAuth: Error during token verification for path '${pathname}':`, error.message);
    const loginUrl = new URL(`/${currentLocale}/login`, origin);
    return NextResponse.redirect(loginUrl);
  }
};
