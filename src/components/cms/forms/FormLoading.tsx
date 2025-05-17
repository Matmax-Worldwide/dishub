import { Loader2 } from 'lucide-react';

export function FormLoading() {
  return (
    <div className="flex justify-center items-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-gray-600">Loading forms...</span>
    </div>
  );
} 