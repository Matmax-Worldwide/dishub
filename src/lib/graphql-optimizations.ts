// GraphQL Query Optimizations
// Implements batching, selective loading, and intelligent caching

interface QueryBatch {
  id: string;
  query: string;
  variables: Record<string, unknown>;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dependencies?: string[];
}

class GraphQLOptimizer {
  private batchQueue: QueryBatch[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly BATCH_DELAY = 10; // ms
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  // Optimized queries with minimal field selection
  private readonly OPTIMIZED_QUERIES = {
    // Minimal page data for initial load
    getPageBasic: `
      query GetPageBasic($slug: String!) {
        getPageBySlug(slug: $slug) {
          id
          title
          slug
          isPublished
          pageType
          locale
          sections {
            id
            sectionId
            order
          }
        }
      }
    `,

    // Section components with video detection
    getSectionComponentsOptimized: `
      query GetSectionComponentsOptimized($sectionId: ID!) {
        getSectionComponents(sectionId: $sectionId) {
          components {
            id
            type
            data
          }
          lastUpdated
        }
      }
    `,

    // Batch multiple sections at once
    getMultipleSections: `
      query GetMultipleSections($sectionIds: [ID!]!) {
        getMultipleSections(sectionIds: $sectionIds) {
          sectionId
          components {
            id
            type
            data
          }
          lastUpdated
        }
      }
    `,

    // Video-specific data only
    getVideoComponents: `
      query GetVideoComponents($sectionIds: [ID!]!) {
        getMultipleSections(sectionIds: $sectionIds) {
          sectionId
          components {
            id
            type
            data {
              videoUrl
              posterUrl
              autoplay
              muted
              controls
            }
          }
        }
      }
    `,

    // Menus with minimal data
    getMenusMinimal: `
      query GetMenusMinimal {
        menus {
          id
          name
          location
          items {
            id
            title
            url
            pageId
            order
            parentId
            page {
              slug
            }
          }
        }
      }
    `
  };

  // Generate cache key from query and variables
  private getCacheKey(query: string, variables: Record<string, unknown>): string {
    return `${query.replace(/\s+/g, ' ').trim()}_${JSON.stringify(variables)}`;
  }

  // Check if cache entry is valid
  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Clean expired cache entries
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Set cache entry with dependencies
  private setCache<T>(
    key: string, 
    data: T, 
    ttl: number = this.DEFAULT_TTL,
    dependencies?: string[]
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      dependencies
    });

