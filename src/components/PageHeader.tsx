'use client';

import React from 'react';
import { Menu, Bell, Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  onMenuClick: () => void;
  showNewButton?: boolean;
  newButtonText?: string;
  onNewClick?: () => void;
  children?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  onMenuClick, 
  showNewButton = false,
  newButtonText = "New Item",
  onNewClick,
  children 
}: PageHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {showNewButton && (
            <button 
              onClick={onNewClick}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>{newButtonText}</span>
            </button>
          )}
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
      {children}
    </header>
  );
} 