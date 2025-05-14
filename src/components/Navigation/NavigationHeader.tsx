'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDownIcon, MenuIcon, XIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

// Define the MenuItem interface to match what comes from the API
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

// Define the Menu interface to match what comes from the API
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

interface NavigationHeaderProps {
  menu: Menu;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  locale?: string;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  menu,
  logoUrl,
  title = menu.name,
  subtitle,
  className = '',
  locale: propLocale
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const params = useParams();
  const locale = propLocale || params.locale as string || 'en';
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Toggle dropdown menu
  const toggleDropdown = (id: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // Get background color with opacity based on scroll state
  const getBackgroundColor = () => {
    if (!menu.backgroundColor) return isScrolled ? 'rgba(255, 255, 255, 0.85)' : 'transparent';
    
    const color = menu.backgroundColor;
    if (color.startsWith('#') && color.length === 7) {
      // Convert hex to rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return isScrolled ? `rgba(${r}, ${g}, ${b}, 0.85)` : `rgba(${r}, ${g}, ${b}, 0)`;
    }
    
    return isScrolled ? `${color}d9` : 'transparent'; // d9 = 85% opacity in hex
  };

  // Render a single menu item (can be recursive for children)
  const renderMenuItem = (item: MenuItem, isDropdown = false, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const itemUrl = item.url || (item.page ? `/${locale}/${item.page.slug}` : '#');
    
    if (hasChildren) {
      return (
        <li key={item.id} className="relative group">
          <button
            onClick={() => toggleDropdown(item.id)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors ${
              isDropdown 
                ? 'hover:bg-black/5 w-full text-left' 
                : 'hover:text-primary'
            }`}
            style={{ color: menu.textColor || 'inherit' }}
          >
            {item.title}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${openDropdowns[item.id] ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Desktop dropdown (on hover) */}
          {!isMobileMenuOpen && level === 0 && (
            <div className="hidden group-hover:block absolute left-0 top-full min-w-[200px] bg-white shadow-lg rounded-md overflow-hidden z-50">
              <ul className="py-1">
                {item.children?.map(child => renderMenuItem(child, true, level + 1))}
              </ul>
            </div>
          )}
          
          {/* Mobile/Clicked dropdown */}
          {(isMobileMenuOpen || level > 0) && openDropdowns[item.id] && (
            <ul className={`${level > 0 ? 'pl-4' : 'border-l-2 border-primary/20 pl-2 ml-2 mt-1'}`}>
              {item.children?.map(child => renderMenuItem(child, true, level + 1))}
            </ul>
          )}
        </li>
      );
    }
    
    return (
      <li key={item.id}>
        <Link
          href={itemUrl}
          target={item.target || '_self'}
          className={`block px-4 py-2 text-sm font-medium transition-colors ${
            isDropdown 
              ? 'hover:bg-black/5 w-full' 
              : 'hover:text-primary'
          }`}
          style={{ color: menu.textColor || 'inherit' }}
          onClick={() => closeAllDropdowns()}
        >
          {item.title}
        </Link>
      </li>
    );
  };

  return (
    <header 
      ref={headerRef}
      className={`w-full ${menu.isFixed ? 'fixed top-0 left-0' : 'relative'} z-50 transition-all duration-300 ${
        isScrolled ? 'py-2 backdrop-blur-md shadow-md' : 'py-5'
      } ${className}`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        color: menu.textColor || 'inherit'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href={`/${locale}`} className="flex items-center gap-3">
            {logoUrl && (
              <div className="relative h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={title}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: menu.textColor || 'inherit' }}>{title}</h1>
              {subtitle && (
                <p className="text-xs md:text-sm opacity-80" style={{ color: menu.textColor || 'inherit' }}>{subtitle}</p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-1">
              {menu.items.map(item => renderMenuItem(item))}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <XIcon className="h-6 w-6" style={{ color: menu.textColor || 'inherit' }} />
            ) : (
              <MenuIcon className="h-6 w-6" style={{ color: menu.textColor || 'inherit' }} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <ul className="space-y-1 pt-2">
              {menu.items.map(item => renderMenuItem(item))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default NavigationHeader; 