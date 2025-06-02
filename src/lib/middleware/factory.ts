import { NextRequest, NextResponse } from 'next/server';

// Define a more flexible Middleware type that can be chained or used standalone.
// It can return void (if it only modifies the request/response or does not terminate),
// or a NextResponse (if it redirects, rewrites, or ends the response).
export type MiddlewareFunction = (
  req: NextRequest,
  res: NextResponse // Pass response to allow modification or use as base for new response
) => Promise<NextResponse | void> | NextResponse | void;


// The compose function takes multiple middleware functions and returns a single one.
// It processes them in order. If a middleware returns a NextResponse,
// it might short-circuit the chain (e.g., for redirects).
export function compose(...middlewares: MiddlewareFunction[]): MiddlewareFunction {
  return async (req: NextRequest, res: NextResponse) => {
    let currentResponse: NextResponse | void = undefined; // Start with undefined or allow initial res to be passed

    for (const mw of middlewares) {
      // If a previous middleware returned a response (e.g. redirect),
      // and it's a terminal one, we might want to stop processing.
      // However, typical composition allows later middleware to still run or override.
      // For simplicity here, we'll let each middleware decide.
      // A more robust compose might check if currentResponse is a redirect/end.

      const result = await mw(req, currentResponse || res); // Pass original res if currentResponse is void

      if (result instanceof NextResponse) {
        currentResponse = result; // Update currentResponse if one is returned
        // Check if it's a redirect or an error that should stop the chain
        if (result.headers.has('Location') || result.status >= 400) {
          return currentResponse; // Short-circuit for redirects or errors
        }
      }
    }
    // If currentResponse is still void, it means all middlewares executed without producing a new response
    // so we return the original (potentially modified) response or a default NextResponse.next().
    return currentResponse || res || NextResponse.next();
  };
}

// createMiddleware is a simple wrapper, its utility might depend on specific patterns.
// In this context, it might not be strictly necessary if 'compose' is the primary tool.
// The example from the guide was: export default createMiddleware(async (request) => { ... })
// This suggests it's for the final export in the main middleware.ts
// Let's define it to match the guide's root middleware.ts structure.
export type RootMiddlewareHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse;

export function createMiddleware(handler: RootMiddlewareHandler): RootMiddlewareHandler {
  return async (request: NextRequest) => {
    return handler(request);
  };
}
