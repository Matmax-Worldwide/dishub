import React from 'react';
import { CheckIcon, AlertCircleIcon } from 'lucide-react';

export interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  className = '' 
}) => {
  const bgColor = type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';

  return (
    <div className={`p-3 rounded-md ${bgColor} flex items-center ${className}`}>
      {type === 'success' ? (
        <CheckIcon className="h-5 w-5 mr-2" />
      ) : (
        <AlertCircleIcon className="h-5 w-5 mr-2" />
      )}
      {message}
    </div>
  );
};

export default Notification; 