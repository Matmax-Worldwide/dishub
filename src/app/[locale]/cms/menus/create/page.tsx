'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gqlRequest } from '@/lib/graphql-client';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';

export default function CreateMenuPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const mutation = `
        mutation CreateMenu($input: MenuInput!) {
          createMenu(input: $input) {
            id
            name
            location
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        input: {
          name,
          location: location || null
        }
      };

      const response = await gqlRequest<{ createMenu: { id: string } }>(mutation, variables);

      if (response && response.createMenu) {
        // Successfully created menu, redirect to edit page
        router.push(`/cms/menus/edit/${response.createMenu.id}`);
      } else {
        setError('Failed to create menu. Please try again.');
      }
    } catch (err) {
      console.error('Error creating menu:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/cms/menus" className="mr-4 p-2 hover:bg-gray-100 rounded-md">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create New Menu</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Menu Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Main Navigation"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Header, Footer, Sidebar"
            />
            <p className="mt-1 text-sm text-gray-500">
              Specify where this menu will be displayed on your site (optional)
            </p>
          </div>
        </div>

        <div className="mt-6 flex">
          <button
            type="submit"
            disabled={isSubmitting || !name}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md flex items-center ${
              isSubmitting || !name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Menu'
            )}
          </button>
          <Link
            href="/cms/menus"
            className="ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
} 