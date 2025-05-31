# Authorization Header Setup

This document explains how the authorization header system works in the application and how it's automatically configured on login.

## Overview

The application uses JWT tokens for authentication, which are automatically included in API requests via authorization headers. The system is designed to work seamlessly across different parts of the application.

## How It Works

### 1. Login Process

When a user logs in successfully:

1. **Token Storage**: The JWT token is stored in multiple places:
   - Browser cookie (`session-token`) - for server-side access
   - localStorage (`auth_token`) - for client-side access
   - Auth context state - for React components

2. **Global Header Setup**: The authorization header is automatically configured globally for all fetch requests using a fetch interceptor.

3. **Apollo Client**: The Apollo GraphQL client is configured to read the token from cookies and include it in requests.

### 2. Authorization Header Configuration

The authorization header is set up in several layers:

#### A. Global Fetch Interceptor
```typescript
// Automatically adds "Authorization: Bearer <token>" to all fetch requests
window.fetch = function(input, init) {
  const headers = new Headers(init?.headers);
  if (!headers.has('authorization') && token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return originalFetch(input, { ...init, headers });
};
```

#### B. Apollo Client Configuration
```typescript
// Apollo client reads token from cookies and sets authorization header
const authLink = setContext((_, { headers }) => {
  const token = getCookie('session-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});
```

#### C. GraphQL Client Utility
```typescript
// Utility function that creates headers with authorization
export function createAuthHeaders(additionalHeaders = {}) {
  const token = getSessionToken();
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

### 3. Server-Side Token Verification

GraphQL resolvers automatically extract and verify the token:

```typescript
const token = context.req.headers.get('authorization')?.split(' ')[1];
if (!token) {
  throw new Error('Not authenticated');
}
const decoded = await verifyToken(token);
```

## Key Components

### Files Involved

1. **`src/lib/auth-header.ts`** - Core authorization header utilities
2. **`src/hooks/useAuth.tsx`** - Authentication context and state management
3. **`src/app/[locale]/login/page.tsx`** - Login page with header setup
4. **`src/app/lib/apollo-client.ts`** - Apollo client configuration
5. **`src/lib/graphql-client.ts`** - GraphQL client utilities
6. **`src/components/AuthInitializer.tsx`** - Initializes headers on app load

### Key Functions

- `setGlobalAuthorizationHeader(token)` - Sets up global fetch interceptor
- `getSessionToken()` - Retrieves token from cookies
- `createAuthHeaders()` - Creates headers object with authorization
- `initializeAuthorizationHeader()` - Sets up headers from stored token

## Usage Examples

### Making Authenticated API Calls

```typescript
// Option 1: Use the utility function
const headers = createAuthHeaders();
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers,
  body: JSON.stringify({ query, variables }),
});

// Option 2: Let the global interceptor handle it
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables }),
});
// Authorization header is automatically added
```

### Testing Authorization

Use the `AuthTest` component to verify that authorization is working:

```typescript
import { AuthTest } from '@/components/AuthTest';

// Add to any page temporarily
<AuthTest />
```

## Troubleshooting

### Common Issues

1. **Token not found**: Check if user is logged in and token exists in cookies
2. **Invalid token**: Token may have expired or be malformed
3. **Headers not set**: Ensure `AuthInitializer` is included in the app providers

### Debugging

1. Check browser cookies for `session-token`
2. Check localStorage for `auth_token`
3. Use browser dev tools to inspect request headers
4. Use the `AuthTest` component to verify functionality

## Security Considerations

1. **Token Storage**: Tokens are stored in both cookies and localStorage for different use cases
2. **HTTPS Only**: Ensure cookies are only sent over HTTPS in production
3. **Token Expiration**: Implement proper token refresh mechanisms
4. **XSS Protection**: Sanitize all user inputs to prevent token theft

## Migration Notes

If upgrading from a previous authentication system:

1. Ensure all API calls use the new header system
2. Update any custom fetch calls to use `createAuthHeaders()`
3. Test all authenticated routes after migration
4. Clear old authentication data if format has changed 