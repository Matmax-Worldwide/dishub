import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  value?: string | number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertCardProps {
  title: string;
  alerts: AlertItem[];
  onDismiss?: (alertId: string) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const alertConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    iconColor: 'text-blue-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    iconColor: 'text-orange-500'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    iconColor: 'text-red-500'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    iconColor: 'text-green-500'
  }
};

export default function AlertCard({
  title,
  alerts,
  onDismiss,
  showViewAll = true,
  onViewAll
}: AlertCardProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-500">No alerts at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 ${config.bgColor} rounded-lg`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-gray-500">{alert.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {alert.value && (
                  <span className={`text-sm font-bold ${config.textColor}`}>
                    {alert.value}
                  </span>
                )}
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`text-xs font-medium ${config.textColor} hover:underline`}
                  >
                    {alert.action.label}
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-3"
          >
            View all alerts
          </button>
        )}
      </div>
    </div>
  );
} 