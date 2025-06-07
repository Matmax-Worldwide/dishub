'use client';

import { MediaLibrary } from '@/app/components/engines/cms/modules/media/MediaLibrary';
import { CacheWarning } from '@/app/components/shared/CacheWarning';
import { CacheHelpButton } from '@/app/components/shared/CacheHelpButton';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function MediaLibraryPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl min-h-screen flex flex-col">
      <CacheWarning />
      <CacheHelpButton />
      
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                href="/cms" 
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Media Library</span>
              </div>
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <p className="mt-2 text-gray-600">
          Manage your images, videos, and documents in one central location.
        </p>
      </div>
      
      <div className="flex-1">
        <MediaLibrary />
      </div>
    </div>
  );
} 