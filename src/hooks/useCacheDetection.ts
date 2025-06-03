'use client';

import { useState, useEffect, useCallback } from 'react';

interface CacheDetectionResult {
  hasCacheIssues: boolean;
  lastIssueDetected: number | null;
  clearCache: () => void;
  dismissIssue: () => void;
  forceRefresh: () => void;
}

export const useCacheDetection = (): CacheDetectionResult => {
  const [hasCacheIssues, setHasCacheIssues] = useState(false);
  const [lastIssueDetected, setLastIssueDetected] = useState<number | null>(null);

  // Check for cache issues on mount and periodically
  useEffect(() => {
    const checkCacheIssues = () => {
      const cacheIssue = localStorage.getItem('media-cache-issue-detected');
      const dismissed = localStorage.getItem('cache-issue-dismissed');
      
      if (cacheIssue) {
        const issueTime = parseInt(cacheIssue);
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        
        // Show issue if it's newer than the last dismissal
        if (issueTime > dismissedTime) {
          setHasCacheIssues(true);
          setLastIssueDetected(issueTime);
        }
      }
    };

    checkCacheIssues();

    // Check periodically for new issues
    const interval = setInterval(checkCacheIssues, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const clearCache = useCallback(() => {
    // Clear browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Clear relevant localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('s3-cache-') || 
          key.startsWith('media-cache-') ||
          key.startsWith('lastCacheCheck') ||
          key.startsWith('media-cache-issue-detected')) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('s3-cache-') || key.startsWith('media-cache-')) {
        sessionStorage.removeItem(key);
      }
    });

    setHasCacheIssues(false);
    setLastIssueDetected(null);
  }, []);

  const dismissIssue = useCallback(() => {
    localStorage.setItem('cache-issue-dismissed', Date.now().toString());
    setHasCacheIssues(false);
  }, []);

  const forceRefresh = useCallback(() => {
    clearCache();
    window.location.reload();
  }, [clearCache]);

  return {
    hasCacheIssues,
    lastIssueDetected,
    clearCache,
    dismissIssue,
    forceRefresh
  };
}; 