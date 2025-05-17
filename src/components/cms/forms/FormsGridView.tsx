import { FormBase } from '@/types/forms';
import { FormCard } from './FormCard';

export interface FormsGridViewProps {
  forms: FormBase[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FormsGridView({ forms, onEdit, onDelete }: FormsGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {forms.map(form => (
        <FormCard
          key={form.id}
          form={form}
          onEdit={() => onEdit(form.id)}
          onDelete={() => onDelete(form.id)}
        />
      ))}
    </div>
  );
} 