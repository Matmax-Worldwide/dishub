'use client';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch = ({ 
  checked, 
  onCheckedChange, 
  disabled = false,
  id,
  size = 'md'
}: SwitchProps) => {
  const sizeClasses = {
    sm: 'h-4 w-8',
    md: 'h-6 w-11',
    lg: 'h-8 w-14'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-6 w-6'
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-6' : 'translate-x-1',
    lg: checked ? 'translate-x-8' : 'translate-x-1'
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
        transform hover:scale-105
        ${sizeClasses[size]}
        ${checked 
          ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/25' 
          : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out
          ${thumbSizeClasses[size]}
          ${translateClasses[size]}
          ${checked ? 'shadow-blue-500/20' : ''}
          ${!disabled && 'hover:shadow-xl'}
        `}
      >
        {/* Inner dot for visual enhancement */}
        <span 
          className={`
            absolute inset-0.5 rounded-full transition-all duration-300
            ${checked 
              ? 'bg-gradient-to-br from-blue-100 to-blue-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100'
            }
          `}
        />
      </span>
      
      {/* Glow effect when active */}
      {checked && !disabled && (
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-sm animate-pulse" />
      )}
    </button>
  );
}; 