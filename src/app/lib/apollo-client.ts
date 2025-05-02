import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Safely read a cookie by name
function getCookie(name: string): string | undefined {
  try {
    if (typeof document === 'undefined') {
      return undefined; // Not in browser environment
    }
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift();
    }
    return undefined;
  } catch (error) {
    console.error('Error reading cookie:', error);
    return undefined;
  }
}

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'include', // This is critical for including cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    console.error('[GraphQL Errors]:', graphQLErrors);
    
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL Error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}, Extensions: ${JSON.stringify(extensions)}`
      );
    });
  }
  
  if (networkError) {
    console.error('[Network Error]:', networkError);
    if (networkError.message) {
      console.error('Error message:', networkError.message);
    }
    if ('statusCode' in networkError) {
      console.error('Status code:', networkError.statusCode);
    }
    if ('result' in networkError) {
      console.error('Result:', networkError.result);
    }
  }
  
  console.log('[Operation]:', operation.operationName);
});

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from cookies
  if (typeof window !== 'undefined') {
    // Use the safer helper function to get token
    const token = getCookie('session-token');
      
    if (token) {
      console.log('Apollo auth token found, length:', token.length);
      // Only log a portion for security
      if (token.length > 10) {
        console.log('Token first 5 chars:', token.substring(0, 5) + '...');
      }
    } else {
      console.warn('No authentication token found. Requests requiring authentication will fail.');
    }

    // Return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      }
    };
  }
  return { headers };
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
}); 