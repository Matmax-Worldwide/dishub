import { PlusCircle } from 'lucide-react';

interface BlogPageHeaderProps {
  title: string;
  onCreateClick: () => void;
  createButtonLabel: string;
}

export function BlogPageHeader({ title, onCreateClick, createButtonLabel }: BlogPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your blogs and their published posts
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusCircle className="h-4 w-4 mr-2" /> {createButtonLabel}
      </button>
    </div>
  );
} 