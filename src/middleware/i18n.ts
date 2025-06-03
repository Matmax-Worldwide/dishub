import { NextResponse } from 'next/server';
import { MiddlewareFunction } from '@/lib/middleware/factory'; // Adjust path if necessary

const SUPPORTED_LOCALES = ['en', 'es', 'de']; // From legacyLocales
const DEFAULT_LOCALE = 'es'; // From legacyDefaultLocale

export const withI18n: MiddlewareFunction = async (req) => {
  const { pathname, origin, search } = req.nextUrl;

  // Skip i18n logic for API routes, Next.js specific paths, and public assets.
  if (pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|txt|xml|webmanifest|json|map)$/i)) {
    // If this middleware is part of a chain (via compose), returning nothing (void)
    // allows the next middleware in the chain to process the request.
    return;
  }

  // Handle root path redirect
  if (pathname === '/') {
    console.log('withI18n: Root path, redirecting to default locale.');
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${search}`, origin), 308); // Use 308 for permanent redirect
  }

  // Check if pathname already has a supported locale prefix
  let currentLocale = '';
  let pathWithoutLocale = pathname; // Initialize with original pathname

  for (const loc of SUPPORTED_LOCALES) {
    if (pathname.startsWith(`/${loc}/`)) {
      currentLocale = loc;
      pathWithoutLocale = pathname.substring(`/${loc}`.length);
      // Ensure pathWithoutLocale starts with a slash if it's not empty
      if (pathWithoutLocale === '' || !pathWithoutLocale.startsWith('/')) {
        pathWithoutLocale = '/' + pathWithoutLocale;
      }
      break;
    } else if (pathname === `/${loc}`) {
      currentLocale = loc;
      pathWithoutLocale = '/'; // Path is just the locale itself
      break;
    }
  }

  // If no valid locale prefix, redirect to default locale
  if (!currentLocale) {
    console.log(`withI18n: No valid locale in path '${pathname}', redirecting with default locale '${DEFAULT_LOCALE}'.`);
    // Prepend default locale and preserve original path and search query
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, origin), 308); // Use 308
  }

  // Valid locale is present.
  // Set headers for downstream use (e.g., by withPageAuth or API routes/RSCs)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-active-locale', currentLocale);
  requestHeaders.set('x-path-without-locale', pathWithoutLocale);

  // console.log(`withI18n: Active locale: ${currentLocale}, Path without locale: ${pathWithoutLocale}`);

  // Pass the request with new headers to the next middleware or handler in the chain.
  // The compose function in factory.ts will handle this.
  // If this middleware modifies 'res' (the NextResponse passed in), it should return 'res'.
  // If it creates a new response (like NextResponse.next() with new headers), it returns that.
  // If it redirects, it returns the redirect response.
  // If it does nothing (like for API routes), it returns void.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
};
