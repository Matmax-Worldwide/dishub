'use client';

import React, { useState, useEffect } from 'react';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Component type definition
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Footer' | 'Form' | 'Article' | 'Blog' | 'CtaButton';

interface ComponentsGridProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onComponentSelect?: (componentType: ComponentType) => void;
}

interface ComponentDefinition {
  type: ComponentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  preview: React.ReactNode;
  disabled?: boolean;
}

export default function ComponentsGrid({
  searchQuery,
  onSearchChange,
  onComponentSelect
}: ComponentsGridProps) {
  const [filteredComponents, setFilteredComponents] = useState<ComponentDefinition[]>([]);

  // Available components with their metadata
  const availableComponents: ComponentDefinition[] = [
    {
      type: 'Header',
      title: 'Header',
      description: 'Navigation headers',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 19H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-slate-500 bg-slate-100 border-slate-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-md">
          <div className="flex justify-between items-center">
            <div className="w-6 h-2 bg-slate-300 rounded"></div>
            <div className="flex space-x-1">
              <div className="w-3 h-1.5 bg-slate-300 rounded"></div>
              <div className="w-3 h-1.5 bg-slate-300 rounded"></div>
              <div className="w-4 h-1.5 bg-slate-400 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Hero',
      title: 'Hero',
      description: 'Large banner sections',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-indigo-500 bg-indigo-100 border-indigo-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-md">
          <div className="bg-indigo-200 w-full h-8 rounded-md mb-1 flex items-center justify-center">
            <div className="w-1/2 h-4 flex flex-col justify-center items-center">
              <div className="h-1 bg-indigo-300 rounded w-full mb-1"></div>
              <div className="h-1 bg-indigo-300 rounded w-3/4"></div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="h-2 w-8 bg-indigo-300 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Benefit',
      title: 'Benefit',
      description: 'Showcase benefits',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-teal-500 bg-teal-100 border-teal-200',
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-teal-50 to-teal-100 rounded-md">
          <div className="flex items-center justify-center mb-1">
            <div className="w-4 h-4 rounded-full bg-teal-200 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" className="text-teal-500">
                <path d="M9 11L12 14L22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="h-1 bg-teal-200 rounded w-3/4 mx-auto mb-1"></div>
          <div className="h-1 bg-teal-200 rounded w-5/6 mx-auto"></div>
        </div>
      )
    },
    {
      type: 'Text',
      title: 'Text',
      description: 'Paragraphs and content',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7V5H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-blue-500 bg-blue-100 border-blue-200',
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md">
          <div className="space-y-1">
            <div className="h-1 bg-blue-200 rounded w-3/4"></div>
            <div className="h-1 bg-blue-200 rounded"></div>
            <div className="h-1 bg-blue-200 rounded w-5/6"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Image',
      title: 'Image',
      description: 'Visual content',
      disabled: true,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-emerald-500 bg-emerald-100 border-emerald-200',
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-md opacity-50">
          <div className="bg-emerald-200 w-full h-8 rounded-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15L16 10L9 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )
    },
    {
      type: 'Feature',
      title: 'Feature',
      description: 'Key features',
      disabled: true,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 12L10 8V16L16 12Z" fill="currentColor"/>
        </svg>
      ),
      color: 'text-amber-500 bg-amber-100 border-amber-200',
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-amber-50 to-amber-100 rounded-md opacity-50">
          <div className="flex mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-300 mr-1 flex-shrink-0"></div>
            <div>
              <div className="h-1 bg-amber-200 rounded w-10 mb-0.5"></div>
              <div className="h-0.5 bg-amber-200 rounded w-12"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Testimonial',
      title: 'Testimonial',
      description: 'Customer reviews',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 16.6569 19.6569 18 18 18H8L4 22V8C4 6.34315 5.34315 5 7 5H18C19.6569 5 21 6.34315 21 8V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-fuchsia-500 bg-fuchsia-100 border-fuchsia-200',
      disabled: true,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-md opacity-50">
          <div className="text-fuchsia-700 mb-0.5 text-xs">&ldquo;</div>
          <div className="h-1 bg-fuchsia-200 rounded w-full mb-1"></div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-fuchsia-200"></div>
            <div className="h-1 bg-fuchsia-200 rounded w-8"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Card',
      title: 'Card',
      description: 'Information cards',
      disabled: true,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 12H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-rose-500 bg-rose-100 border-rose-200',
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-rose-50 to-rose-100 rounded-md opacity-50">
          <div className="bg-rose-200 w-full h-4 rounded-t-md"></div>
          <div className="p-1 border border-t-0 border-rose-200 rounded-b-md bg-white">
            <div className="h-1 bg-rose-200 rounded w-3/4 mb-1"></div>
            <div className="h-0.5 bg-rose-200 rounded w-full"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Footer',
      title: 'Footer',
      description: 'Page footer',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 15H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-gray-500 bg-gray-100 border-gray-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md">
          <div className="mt-auto">
            <div className="h-px w-full bg-gray-200 mb-1"></div>
            <div className="flex justify-between items-center">
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="flex space-x-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Form',
      title: 'Form',
      description: 'User interaction forms',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-purple-500 bg-purple-100 border-purple-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-md">
          <div className="h-1 bg-purple-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-white border border-purple-200 rounded mb-1"></div>
          <div className="h-3 bg-white border border-purple-200 rounded mb-2"></div>
          <div className="w-1/3 h-4 bg-purple-500 rounded-md self-start"></div>
        </div>
      )
    },
    {
      type: 'Article',
      title: 'Article',
      description: 'Rich articles',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-cyan-600 bg-cyan-100 border-cyan-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-md">
          <div className="bg-cyan-200 w-full h-6 rounded-md mb-1"></div>
          <div className="h-1.5 bg-cyan-300 rounded w-3/4 mb-1"></div>
          <div className="h-1 bg-cyan-200 rounded w-1/2 mb-1"></div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-300"></div>
            <div className="h-0.5 bg-cyan-200 rounded w-8"></div>
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-cyan-200 rounded"></div>
            <div className="h-0.5 bg-cyan-200 rounded w-5/6"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Blog',
      title: 'Blog',
      description: 'Blog post grid',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100 border-purple-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-md">
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-purple-200 h-4 rounded"></div>
            <div className="bg-purple-200 h-4 rounded"></div>
            <div className="bg-purple-200 h-4 rounded"></div>
            <div className="bg-purple-200 h-4 rounded"></div>
          </div>
          <div className="mt-1 flex justify-center gap-0.5">
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      type: 'CtaButton',
      title: 'CTA Button',
      description: 'Call-to-action buttons',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="8" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 10l2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-green-500 bg-green-100 border-green-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-md">
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-green-500 text-white px-2 py-1 rounded-lg">
              <div className="w-6 h-1 bg-white/80 rounded mr-1"></div>
              <div className="w-1.5 h-1.5 border-l border-b border-white/80 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )
    },
  ];

  // Filter components based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredComponents(availableComponents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableComponents.filter(component =>
      component.title.toLowerCase().includes(query) ||
      component.description.toLowerCase().includes(query) ||
      component.type.toLowerCase().includes(query)
    );
    setFilteredComponents(filtered);
  }, [searchQuery]);

  const handleComponentClick = (component: ComponentDefinition) => {
    if (component.disabled || !onComponentSelect) return;
    onComponentSelect(component.type);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 py-1 h-9 text-sm"
        />
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredComponents.map((component) => (
          <Button
            key={component.type}
            variant="ghost"
            className={`h-auto p-2 flex flex-col items-center space-y-2 border-2 transition-all hover:scale-105 ${
              component.disabled 
                ? 'opacity-50 cursor-not-allowed border-gray-200' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => handleComponentClick(component)}
            disabled={component.disabled}
            title={component.disabled ? 'Coming soon' : `Add ${component.title}`}
          >
            {/* Preview */}
            <div className="w-full h-12 mb-1">
              {component.preview}
            </div>
            
            {/* Icon and Title */}
            <div className={`p-1.5 rounded-md ${
              component.disabled ? 'text-gray-400 bg-gray-100' : component.color
            }`}>
              {component.icon}
            </div>
            
            <div className="text-center">
              <div className={`text-xs font-medium ${component.disabled ? 'text-gray-400' : ''}`}>
                {component.title}
              </div>
              <div className={`text-xs ${component.disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                {component.description}
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* No results message */}
      {filteredComponents.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No components found for &ldquo;{searchQuery}&rdquo;</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="mt-2 text-xs"
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t">
        Click a component to add it to your page
      </div>
    </div>
  );
} 