    // Clean cache periodically
    if (this.cache.size % 100 === 0) {
      this.cleanCache();
    }
  }

  // Get cached data
  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && this.isCacheValid(entry)) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  // Invalidate cache by dependencies
  invalidateByDependency(dependency: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        this.cache.delete(key);
      }
    }
  }

  // Execute GraphQL request with caching
  async executeQuery<T>(
    query: string,
    variables: Record<string, unknown> = {},
    options: {
      cache?: boolean;
      ttl?: number;
      dependencies?: string[];
      batch?: boolean;
    } = {}
  ): Promise<T> {
    const {
      cache = true,
      ttl = this.DEFAULT_TTL,
      dependencies,
      batch = false
    } = options;

    const cacheKey = this.getCacheKey(query, variables);

    // Check cache first
    if (cache) {
      const cached = this.getCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use batching if enabled
    if (batch) {
      return this.batchQuery<T>(query, variables, cacheKey, ttl, dependencies);
    }

    // Execute immediately
    try {
      const { gqlRequest } = await import('./graphql-client');
      const result = await gqlRequest<T>(query, variables);
      
      if (cache) {
        this.setCache(cacheKey, result, ttl, dependencies);
      }
      
      return result;
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw error;
    }
  }

  // Batch multiple queries together
  private async batchQuery<T>(
    query: string,
    variables: Record<string, unknown>,
    cacheKey: string,
    ttl: number,
    dependencies?: string[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add to batch queue
      this.batchQueue.push({
        id: cacheKey,
        query,
        variables,
        resolve: resolve as (data: unknown) => void,
        reject,
        timestamp: Date.now()
      });

      // Set timeout to execute batch
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.executeBatch(ttl, dependencies);
        }, this.BATCH_DELAY);
      }
    });
  }

  // Execute batched queries
  private async executeBatch(ttl?: number, dependencies?: string[]): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    try {
      const { gqlRequest } = await import('./graphql-client');
      
      // Execute all queries in parallel
      const results = await Promise.allSettled(
        batch.map(item => 
          gqlRequest(item.query, item.variables).then(result => ({
            id: item.id,
            result,
            item
          }))
        )
      );

      // Resolve individual promises
      results.forEach((result, index) => {
        const batchItem = batch[index];
        
        if (result.status === 'fulfilled') {
          const { result: data } = result.value;
          batchItem.resolve(data);
          
          // Cache the result with provided ttl and dependencies
          this.setCache(batchItem.id, data, ttl, dependencies);
        } else {
          batchItem.reject(new Error(result.reason));
        }
      });

    } catch (error) {
      // Reject all pending queries
      batch.forEach(item => {
        item.reject(error instanceof Error ? error : new Error('Batch execution failed'));
      });
    }
  }

  // Optimized page loading with video detection
  async loadPageOptimized(slug: string): Promise<{
    page: unknown;
    sections: unknown[];
    videoSections: string[];
  }> {
    // First, load basic page data
    const pageData = await this.executeQuery(
      this.OPTIMIZED_QUERIES.getPageBasic,
      { slug },
      { cache: true, ttl: 10 * 60 * 1000, dependencies: [`page:${slug}`] }
    );

    const page = (pageData as { getPageBySlug: unknown }).getPageBySlug;
    if (!page || !(page as { sections?: unknown[] }).sections) {
      return { page, sections: [], videoSections: [] };
    }

    const sections = (page as { sections: { sectionId: string }[] }).sections;
    const sectionIds = sections.map(s => s.sectionId);

    // Load all sections in parallel
    const sectionsData = await Promise.all(
      sectionIds.map(sectionId =>
        this.executeQuery(
          this.OPTIMIZED_QUERIES.getSectionComponentsOptimized,
          { sectionId },
          { 
            cache: true, 
            ttl: 5 * 60 * 1000, 
            dependencies: [`section:${sectionId}`],
            batch: true 
          }
        )
      )
    );

    // Identify video sections for preloading
    const videoSections: string[] = [];
    const processedSections = sectionsData.map((data, index) => {
      const sectionData = (data as { getSectionComponents: { components: { type: string }[] } }).getSectionComponents;
      
      // Check if section contains video components
      const hasVideo = sectionData.components.some(comp => 
        comp.type.toLowerCase() === 'video' || comp.type.toLowerCase() === 'videosection'
      );
      
      if (hasVideo) {
        videoSections.push(sectionIds[index]);
      }
      
      return sectionData;
    });

    return {
      page,
      sections: processedSections,
      videoSections
    };
  }

  // Preload videos from video sections
  async preloadVideoSections(videoSectionIds: string[]): Promise<void> {
    if (videoSectionIds.length === 0) return;

    try {
      const videoData = await this.executeQuery(
        this.OPTIMIZED_QUERIES.getVideoComponents,
        { sectionIds: videoSectionIds },
        { cache: true, ttl: 15 * 60 * 1000 }
      );

      const sections = (videoData as { getMultipleSections: unknown[] }).getMultipleSections;
      const videoUrls: string[] = [];

      sections.forEach((section: unknown) => {
        const sectionData = section as { components: { type: string; data: { videoUrl?: string } }[] };
        sectionData.components.forEach(comp => {
          if (comp.type.toLowerCase() === 'video' && comp.data.videoUrl) {
            videoUrls.push(comp.data.videoUrl);
          }
        });
      });

      // Preload videos using video preloader
      if (videoUrls.length > 0) {
        const { videoPreloader } = await import('./video-preloader');
        await videoPreloader.preloadVideos(videoUrls, 'high');
      }

    } catch (error) {
      console.error('Failed to preload video sections:', error);
    }
  }

  // Load menus with caching
  async loadMenus(): Promise<unknown> {
    return this.executeQuery(
      this.OPTIMIZED_QUERIES.getMenusMinimal,
      {},
      { 
        cache: true, 
        ttl: 30 * 60 * 1000, // Cache menus for 30 minutes
        dependencies: ['menus'] 
      }
    );
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isCacheValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / (validEntries + expiredEntries) || 0
    };
  }
}

// Global optimizer instance
export const graphqlOptimizer = new GraphQLOptimizer();

// Convenience functions
export const optimizedQueries = {
  loadPage: (slug: string) => graphqlOptimizer.loadPageOptimized(slug),
  preloadVideos: (sectionIds: string[]) => graphqlOptimizer.preloadVideoSections(sectionIds),
  loadMenus: () => graphqlOptimizer.loadMenus(),
  invalidateCache: (dependency: string) => graphqlOptimizer.invalidateByDependency(dependency),
  clearCache: () => graphqlOptimizer.clearCache(),
  getStats: () => graphqlOptimizer.getCacheStats()
}; 