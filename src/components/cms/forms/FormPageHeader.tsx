import { PlusCircle } from 'lucide-react';

interface FormPageHeaderProps {
  title: string;
  onCreateClick: () => void;
  createButtonLabel: string;
}

export function FormPageHeader({ title, onCreateClick, createButtonLabel }: FormPageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <button
        onClick={onCreateClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
      >
        <PlusCircle className="h-4 w-4 mr-1" />
        {createButtonLabel}
      </button>
    </div>
  );
} 