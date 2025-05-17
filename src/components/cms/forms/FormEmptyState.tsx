import Link from 'next/link';
import { Plus, Database } from 'lucide-react';

interface FormEmptyStateProps {
  searchQuery: string;
}

export function FormEmptyState({ searchQuery }: FormEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Database className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No forms found</h3>
      {searchQuery ? (
        <p className="text-gray-500 mb-4">No forms match your search criteria. Try a different search term.</p>
      ) : (
        <p className="text-gray-500 mb-4">You haven&apos;t created any forms yet. Get started by creating your first form.</p>
      )}
      {!searchQuery && (
        <Link
          href="/cms/forms/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create New Form
        </Link>
      )}
    </div>
  );
} 