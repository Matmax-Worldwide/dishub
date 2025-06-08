'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { Menu, MenuItem } from '@/app/api/graphql/types';

interface SidebarProps {
  menu: Menu;
  logoUrl?: string;
  title?: string;
  className?: string;
  collapsible?: boolean;
  locale?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  menu,
  logoUrl,
  title = menu.name,
  className = '',
  collapsible = true,
  locale: propLocale
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const params = useParams();
  const pathname = usePathname();
  const locale = propLocale || params.locale as string || 'en';

  // Toggle a specific item's expanded state
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Check if a link is active
  const isActive = (url: string) => {
    const normalizedPathname = pathname.endsWith('/') ? pathname : pathname + '/';
    const normalizedUrl = url.endsWith('/') ? url : url + '/';
    return normalizedPathname.startsWith(normalizedUrl);
  };

  // Render menu items recursively
  const renderMenuItems = (items: MenuItem[], level = 0) => {
    return items.map(item => {
      // Determine the URL
      let url = '#';
      if (item.url) {
        url = item.url;
      } else if (item.page?.slug) {
        url = `/${locale}/${item.page.slug}`;
      }

      const hasChildren = item.children && item.children.length > 0;
      const isItemActive = isActive(url);
      const isExpanded = expandedItems[item.id] || false;

      // If any child is active, expand this item by default
      if (hasChildren && !expandedItems.hasOwnProperty(item.id)) {
        const anyChildActive = item.children?.some(child => {
          const childUrl = child.url || (child.page ? `/${locale}/${child.page.slug}` : '#');
          return childUrl !== '#' && isActive(childUrl);
        });
        
        if (anyChildActive) {
          setExpandedItems(prev => ({ ...prev, [item.id]: true }));
        }
      }

      return (
        <li key={item.id} className={`my-1 ${level > 0 ? 'ml-3' : ''}`}>
          {hasChildren ? (
            <div>
              <button 
                onClick={() => toggleExpand(item.id)}
                className={`flex items-center justify-between w-full p-2 rounded-md transition-colors
                  ${isItemActive || isExpanded ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
                style={{ 
                  color: isItemActive ? ( 'inherit') : 'inherit',
                  paddingLeft: `${level * 4 + 8}px` 
                }}
              >
                <div className="flex items-center">
                  {item.icon && (
                    <span className="mr-2 text-lg">{item.icon}</span>
                  )}
                  <span className={`${collapsed ? 'sr-only' : ''}`}>
                    {item.title}
                  </span>
                </div>
                {!collapsed && (isExpanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />)}
              </button>
              
              {isExpanded && !collapsed && (
                <ul className="mt-1">
                  {renderMenuItems(item.children || [], level + 1)}
                </ul>
              )}
            </div>
          ) : (
            <Link
              href={url}
              target={item.target || '_self'}
              className={`flex items-center p-2 rounded-md transition-colors ${
                isItemActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'
              }`}
              style={{ 
                color: isItemActive ? ('inherit') : 'inherit',
                paddingLeft: `${level * 4 + 8}px` 
              }}
            >
              {item.icon && (
                <span className="mr-2 text-lg">{item.icon}</span>
              )}
              <span className={`${collapsed ? 'sr-only' : ''}`}>
                {item.title}
              </span>
            </Link>
          )}
        </li>
      );
    });
  };

  return (
    <aside 
      className={`h-screen ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r border-gray-200 ${className}`}
      style={{ 
        backgroundColor: '#ffffff',
        color: 'inherit'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header with logo and title */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center">
            {logoUrl && (
              <div className={`relative h-8 w-8 flex-shrink-0 ${!collapsed && 'mr-2'}`}>
                <Image 
                  src={logoUrl}
                  alt={title}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            )}
            {!collapsed && (
              <span className="font-semibold truncate">{title}</span>
            )}
          </Link>
          
          {/* Collapse button */}
          {collapsible && (
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronDownIcon size={16} className="rotate-270" />
              ) : (
                <ChevronUpIcon size={16} className="rotate-90" />
              )}
            </button>
          )}
        </div>
        
        {/* Navigation menu */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {renderMenuItems(menu.items)}
          </ul>
        </nav>
        
        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {new Date().getFullYear()} © {title}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 