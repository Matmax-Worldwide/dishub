import React from 'react';
import { CheckIcon, AlertCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  className = '' 
}) => {
  let bgColor = '';
  let Icon: LucideIcon | null = null;
  
  if (type === 'success') {
    bgColor = 'bg-green-50 text-green-700';
    Icon = CheckIcon;
  } else if (type === 'error') {
    bgColor = 'bg-red-50 text-red-700';
    Icon = AlertCircleIcon;
  } else if (type === 'warning') {
    bgColor = 'bg-amber-50 text-amber-700';
    Icon = AlertTriangleIcon;
  }

  return (
    <div className={`p-3 rounded-md ${bgColor} flex items-center ${className}`}>
      {Icon && <Icon className="h-5 w-5 mr-2" />}
      {message}
    </div>
  );
};

export default Notification; 