import React from 'react';
import { Loader2Icon } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Cargando...', 
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2Icon className={`${sizeClasses[size]} animate-spin text-blue-500 mx-auto mb-2`} />
        {text && <p className="text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner; 