import { NextRequest, NextResponse } from 'next/server';
import { compose, MiddlewareFunction } from '@/lib/middleware/factory'; // Adjust path
import { withAuth } from './auth'; // Adjust path
import { withI18n } from './i18n'; // Adjust path
import { withTenant } from './tenant'; // Adjust path
import { withMetrics } from './metrics'; // Adjust path
import { withPageAuth } from './pageAuth'; // New import

// This is the new composed middleware stack.
// The order is important: metrics > tenant > i18n > auth > pageAuth.
// Each function is a MiddlewareFunction.
export const newMiddlewareStack: MiddlewareFunction = compose(
  withMetrics,
  withTenant,
  withI18n,
  withAuth,
  withPageAuth // Added withPageAuth to the stack
  // No final coreMiddleware needed here if compose handles the chain
  // and the actual page/API handler is the end of the line.
);

// This default export could be used if enhanced.ts itself was the root middleware.
// However, the plan is to use this stack in the main middleware.ts via feature flag.
// So, newMiddlewareStack is the key export.
// export default newMiddlewareStack;
