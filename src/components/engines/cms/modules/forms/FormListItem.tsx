import { useRouter, useParams } from 'next/navigation';
import { FormBase } from '@/types/forms';
import { FileEdit, Database, Eye, Copy, Trash2 } from 'lucide-react';

interface FormListItemProps {
  form: FormBase;
  onDuplicate: (form: FormBase) => void;
  onDelete: (id: string, title: string) => void;
}

export function FormListItem({ form, onDuplicate, onDelete }: FormListItemProps) {
  const router = useRouter();
  const { locale, tenantSlug } = useParams();
  return (
    <div className="flex items-center py-4 px-6 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900">{form.title}</h3>
        <p className="text-sm text-gray-500 truncate">{form.description || 'No description'}</p>
      </div>
      <div className="flex flex-col items-end mr-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {form.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          {form.isMultiStep ? 'Multi-step' : 'Single-step'}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/${locale}/${tenantSlug}/cms/forms/edit/${form.id}`)}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Edit form"
        >
          <FileEdit className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push(`/${locale}/${tenantSlug}/cms/forms/submissions/${form.id}`)}
          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
          title="View submissions"
        >
          <Database className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push(`/${locale}/${tenantSlug}/cms/forms/preview/${form.id}`)}
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
  );
} 