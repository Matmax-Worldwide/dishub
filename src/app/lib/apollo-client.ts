import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin',
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
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('session-token='))
      ?.split('=')[1];

    console.log('Apollo auth token:', token ? 'Token found' : 'No token found');

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
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all', // This will prevent throwing on errors
    },
  },
}); 