import Link from 'next/link';
import { Plus } from 'lucide-react';

export function FormPageHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold tracking-tight">Form Builder</h1>
      <Link
        href="/cms/forms/new"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create New Form
      </Link>
    </div>
  );
} 