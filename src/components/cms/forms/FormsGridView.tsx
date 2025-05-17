import { FormBase } from '@/types/forms';
import { FormCard } from './FormCard';

interface FormsGridViewProps {
  forms: FormBase[];
  onDuplicate: (form: FormBase) => void;
  onDelete: (id: string, title: string) => void;
}

export function FormsGridView({ forms, onDuplicate, onDelete }: FormsGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {forms.map((form) => (
        <FormCard
          key={form.id}
          form={form}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 