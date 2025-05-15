'use client';

import React from 'react';
import { CheckIcon, AlertCircleIcon } from 'lucide-react';

interface NotificationAlertProps {
  type: 'success' | 'error';
  message: string;
}

export function NotificationAlert({ type, message }: NotificationAlertProps) {
  return (
    <div 
      className={`p-3 rounded-md ${
        type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      } flex items-center`}
    >
      {type === 'success' ? (
        <CheckIcon className="h-5 w-5 mr-2" />
      ) : (
        <AlertCircleIcon className="h-5 w-5 mr-2" />
      )}
      {message}
    </div>
  );
} 