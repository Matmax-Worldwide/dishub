import { Edit, Trash2, MessageSquare, FileCheck } from 'lucide-react';
import { FormBase } from '@/types/forms';

interface FormCardProps {
  form: FormBase;
  onEdit: () => void;
  onDelete: () => void;
}

export function FormCard({ form, onEdit, onDelete }: FormCardProps) {
  const { title, description, isActive, updatedAt, fields = [] } = form;

  // Format the date
  const formattedDate = updatedAt 
    ? new Date(updatedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'No date';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-md font-medium text-gray-900 truncate flex-1">{title}</h3>
          <div className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center text-xs text-gray-500 space-x-3 mb-3">
          <div className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            <span>{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <FileCheck className="h-3 w-3 mr-1" />
            <span>Updated {formattedDate}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 bg-gray-50 p-2 flex justify-end">
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 p-1.5"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 p-1.5"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 