'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-blue-600 text-blue-100 hover:bg-blue-700',
      secondary: 'bg-gray-600 text-gray-100 hover:bg-gray-700',
      destructive: 'bg-red-600 text-red-100 hover:bg-red-700',
      outline: 'border border-gray-600 text-gray-300 bg-transparent hover:bg-gray-800',
      success: 'bg-green-600 text-green-100 hover:bg-green-700',
      warning: 'bg-amber-600 text-amber-100 hover:bg-amber-700'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge }; 