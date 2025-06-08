import * as React from "react";
import { Textarea } from "@/app/components/ui/textarea";

interface ConditionBuilderProps {
  value: string;
  onChange: (value: string) => void;
}

export function ConditionBuilder({ value, onChange }: ConditionBuilderProps) {
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    try {
      // Validate that the input is proper JSON
      if (newValue.trim() !== '') {
        JSON.parse(newValue);
      }
      setError(null);
      onChange(newValue);
    } catch {
      setError('Invalid JSON format');
      onChange(newValue); // Still update the value so the user can see their typing
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        rows={6}
        className={error ? "border-red-500" : ""}
        placeholder='{"field": "value", "comparison": "equals", "value": "someValue"}'
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Enter conditions in JSON format. Example:
        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {`{
  "subject": {
    "id": "123"
  },
  "action": "create"
}`}
        </pre>
      </p>
    </div>
  );
} 