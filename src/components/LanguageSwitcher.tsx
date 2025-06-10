'use client';

import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/app/i18n';
import { useState } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/useI18n';

interface LanguageSwitcherProps {
  isContactInView?: boolean;
  variant?: 'default' | 'compact' | 'sidebar';
  className?: string;
}

export default function LanguageSwitcher({ 
  isContactInView = false, 
  variant = 'default',
  className = ''
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Extract the current locale from the pathname
  const currentPathnameParts = pathname.split('/');
  const currentLocale = currentPathnameParts[1] || 'en'; // Default to 'en' if not found

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const changeLanguage = (locale: string) => {
    if (!pathname) return;
    
    // Replace the current locale in the pathname with the new locale
    const newPathnameParts = [...currentPathnameParts];
    newPathnameParts[1] = locale;
    const newPathname = newPathnameParts.join('/');
    
    router.push(newPathname);
    setIsOpen(false);
  };

  const getLanguageName = (locale: string) => {
    switch (locale) {
      case 'en':
        return t('language.english');
      case 'es':
        return t('language.spanish');
      case 'de':
        return t('language.german');
      default:
        return locale.toUpperCase();
    }
  };

  const getLanguageCode = (locale: string) => {
    return locale.toUpperCase();
  };

  // Compact variant for sidebar header
  if (variant === 'compact' || variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 h-8 px-2 text-xs hover:bg-gray-100 ${className}`}
            title={t('language.switch')}
          >
            <Globe className="h-3 w-3" />
            <span className="font-medium">{getLanguageCode(currentLocale)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {locales.map((locale) => (
            <DropdownMenuItem
              key={locale}
              onClick={() => changeLanguage(locale)}
              className={`flex items-center gap-2 text-sm ${
                locale === currentLocale ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
              }`}
            >
              <span className="text-xs opacity-60">{getLanguageCode(locale)}</span>
              <span>{getLanguageName(locale)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant (original implementation)
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-300 ${
          isContactInView 
            ? 'text-white hover:text-gray-200' 
            : 'text-[hsla(225,55%,21%,1)] hover:text-[hsla(225,55%,21%,0.8)]'
        }`}
        aria-expanded={isOpen}
        title={t('language.switch')}
      >
        <GlobeAltIcon className={`h-5 w-5 ${isContactInView ? 'text-white' : ''}`} /> 
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-40 bg-white rounded-md shadow-lg z-10">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => changeLanguage(locale)}
              className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${
                locale === currentLocale ? 'font-bold' : 'font-normal'
              }`}
            >
              {getLanguageName(locale)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 