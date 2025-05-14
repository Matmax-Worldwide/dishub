'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import { cmsOperations } from '@/lib/graphql-client';
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

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  menuId?: string;
  isFixed?: boolean;
  backgroundColor?: string;
  textColor?: string;
  logoUrl?: string;
  isEditing?: boolean;
  onUpdate?: (data: { 
    title: string; 
    subtitle?: string; 
    menuId?: string;
    isFixed?: boolean;
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
  }) => void;
}

export default function HeaderSection({ 
  title, 
  subtitle, 
  menuId,
  isFixed: initialIsFixed = false,
  backgroundColor: initialBackgroundColor = '#ffffff',
  textColor: initialTextColor = '#000000',
  logoUrl: initialLogoUrl = '',
  isEditing = false, 
  onUpdate 
}: HeaderSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
  const [localMenuId, setLocalMenuId] = useState(menuId || '');
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [isFixed, setIsFixed] = useState(initialIsFixed);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [availableMedia, setAvailableMedia] = useState<{id: string, title: string, fileUrl: string}[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load available menus when in editing mode
  useEffect(() => {
    const fetchMenus = async () => {
      setLoadingMenus(true);
      try {
        const menusData = await cmsOperations.getMenus();
        if (Array.isArray(menusData)) {
          setMenus(menusData);
          
          // If we have a menuId, find and set the selected menu
          if (localMenuId) {
            const menu = menusData.find(m => m.id === localMenuId);
            if (menu) {
              console.log(`Found menu with ID ${localMenuId}: ${menu.name}`);
              setSelectedMenu(menu);
              // Set styling preferences from the menu if they exist
              if (menu.isFixed !== null) setIsFixed(menu.isFixed);
              if (menu.backgroundColor) setBackgroundColor(menu.backgroundColor);
              if (menu.textColor) setTextColor(menu.textColor);
            } else {
              console.log(`Menu with ID ${localMenuId} not found`);
            }
          }
        }
      } catch (error) {
        console.error('Error loading menus:', error);
      } finally {
        setLoadingMenus(false);
      }
    };
    
    // Always fetch menus whether in editing mode or view mode
    fetchMenus();
    
    // If in editing mode, also load media for logo selection
    if (isEditing) {
      const fetchMedia = async () => {
        setLoadingMedia(true);
        try {
          // This is a placeholder - implement the actual media fetching functionality
          // when your media library is available
          const mockMedia = [
            { id: 'logo1', title: 'Logo 1', fileUrl: '/images/logo1.png' },
            { id: 'logo2', title: 'Company Logo', fileUrl: '/images/logo2.png' },
            { id: 'logo3', title: 'Brand Image', fileUrl: '/images/logo3.png' },
          ];
          setAvailableMedia(mockMedia);
        } catch (error) {
          console.error('Error loading media:', error);
        } finally {
          setLoadingMedia(false);
        }
      };
      
      fetchMedia();
    }
  }, [isEditing, localMenuId]);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if ((subtitle || '') !== localSubtitle) setLocalSubtitle(subtitle || '');
      if ((menuId || '') !== localMenuId) setLocalMenuId(menuId || '');
      if ((initialLogoUrl || '') !== logoUrl) setLogoUrl(initialLogoUrl || '');
    }
  }, [title, subtitle, menuId, initialLogoUrl, localTitle, localSubtitle, localMenuId, logoUrl]);
  
  // Add scroll effect when not in editing mode
  useEffect(() => {
    if (!isEditing) {
      const handleScroll = () => {
        if (window.scrollY > 10) {
          setScrolled(true);
        } else {
          setScrolled(false);
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isEditing]);
  
  // Optimize update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string | boolean) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Prepare data to update
      const updateData = {
        title: localTitle,
        subtitle: localSubtitle,
        menuId: localMenuId,
        isFixed,
        backgroundColor,
        textColor,
        logoUrl,
        [field]: value
      };
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, localTitle, localSubtitle, localMenuId, isFixed, backgroundColor, textColor, logoUrl]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Individual change handlers
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);
  
  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);
  
  const handleMenuChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMenuId = e.target.value;
    setLocalMenuId(newMenuId);
    
    // Update the selected menu
    if (newMenuId) {
      const menu = menus.find(m => m.id === newMenuId);
      if (menu) {
        setSelectedMenu(menu);
        // Also update styling preferences if they exist in the menu
        if (menu.isFixed !== null) {
          setIsFixed(menu.isFixed);
          handleUpdateField('isFixed', menu.isFixed);
        }
        if (menu.backgroundColor) {
          setBackgroundColor(menu.backgroundColor);
          handleUpdateField('backgroundColor', menu.backgroundColor);
        }
        if (menu.textColor) {
          setTextColor(menu.textColor);
          handleUpdateField('textColor', menu.textColor);
        }
      } else {
        setSelectedMenu(null);
      }
    } else {
      setSelectedMenu(null);
    }
    
    handleUpdateField('menuId', newMenuId);
  }, [menus, handleUpdateField]);

  const handleIsFixedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsFixed(newValue);
    handleUpdateField('isFixed', newValue);
  }, [handleUpdateField]);

  const handleBackgroundColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setBackgroundColor(newValue);
    handleUpdateField('backgroundColor', newValue);
  }, [handleUpdateField]);

  const handleTextColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextColor(newValue);
    handleUpdateField('textColor', newValue);
  }, [handleUpdateField]);
  
  const handleLogoUrlChange = useCallback((newValue: string) => {
    setLogoUrl(newValue);
    handleUpdateField('logoUrl', newValue);
    setShowMediaSelector(false);
  }, [handleUpdateField]);
  
  const toggleDropdown = useCallback((itemId: string) => {
    setIsDropdownOpen(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);
  
  // Render menu items recursively
  const renderMenuItems = (items: MenuItem[], level = 0) => {
    if (!items || items.length === 0) return null;
    
    return items.map(item => {
      // Determine the URL
      let href = '#';
      if (item.url) {
        href = item.url;
      } else if (item.page?.slug) {
        href = `/${locale}/${item.page.slug}`;
      }
      
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <li key={item.id} className={`relative ${level === 0 ? 'group' : ''}`}>
          {hasChildren ? (
            <div className="relative">
              <button
                onClick={() => toggleDropdown(item.id)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-colors ${
                  scrolled ? 'hover:text-blue-600' : 'hover:text-blue-300'
                }`}
                style={{ color: textColor }}
              >
                <span>{item.title}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              
              {isDropdownOpen[item.id] || level > 0 ? (
                // Clicked dropdown for mobile
                <div className={`absolute ${level === 0 ? 'right-0 top-full' : 'left-full top-0'} mt-1 py-2 w-48 bg-white/90 backdrop-blur-md rounded-md shadow-lg z-10`}>
                  {item.children && renderMenuItems(item.children, level + 1)}
                </div>
              ) : level === 0 ? (
                // Hover dropdown for desktop (top level only)
                <div className="hidden group-hover:block absolute right-0 top-full mt-1 py-2 w-48 bg-white/90 backdrop-blur-md rounded-md shadow-lg z-10">
                  {item.children && renderMenuItems(item.children, level + 1)}
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href={href}
              target={item.target || "_self"}
              className={`px-3 py-2 text-sm font-medium transition-colors block ${
                scrolled ? 'hover:text-blue-600' : 'hover:text-blue-300'
              }`}
              style={{ color: textColor }}
            >
              {item.title}
            </Link>
          )}
        </li>
      );
    });
  };

  // Media selector modal for logo
  const MediaSelector = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Seleccionar Logo</h3>
          <button
            onClick={() => setShowMediaSelector(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loadingMedia ? (
          <div className="py-8 text-center">Cargando medios...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {availableMedia.map((media) => (
                <div 
                  key={media.id} 
                  className={`border rounded-md p-2 cursor-pointer hover:border-blue-500 transition-colors ${
                    logoUrl === media.fileUrl ? 'border-blue-500 ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => handleLogoUrlChange(media.fileUrl)}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
                    {media.fileUrl ? (
                      <img 
                        src={media.fileUrl} 
                        alt={media.title} 
                        className="max-h-full max-w-full object-contain" 
                      />
                    ) : (
                      <div className="text-gray-400">Sin imagen</div>
                    )}
                  </div>
                  <p className="text-xs truncate">{media.title}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm mb-2">O ingresa una URL de imagen:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  placeholder="https://ejemplo.com/logo.png"
                />
                <button
                  onClick={() => handleLogoUrlChange(logoUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isEditing ? (
        <div className="space-y-4 p-4 border rounded-lg">
          <StableInput
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="Enter title..."
            className="font-medium text-xl"
            label="Title"
            debounceTime={300}
          />
          
          <StableInput
            value={localSubtitle}
            onChange={handleSubtitleChange}
            placeholder="Enter subtitle (optional)..."
            className="text-muted-foreground"
            label="Subtitle (optional)"
            debounceTime={300}
          />
          
          {/* Logo selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <div className="flex items-start gap-2">
              <div 
                className="border rounded-md h-20 w-20 flex items-center justify-center overflow-hidden bg-gray-50"
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="max-h-full max-w-full object-contain" 
                  />
                ) : (
                  <div className="text-gray-400 text-sm text-center">
                    No logo<br/>selected
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button 
                  onClick={() => setShowMediaSelector(true)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Select Logo
                </button>
                {logoUrl && (
                  <button 
                    onClick={() => handleLogoUrlChange('')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 ml-2"
                  >
                    Remove
                  </button>
                )}
                <div className="text-xs text-gray-500">
                  Select an image from your media library or enter a URL
                </div>
              </div>
            </div>
          </div>
          
          {/* Menu selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="menu-selector">
              Select Menu for Navigation
            </label>
            <select
              id="menu-selector"
              value={localMenuId}
              onChange={handleMenuChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (No Navigation)</option>
              {menus.map(menu => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
            {loadingMenus && <p className="text-sm text-muted-foreground">Loading menus...</p>}
            
            {/* Header style settings */}
            <div className="space-y-4 mt-4">
              <h4 className="text-sm font-medium">Header Style</h4>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFixed"
                  checked={isFixed}
                  onChange={handleIsFixedChange}
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="isFixed" className="text-sm">
                  Fixed position (stays at top when scrolling)
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="backgroundColor" className="text-sm block mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={backgroundColor}
                      onChange={handleBackgroundColorChange}
                      className="rounded border border-gray-300 h-8 w-8 mr-2"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={handleBackgroundColorChange}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="textColor" className="text-sm block mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="textColor"
                      value={textColor}
                      onChange={handleTextColorChange}
                      className="rounded border border-gray-300 h-8 w-8 mr-2"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={handleTextColorChange}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview of selected menu */}
            {selectedMenu && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Menu Preview</h4>
                <div className="border rounded-md overflow-hidden">
                  <div 
                    className="p-3 transition-all"
                    style={{ 
                      backgroundColor: backgroundColor,
                      color: textColor
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {logoUrl && (
                            <div className="h-10 w-10 flex-shrink-0">
                              <img 
                                src={logoUrl} 
                                alt="Logo" 
                                className="max-h-full max-w-full object-contain" 
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-lg">{localTitle}</div>
                            {localSubtitle && (
                              <div className="text-xs opacity-80">{localSubtitle}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-4">
                          {selectedMenu.items.slice(0, 4).map(item => (
                            <div key={item.id} className="text-sm font-medium">{item.title}</div>
                          ))}
                          {selectedMenu.items.length > 4 && (
                            <div className="text-sm font-medium">+ {selectedMenu.items.length - 4} más</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        {isFixed ? 
                          "✓ Posición fija - el header se mantendrá al hacer scroll" : 
                          "Posición normal - el header se desplazará con la página"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Media selector modal */}
          {showMediaSelector && <MediaSelector />}
        </div>
      ) : (
        <nav
          className={`${isFixed ? 'fixed' : 'relative'} w-full z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-white/80 backdrop-blur-md shadow-md py-2'
              : `py-4`
          }`}
          style={{
            backgroundColor: scrolled ? backgroundColor + '80' : backgroundColor + '00',
            color: textColor
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              {/* Logo/Title */}
              <Link href={`/${locale}`} className="flex items-center">
                {logoUrl && (
                  <div className="mr-3 flex-shrink-0">
                    <img 
                      src={logoUrl} 
                      alt={localTitle} 
                      className="h-10 w-auto object-contain" 
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: textColor }}>
                    {localTitle}
                  </h2>
                  {localSubtitle && (
                    <p className="text-sm opacity-80" style={{ color: textColor }}>
                      {localSubtitle}
                    </p>
                  )}
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <ul className="flex items-center space-x-4">
                  {selectedMenu && selectedMenu.items && selectedMenu.items.length > 0 ? (
                    renderMenuItems(selectedMenu.items)
                  ) : (
                    // If no menu is selected but we have menuId, attempt to fetch from API directly
                    menuId && (
                      <div className="text-sm text-gray-500">
                        {loadingMenus ? "Loading menu..." : "Menu not found"}
                      </div>
                    )
                  )}
                </ul>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => {
                    // Toggle all top-level menus
                    const newState: { [key: string]: boolean } = {};
                    if (selectedMenu && selectedMenu.items) {
                      selectedMenu.items.forEach(item => {
                        newState[item.id] = false; // Close all dropdowns first
                      });
                    }
                    // Then toggle overall menu visibility with a special key
                    setIsDropdownOpen(prev => ({
                      ...newState,
                      mobileMenu: !prev.mobileMenu
                    }));
                  }}
                  className="p-2 rounded-md focus:outline-none"
                  style={{ color: textColor }}
                >
                  {isDropdownOpen.mobileMenu ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isDropdownOpen.mobileMenu && selectedMenu && selectedMenu.items && (
            <div className="md:hidden bg-white/90 backdrop-blur-md shadow-lg mt-2">
              <div className="px-4 py-3 space-y-1">
                <ul className="space-y-2">
                  {selectedMenu.items.map(item => {
                    // Determine the URL
                    let href = '#';
                    if (item.url) {
                      href = item.url;
                    } else if (item.page?.slug) {
                      href = `/${locale}/${item.page.slug}`;
                    }
                    
                    const hasChildren = item.children && item.children.length > 0;
                    
                    return (
                      <li key={item.id} className="relative">
                        {hasChildren ? (
                          <div>
                            <button
                              onClick={() => toggleDropdown(item.id)}
                              className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                              <span>{item.title}</span>
                              <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen[item.id] ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isDropdownOpen[item.id] && item.children && (
                              <div className="pl-4 mt-1 space-y-1">
                                {item.children.map(child => {
                                  let childHref = '#';
                                  if (child.url) {
                                    childHref = child.url;
                                  } else if (child.page?.slug) {
                                    childHref = `/${locale}/${child.page.slug}`;
                                  }
                                  
                                  return (
                                    <Link
                                      key={child.id}
                                      href={childHref}
                                      target={child.target || "_self"}
                                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                    >
                                      {child.title}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={href}
                            target={item.target || "_self"}
                            className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            {item.title}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </nav>
      )}
    </>
  );
} 