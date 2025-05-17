import { useRouter } from 'next/navigation';
import { FormBase } from '@/types/forms';
import { FileEdit, Database, Eye, Copy, Trash2 } from 'lucide-react';

interface FormCardProps {
  form: FormBase;
  onDuplicate: (form: FormBase) => void;
  onDelete: (id: string, title: string) => void;
}

export function FormCard({ form, onDuplicate, onDelete }: FormCardProps) {
  const router = useRouter();

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 flex-1 truncate">{form.title}</h3>
        <div className="ml-2 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {form.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{form.description || 'No description'}</p>
      
      <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
        <div className="text-xs text-gray-500">
          {form.isMultiStep ? 'Multi-step form' : 'Single-step form'}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => router.push(`/cms/forms/edit/${form.id}`)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit form"
          >
            <FileEdit className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/cms/forms/submissions/${form.id}`)}
            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
            title="View submissions"
          >
            <Database className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/cms/forms/preview/${form.id}`)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
            title="Preview form"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDuplicate(form)}
            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
            title="Duplicate form"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(form.id, form.title)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete form"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 