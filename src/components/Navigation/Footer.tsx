'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

// Define the MenuItem interface
interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
  order: number;
  children?: MenuItem[];
  page?: { id: string; title: string; slug: string };
}

// Define the Menu interface
interface Menu {
  id: string;
  name: string;
  location: string | null;
  locationType: string | null;
  isFixed: boolean | null;
  backgroundColor: string | null;
  textColor: string | null;
  items: MenuItem[];
}

interface FooterProps {
  menu: Menu;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  copyright?: string;
  className?: string;
  locale?: string;
}

const Footer: React.FC<FooterProps> = ({
  menu,
  logoUrl,
  title = menu.name,
  subtitle,
  copyright,
  className = '',
  locale: propLocale
}) => {
  const params = useParams();
  const locale = propLocale || params.locale as string || 'en';
  const currentYear = new Date().getFullYear();

  // Group menu items for responsive display
  const groupMenuItems = () => {
    // For items with children, use them directly
    const groupedItems = menu.items
      .filter(item => item.children && item.children.length > 0)
      .slice(0, 4); // Limit to 4 main groups

    // If we have less than 4 groups, add some top-level items
    if (groupedItems.length < 4) {
      const topLevelItems = menu.items
        .filter(item => !item.children || item.children.length === 0)
        .slice(0, 4 - groupedItems.length);
      
      // Convert top-level items to "groups" with one item
      const singleItemGroups = topLevelItems.map(item => ({
        ...item,
        children: [item]
      }));
      
      return [...groupedItems, ...singleItemGroups];
    }

    return groupedItems;
  };

  const groupedItems = groupMenuItems();

  // Process an array of items into a single column
  const renderItemGroup = (item: MenuItem) => {
    const children = item.children || [];
    
    return (
      <div key={item.id} className="mb-8 md:mb-0">
        <h3 className="text-base font-bold mb-4" style={{ color: menu.textColor || 'inherit' }}>
          {item.title}
        </h3>
        <ul className="space-y-3">
          {children.map(child => {
            // Determine URL for the child
            const childUrl = child.url || (child.page ? `/${locale}/${child.page.slug}` : '#');
            
            return (
              <li key={child.id}>
                <Link 
                  href={childUrl}
                  target={child.target || '_self'}
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: menu.textColor ? `${menu.textColor}99` : 'inherit' }}
                >
                  {child.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <footer 
      className={`py-12 ${className}`}
      style={{ 
        backgroundColor: menu.backgroundColor || '#f8fafc',
        color: menu.textColor || '#1e293b'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer top section with logo and navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Company Info */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-start">
              {logoUrl && (
                <div className="relative h-12 w-12 mr-3 flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={title}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              )}
            </Link>
            <h2 className="mt-4 text-lg font-bold" style={{ color: menu.textColor || 'inherit' }}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm" style={{ color: menu.textColor ? `${menu.textColor}99` : 'inherit' }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {groupedItems.map(renderItemGroup)}
          </div>
        </div>

        {/* Footer bottom with copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200/30">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0" style={{ color: menu.textColor ? `${menu.textColor}99` : 'inherit' }}>
              © {currentYear} {copyright || title}. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {/* Social icons - This could be extracted from menu items with specific URLs or icons */}
              <a 
                href="#" 
                className="text-sm hover:opacity-80"
                style={{ color: menu.textColor ? `${menu.textColor}99` : 'inherit' }}
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-sm hover:opacity-80"
                style={{ color: menu.textColor ? `${menu.textColor}99` : 'inherit' }}
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 