import { client } from './apollo-client';

/**
 * Clears user-specific cache entries
 */
export const clearUserCache = async () => {
  try {
    console.log('Clearing user-specific cache...');
    
    // Evict specific fields that contain user data
    client.cache.evict({ fieldName: 'me' });
    client.cache.evict({ fieldName: 'userTenants' });
    client.cache.evict({ fieldName: 'activeExternalLinks' });
    
    // Run garbage collection to clean up orphaned references
    client.cache.gc();
    
    console.log('User cache cleared successfully');
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
};

/**
 * Clears tenant-specific cache entries
 */
export const clearTenantCache = async (tenantId?: string) => {
  try {
    console.log('Clearing tenant-specific cache...', tenantId ? `for tenant: ${tenantId}` : '');
    
    // Evict tenant-specific fields
    client.cache.evict({ fieldName: 'tenant' });
    
    // If we have a specific tenant ID, evict that specific tenant
    if (tenantId) {
      client.cache.evict({ 
        id: client.cache.identify({ __typename: 'Tenant', id: tenantId }) 
      });
    }
    
    // Run garbage collection
    client.cache.gc();
    
    console.log('Tenant cache cleared successfully');
  } catch (error) {
    console.error('Error clearing tenant cache:', error);
  }
};

/**
 * Clears all cache and resets the store
 */
export const clearAllCache = async () => {
  try {
    console.log('Clearing all Apollo cache...');
    await client.clearStore();
    console.log('All cache cleared successfully');
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Forces a cache refresh for user-related queries
 */
export const forceUserCacheRefresh = async () => {
  try {
    console.log('Forcing user cache refresh...');
    
    // Clear user-specific cache
    await clearUserCache();
    
    console.log('User cache refresh completed');
  } catch (error) {
    console.error('Error forcing user cache refresh:', error);
    throw error;
  }
}; 