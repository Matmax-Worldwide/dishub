import React from 'react';
import { Incorporation } from '../../types';

interface PriorityBadgeProps {
  priority: Incorporation['priority'];
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityConfig = {
    'critical': { color: 'bg-red-500', label: 'Critical' },
    'high': { color: 'bg-orange-500', label: 'High' },
    'medium': { color: 'bg-yellow-500', label: 'Medium' },
    'low': { color: 'bg-green-500', label: 'Low' }
  };

  const config = priorityConfig[priority] || priorityConfig['medium'];

  return (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs font-medium text-gray-600">{config.label}</span>
    </div>
  );
} 