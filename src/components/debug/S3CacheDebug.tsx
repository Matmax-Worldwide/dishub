'use client';

import { useState, useEffect } from 'react';
import { s3FileCache } from '@/hooks/useS3FileCache';

interface S3CacheDebugProps {
  show?: boolean;
}

export function S3CacheDebug({ show = false }: S3CacheDebugProps) {
  const [stats, setStats] = useState({
    cacheSize: 0,
    pendingRequests: 0,
    oldestEntry: null as number | null,
    newestEntry: null as number | null
  });

  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setStats(s3FileCache.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleClearCache = () => {
    s3FileCache.clear();
    setStats(s3FileCache.getStats());
    console.log('🧹 S3 File Cache cleared manually');
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 z-50"
      >
        S3 Cache
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">S3 File Cache Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Cache Size:</span>
          <span className="font-mono">{stats.cacheSize} entries</span>
        </div>
        
        <div className="flex justify-between">
          <span>Pending:</span>
          <span className="font-mono">{stats.pendingRequests}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Oldest:</span>
          <span className="font-mono">{formatTimestamp(stats.oldestEntry)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Newest:</span>
          <span className="font-mono">{formatTimestamp(stats.newestEntry)}</span>
        </div>
      </div>
      
      <button
        onClick={handleClearCache}
        className="w-full mt-3 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
      >
        Clear Cache
      </button>
    </div>
  );
} 