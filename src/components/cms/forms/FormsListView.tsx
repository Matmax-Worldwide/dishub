import { Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { FormBase } from '@/types/forms';

export interface FormsListViewProps {
  forms: FormBase[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSort: (field: 'title' | 'updatedAt' | 'createdAt') => void;
  sortField: 'title' | 'updatedAt' | 'createdAt';
  sortDirection: 'asc' | 'desc';
}

export function FormsListView({ 
  forms, 
  onEdit, 
  onDelete, 
  onSort, 
  sortField, 
  sortDirection 
}: FormsListViewProps) {
  const getSortIcon = (field: 'title' | 'updatedAt' | 'createdAt') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('title')}
            >
              <div className="flex items-center">
                <span>Title</span>
                <span className="ml-1">{getSortIcon('title')}</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center">
                <span>Created</span>
                <span className="ml-1">{getSortIcon('createdAt')}</span>
              </div>
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('updatedAt')}
            >
              <div className="flex items-center">
                <span>Updated</span>
                <span className="ml-1">{getSortIcon('updatedAt')}</span>
              </div>
            </th>
            <th scope="col" className="relative px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {forms.map(form => (
            <tr key={form.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{form.title}</div>
                {form.description && (
                  <div className="text-xs text-gray-500 truncate max-w-xs">{form.description}</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                  form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {form.isMultiStep ? 'Multi-step' : 'Single-step'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end">
                  <button
                    onClick={() => onEdit(form.id)}
                    className="text-blue-600 hover:text-blue-800 p-1.5"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(form.id)}
                    className="text-red-600 hover:text-red-800 p-1.5"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 