import React from 'react';
import { 
  Clock, 
  FileText, 
  CheckCircle2, 
  Clock3, 
  AlertTriangle, 
  Target 
} from 'lucide-react';
import { Incorporation } from '@/types';

interface StatusBadgeProps {
  status: Incorporation['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    'in-progress': { color: 'bg-blue-100 text-blue-700', label: 'In Progress', icon: Clock },
    'pending-documents': { color: 'bg-yellow-100 text-yellow-700', label: 'Pending Docs', icon: FileText },
    'completed': { color: 'bg-green-100 text-green-700', label: 'Completed', icon: CheckCircle2 },
    'on-hold': { color: 'bg-gray-100 text-gray-700', label: 'On Hold', icon: Clock3 },
    'at-risk': { color: 'bg-red-100 text-red-700', label: 'At Risk', icon: AlertTriangle },
    'on-track': { color: 'bg-emerald-100 text-emerald-700', label: 'On Track', icon: Target }
  };

  const config = statusConfig[status] || statusConfig['in-progress'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
} 