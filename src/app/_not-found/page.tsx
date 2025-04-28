'use client';

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Page Not Found</h2>
      <p className="mb-6">The page you are looking for does not exist or has been moved.</p>
      <Link href="/en" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
        Return to Home
      </Link>
    </div>
  );
} 