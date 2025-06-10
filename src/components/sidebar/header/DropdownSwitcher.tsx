'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export interface DropdownSwitcherProps {
  /** The main button content */
  buttonContent: {
    icon: React.ReactNode;
    label: string;
  };
  /** Array of dropdown menu items */
  items: DropdownItem[];
  /** Additional CSS classes for the button */
  className?: string;
  /** Whether the dropdown is initially open */
  defaultOpen?: boolean;
}

export default function DropdownSwitcher({
  buttonContent,
  items,
  className = "",
  defaultOpen = false
}: DropdownSwitcherProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(defaultOpen);

  const handleItemClick = (item: DropdownItem) => {
    setIsDropdownOpen(false);
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-between w-full text-left px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="flex items-center">
          {buttonContent.icon}
          <span className="sidebar-text truncate ml-2">
            {buttonContent.label}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      
      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleItemClick(item)}
              >
                <span className="h-4 w-4 mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 