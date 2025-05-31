import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
  layout?: 'vertical' | 'horizontal' | 'grid';
}

export default function QuickActions({
  title = 'Quick Actions',
  actions,
  layout = 'vertical'
}: QuickActionsProps) {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex space-x-3 overflow-x-auto';
      case 'grid':
        return 'grid grid-cols-2 gap-3';
      default:
        return 'space-y-3';
    }
  };

  const getButtonClasses = (action: QuickAction) => {
    const baseClasses = 'flex items-center justify-center px-4 py-3 rounded-lg transition-colors font-medium';
    const disabledClasses = action.disabled 
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
      : `${action.color} hover:opacity-90`;
    
    if (layout === 'horizontal') {
      return `${baseClasses} ${disabledClasses} whitespace-nowrap min-w-max`;
    }
    
    return `${baseClasses} ${disabledClasses} w-full`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">
        <div className={getLayoutClasses()}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={getButtonClasses(action)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 