import { FormBase } from '@/types/forms';
import { FormListItem } from './FormListItem';

interface FormsListViewProps {
  forms: FormBase[];
  onDuplicate: (form: FormBase) => void;
  onDelete: (id: string, title: string) => void;
}

export function FormsListView({ forms, onDuplicate, onDelete }: FormsListViewProps) {
  return (
    <div className="divide-y divide-gray-200">
      {forms.map((form) => (
        <FormListItem
          key={form.id}
          form={form}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 