'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface CMSSidebarProps {
  dictionary?: {
    cms?: {
      dashboard: string;
      pages: string;
      media: string;
      menus: string;
      forms: string;
      settings: string;
    };
  };
  locale: string;
}

export default function CMSSidebar({ dictionary, locale }: CMSSidebarProps) {
  const pathname = usePathname();
  
  // Default navigation items if dictionary is not provided
  const nav = dictionary?.cms || {
    dashboard: 'Dashboard',
    pages: 'Pages',
    menus: 'Menus',
    media: 'Media',
    forms: 'Forms',
    settings: 'Settings'
  };

  const navigationItems = [
    { name: nav.dashboard, href: `/${locale}/cms/` },
    { name: nav.pages, href: `/${locale}/cms/pages` },
    { name: nav.menus, href: `/${locale}/cms/menus` },
    { name: nav.media, href: `/${locale}/cms/media` },
    { name: nav.forms, href: `/${locale}/cms/forms` },
    { name: nav.settings, href: `/${locale}/cms/settings` },
  ];

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/cms/`) {
      return pathname === `/${locale}/cms` || pathname === `/${locale}/cms/`;
    }
    
    // For other links, check if pathname starts with the link path
    // and make sure it's either exact or followed by a / or nothing
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href={`/${locale}/cms`} className="flex items-center">
            <div className="relative h-8 w-24">
              <Image 
                src="/images/logo.png" 
                alt="E-Voque CMS" 
                fill
                sizes="96px"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-800">Content Management System</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = isActiveLink(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-[#01319c] text-white font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 