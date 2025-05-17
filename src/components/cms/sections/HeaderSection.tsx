'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import { cmsOperations } from '@/lib/graphql-client';
import { useParams } from 'next/navigation';
import { HeaderAdvancedOptions, HeaderSize, MenuAlignment, MenuButtonStyle, MobileMenuStyle, MobileMenuPosition } from '@/types/cms';
import { Menu, MenuItem } from '@/app/api/graphql/types';
import { MediaLibrary } from '@/components/cms/media/MediaLibrary';
import { MediaItem } from '@/components/cms/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';

interface HeaderSectionProps {
  title?: string;
  subtitle?: string;
  menuId?: string;
  backgroundColor?: string;
  textColor?: string;
  logoUrl?: string;
  transparency?: number;
  headerSize?: HeaderSize;
  menuAlignment?: MenuAlignment;
  menuButtonStyle?: MenuButtonStyle;
  mobileMenuStyle?: MobileMenuStyle;
  mobileMenuPosition?: MobileMenuPosition;
  transparentHeader?: boolean;
  borderBottom?: boolean;
  advancedOptions?: HeaderAdvancedOptions;
  isEditing?: boolean;
  onUpdate?: (data: { 
    title?: string; 
    subtitle?: string; 
    menuId?: string;
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
    transparency?: number;
    headerSize?: HeaderSize;
    menuAlignment?: MenuAlignment;
    menuButtonStyle?: MenuButtonStyle;
    mobileMenuStyle?: MobileMenuStyle;
    mobileMenuPosition?: MobileMenuPosition;
    transparentHeader?: boolean;
    borderBottom?: boolean;
    advancedOptions?: HeaderAdvancedOptions;
  }) => void;
}

export default function HeaderSection({ 
  title, 
  subtitle, 
  menuId,
  backgroundColor: initialBackgroundColor = '#ffffff',
  textColor: initialTextColor = '#000000',
  logoUrl: initialLogoUrl = '',
  transparency: initialTransparency = 0,
  headerSize: initialHeaderSize = 'md',
  menuAlignment: initialMenuAlignment = 'right',
  menuButtonStyle: initialMenuButtonStyle = 'default',
  mobileMenuStyle: initialMobileMenuStyle = 'dropdown',
  mobileMenuPosition: initialMobileMenuPosition = 'right',
  transparentHeader: initialTransparentHeader = false,
  borderBottom: initialBorderBottom = false,
  advancedOptions: initialAdvancedOptions = {},
  isEditing = false, 
  onUpdate 
}: HeaderSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title === undefined ? '' : title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle === undefined ? '' : subtitle);
  const [localMenuId, setLocalMenuId] = useState(menuId || '');
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  
  // Nuevos estados para las opciones adicionales
  const [transparency, setTransparency] = useState(initialTransparency);
  const [headerSize, setHeaderSize] = useState<HeaderSize>(initialHeaderSize);
  const [menuAlignment, setMenuAlignment] = useState<MenuAlignment>(initialMenuAlignment);
  const [menuButtonStyle, setMenuButtonStyle] = useState<MenuButtonStyle>(initialMenuButtonStyle);
  const [mobileMenuStyle, setMobileMenuStyle] = useState<MobileMenuStyle>(initialMobileMenuStyle);
  const [mobileMenuPosition, setMobileMenuPosition] = useState<MobileMenuPosition>(initialMobileMenuPosition);
  const [transparentHeader, setTransparentHeader] = useState(initialTransparentHeader);
  const [borderBottom, setBorderBottom] = useState(initialBorderBottom);
  const [advancedOptions, setAdvancedOptions] = useState<HeaderAdvancedOptions>(initialAdvancedOptions);
  
  // Estado para mostrar/ocultar opciones avanzadas en el panel de edición
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
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
          setMenus(menusData as Menu[]);
          
          // If we have a menuId, find and set the selected menu
          if (localMenuId) {
            // Use the new function to get menu with header style
            const menuWithStyle = await cmsOperations.getMenuWithHeaderStyle(localMenuId);
            
            if (menuWithStyle) {
              console.log(`Found menu with ID ${localMenuId} with header style:`, menuWithStyle);
              setSelectedMenu(menuWithStyle as Menu);
              
              // If header style exists, set all the style properties
              if (menuWithStyle.headerStyle) {
                const style = menuWithStyle.headerStyle;
                
                // Set all the style properties
                setTransparency(style.transparency || 0);
                setHeaderSize(style.headerSize as HeaderSize || 'md');
                setMenuAlignment(style.menuAlignment as MenuAlignment || 'right');
                setMenuButtonStyle(style.menuButtonStyle as MenuButtonStyle || 'default');
                setMobileMenuStyle(style.mobileMenuStyle as MobileMenuStyle || 'dropdown');
                setMobileMenuPosition(style.mobileMenuPosition as MobileMenuPosition || 'right');
                setTransparentHeader(style.transparentHeader || false);
                setBorderBottom(style.borderBottom || false);
                
                // Set advanced options if they exist
                if (style.advancedOptions) {
                  setAdvancedOptions(style.advancedOptions as HeaderAdvancedOptions);
                }
              }
            } else {
              console.log(`Menu with ID ${localMenuId} not found or has no header style`);
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
    
    // Media fetching is now handled by the MediaLibrary component
    
  }, [isEditing, localMenuId]);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title === undefined ? '' : title);
      if ((subtitle || '') !== localSubtitle) setLocalSubtitle(subtitle === undefined ? '' : subtitle);
      if ((menuId || '') !== localMenuId) setLocalMenuId(menuId || '');
      if ((initialLogoUrl || '') !== logoUrl) setLogoUrl(initialLogoUrl || '');
    }
  }, [title, subtitle, menuId, initialLogoUrl, localTitle, localSubtitle, localMenuId, logoUrl]);
  
  // Watch for scroll events when fixed
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
      
      // Inicializar estado al cargar
      handleScroll();

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isEditing]);
  
  // Optimize update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string | number | boolean) => {
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
        logoUrl,
        transparency,
        headerSize,
        menuAlignment,
        menuButtonStyle,
        mobileMenuStyle,
        mobileMenuPosition,
        transparentHeader,
        borderBottom,
        advancedOptions
      };
      
      // Update the specific field with the new value
      (updateData as Record<string, string | number | boolean | HeaderAdvancedOptions>)[field] = value;
      
      // Set up a debounced update
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        // Reset the editing ref after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 300);
      }, 500);
    }
  }, [
    localTitle, 
    localSubtitle, 
    localMenuId, 
    logoUrl,
    transparency,
    headerSize,
    menuAlignment,
    menuButtonStyle,
    mobileMenuStyle,
    mobileMenuPosition,
    transparentHeader,
    borderBottom,
    advancedOptions,
    onUpdate
  ]);
  
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
  
  const handleMenuChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const menuId = e.target.value;
    setLocalMenuId(menuId);
    
    // Find selected menu
    const selectedMenu = menus.find(m => m.id === menuId);
    setSelectedMenu(selectedMenu || null);
    
    // If the menu has a headerStyle, update our style settings
    if (selectedMenu?.headerStyle) {
      const style = selectedMenu.headerStyle;
      setTransparency(style.transparency || 0);
      setHeaderSize(style.headerSize as HeaderSize || 'md');
      setMenuAlignment(style.menuAlignment as MenuAlignment || 'right');
      setMenuButtonStyle(style.menuButtonStyle as MenuButtonStyle || 'default');
      setMobileMenuStyle(style.mobileMenuStyle as MobileMenuStyle || 'dropdown');
      setMobileMenuPosition(style.mobileMenuPosition as MobileMenuPosition || 'right');
      setTransparentHeader(style.transparentHeader || false);
      setBorderBottom(style.borderBottom || false);
      
      if (style.advancedOptions) {
        setAdvancedOptions(style.advancedOptions as HeaderAdvancedOptions);
      }
    }
    
    handleUpdateField('menuId', menuId);
  };

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
    
    return items.map((item: MenuItem) => {
      // Determine the URL
      let href = '#';
      
      if (item.pageId && item.page?.slug) {
        // If the item has a pageId and the page object with slug, use that
        href = `/${locale}/${item.page.slug}`;
      } else if (item.url) {
        // Otherwise use the direct URL if available
        href = item.url;
      }
      
      const hasChildren = item.children && item.children.length > 0;
      
      // Apply different styles based on menuButtonStyle
      const linkStyles = (() => {
        const baseStyle = `transition-colors duration-300 ${level === 0 ? 'group' : ''}`;
        
        switch (menuButtonStyle) {
          case 'filled':
            return `${baseStyle} px-4 py-2 rounded-md ${scrolled || !transparentHeader ? 'hover:bg-gray-100' : 'hover:bg-white/20'}`;
          case 'outline':
            return `${baseStyle} px-4 py-2 border border-current rounded-md hover:bg-opacity-10 hover:bg-current`;
          default:
            return `${baseStyle} px-3 py-2 hover:opacity-80`;
        }
      })();
      
      return (
        <li key={item.id} className={`relative ${level === 0 ? 'group' : ''}`}>
          {hasChildren ? (
            <div className="relative">
              <button
                onClick={() => toggleDropdown(item.id)}
                className={`flex items-center space-x-1 text-sm font-medium ${linkStyles}`}
                style={{ color: textColor }}
              >
                <span>{item.title}</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen[item.id] ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen[item.id] || level > 0 ? (
                // Clicked dropdown for mobile
                <div className={`absolute ${level === 0 ? 'right-0 top-full' : 'left-full top-0'} mt-1 py-2 w-48 bg-white/90 backdrop-blur-md rounded-md shadow-lg z-10 transition-all duration-300 ease-in-out animate-fadeIn`}>
                  {item.children && renderMenuItems(item.children, level + 1)}
                </div>
              ) : level === 0 ? (
                // Hover dropdown for desktop (top level only)
                <div className="hidden group-hover:block absolute right-0 top-full mt-1 py-2 w-48 bg-white/90 backdrop-blur-md rounded-md shadow-lg z-10 transition-all duration-300 ease-in-out">
                  {item.children && renderMenuItems(item.children, level + 1)}
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href={href}
              target={item.target || "_self"}
              className={`text-sm font-medium block ${linkStyles}`}
              style={{ color: textColor }}
              onClick={() => {
                // Close mobile menu when clicking on a link
                if (isDropdownOpen.mobileMenu) {
                  setIsDropdownOpen(prev => ({...prev, mobileMenu: false}));
                }
              }}
            >
              {item.title}
            </Link>
          )}
        </li>
      );
    });
  };

  // Media selector component
  const MediaSelector = () => {
    // Cerrar el selector
    const handleClose = () => {
      setShowMediaSelector(false);
    };

    // Handle media item selection from MediaLibrary
    const handleMediaSelection = (mediaItem: MediaItem) => {
      setLogoUrl(mediaItem.fileUrl);
      handleLogoUrlChange(mediaItem.fileUrl);
      setShowMediaSelector(false);
    };

    // URL personalizada
    const [customUrl, setCustomUrl] = useState('');
    
    // Handle custom URL selection
    const handleCustomUrlSelection = (url: string) => {
      setLogoUrl(url);
      handleLogoUrlChange(url);
      setShowMediaSelector(false);
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30">
        <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Select Logo</h3>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Custom URL input */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Enter Image URL</label>
            <div className="flex">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 border rounded-l-md p-2 text-sm"
              />
              <button
                onClick={() => handleCustomUrlSelection(customUrl)}
                disabled={!customUrl.trim()}
                className="bg-blue-600 text-white px-3 py-2 rounded-r-md disabled:bg-blue-300"
              >
                Use URL
              </button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <MediaLibrary 
              onSelect={handleMediaSelection}
              isSelectionMode={true}
              showHeader={true}
            />
          </div>
        </div>
      </div>
    );
  };

  // Agregar handlers para las nuevas opciones
  const handleTransparentHeaderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setTransparentHeader(newValue);
    handleUpdateField('transparentHeader', newValue);
  }, [handleUpdateField]);

  const handleBorderBottomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setBorderBottom(newValue);
    handleUpdateField('borderBottom', newValue);
  }, [handleUpdateField]);

  const handleMenuAlignmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'center' | 'right';
    setMenuAlignment(newValue);
    handleUpdateField('menuAlignment', newValue);
  }, [handleUpdateField]);

  const handleMenuButtonStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'default' | 'filled' | 'outline';
    setMenuButtonStyle(newValue);
    handleUpdateField('menuButtonStyle', newValue);
  }, [handleUpdateField]);

  const handleMobileMenuStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'fullscreen' | 'dropdown' | 'sidebar';
    setMobileMenuStyle(newValue);
    handleUpdateField('mobileMenuStyle', newValue);
  }, [handleUpdateField]);

  const handleMobileMenuPositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'right';
    setMobileMenuPosition(newValue);
    handleUpdateField('mobileMenuPosition', newValue);
  }, [handleUpdateField]);

  // Add handlers for transparency and headerSize
  const handleTransparencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setTransparency(newValue);
    handleUpdateField('transparency', newValue.toString());
  }, [handleUpdateField]);
  
  const handleHeaderSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as HeaderSize;
    setHeaderSize(newValue);
    handleUpdateField('headerSize', newValue);
  }, [handleUpdateField]);
  
  // Advanced options handlers
  const handleAdvancedOptionChange = useCallback((key: string, value: string | number | boolean) => {
    const updatedOptions = {
      ...advancedOptions,
      [key]: value
    };
    setAdvancedOptions(updatedOptions);
    // Convert to string for handleUpdateField
    handleUpdateField('advancedOptions', JSON.stringify(updatedOptions));
  }, [advancedOptions, handleUpdateField]);
  
  // Utility function to convert hex to rgb for transparency
  const hexToRgb = useCallback((hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Check if any values are NaN (invalid hex)
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return { r: 0, g: 0, b: 0 };
    }
    
    return { r, g, b };
  }, []);

  // Function to save header style to the database
  const saveHeaderStyle = useCallback(async () => {
    if (!localMenuId) return;
    
    try {
      // Prepare the header style data
      const headerStyleData = {
        transparency,
        headerSize,
        menuAlignment,
        menuButtonStyle,
        mobileMenuStyle,
        mobileMenuPosition,
        transparentHeader,
        borderBottom,
        advancedOptions
      };
      
      // Save the header style using the GraphQL client
      const result = await cmsOperations.updateHeaderStyle(localMenuId, headerStyleData);
      
      if (result.success) {
        console.log('Header style saved successfully:', result.headerStyle);
      } else {
        console.error('Failed to save header style:', result.message);
      }
    } catch (error) {
      console.error('Error saving header style:', error);
    }
  }, [localMenuId, transparency, headerSize, menuAlignment, menuButtonStyle, 
      mobileMenuStyle, mobileMenuPosition, transparentHeader, borderBottom, advancedOptions]);

  // Add a save button for the header style
  const HeaderStyleSaveButton = () => (
    <button
      onClick={saveHeaderStyle}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Save Header Style
    </button>
  );

  return (
    <>
      {isEditing ? (
        <div className="space-y-4">
          <StableInput
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="Enter title (optional)..."
            className="font-medium text-xl"
            label="Title (optional)"
            debounceTime={300}
            data-field-id="title"
            data-component-type="Header"
          />
          
          <StableInput
            value={localSubtitle}
            onChange={handleSubtitleChange}
            placeholder="Enter subtitle (optional)..."
            className="text-muted-foreground"
            label="Subtitle (optional)"
            debounceTime={300}
            data-field-id="subtitle"
            data-component-type="Header"
          />
          
          {/* Logo selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <div className="flex items-start gap-2">
              <div 
                className="border rounded-md h-20 w-20 flex items-center justify-center overflow-hidden bg-gray-50"
              >
                {logoUrl ? (
                  <div className="h-10 w-10 flex-shrink-0" data-field-type="logoUrl" data-component-type="Header">
                    <S3FilePreview
                      src={logoUrl} 
                      alt="Logo"
                      className="max-h-full max-w-full object-contain" 
                      width={80}
                      height={80}
                    />
                  </div>
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
                  id="transparentHeader"
                  checked={transparentHeader}
                  onChange={handleTransparentHeaderChange}
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="transparentHeader" className="text-sm">
                  Transparent background (changes on scroll)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="borderBottom"
                  checked={borderBottom}
                  onChange={handleBorderBottomChange}
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="borderBottom" className="text-sm">
                  Show border at bottom
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="backgroundColor" className="text-sm block mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    id="backgroundColor"
                    value={backgroundColor}
                    onChange={handleBackgroundColorChange}
                    className="rounded border border-gray-300 h-8 w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="textColor" className="text-sm block mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    id="textColor"
                    value={textColor}
                    onChange={handleTextColorChange}
                    className="rounded border border-gray-300 h-8 w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label htmlFor="menuAlignment" className="text-sm block mb-1">
                    Menu Alignment
                  </label>
                  <select
                    id="menuAlignment"
                    value={menuAlignment}
                    onChange={handleMenuAlignmentChange}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="menuButtonStyle" className="text-sm block mb-1">
                    Menu Button Style
                  </label>
                  <select
                    id="menuButtonStyle"
                    value={menuButtonStyle}
                    onChange={handleMenuButtonStyleChange}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="mobileMenuStyle" className="text-sm block mb-1">
                    Mobile Menu Style
                  </label>
                  <select
                    id="mobileMenuStyle"
                    value={mobileMenuStyle}
                    onChange={handleMobileMenuStyleChange}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="dropdown">Dropdown</option>
                    <option value="fullscreen">Fullscreen</option>
                    <option value="sidebar">Sidebar</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="mobileMenuPosition" className="text-sm block mb-1">
                    Sidebar Position (mobile)
                  </label>
                  <select
                    id="mobileMenuPosition"
                    value={mobileMenuPosition}
                    onChange={handleMobileMenuPositionChange}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Replace with this: */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="headerSize" className="text-sm block mb-1">
                  Header Size
                </label>
                <select
                  id="headerSize"
                  value={headerSize}
                  onChange={handleHeaderSizeChange}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="transparency" className="text-sm block mb-1">
                  Background Transparency
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    id="transparency"
                    min="0"
                    max="100"
                    value={transparency}
                    onChange={handleTransparencyChange}
                    className="flex-1 mr-2"
                  />
                  <span className="text-sm">{transparency}%</span>
                </div>
              </div>
            </div>
            
            {/* Advanced Options Toggle */}
            <div className="mt-4 border-t pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(prev => !prev)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <svg 
                  className={`h-4 w-4 mr-1 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced Options
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-200">
                  <div>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={advancedOptions?.glassmorphism || false}
                        onChange={(e) => handleAdvancedOptionChange('glassmorphism', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      Enable Glassmorphism
                    </label>
                  </div>
                  
                  {advancedOptions?.glassmorphism && (
                    <div>
                      <label htmlFor="blur" className="text-sm block mb-1">
                        Blur Amount
                      </label>
                      <input
                        type="range"
                        id="blur"
                        min="0"
                        max="20"
                        value={advancedOptions?.blur || 5}
                        onChange={(e) => handleAdvancedOptionChange('blur', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0px</span>
                        <span>20px</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="customClass" className="text-sm block mb-1">
                      Custom CSS Class
                    </label>
                    <input
                      type="text"
                      id="customClass"
                      value={advancedOptions?.customClass || ''}
                      onChange={(e) => handleAdvancedOptionChange('customClass', e.target.value)}
                      placeholder="e.g. my-header-class"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="shadow" className="text-sm block mb-1">
                      Shadow Style
                    </label>
                    <select
                      id="shadow"
                      value={advancedOptions?.shadow || 'none'}
                      onChange={(e) => handleAdvancedOptionChange('shadow', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="animation" className="text-sm block mb-1">
                      Animation Effect
                    </label>
                    <select
                      id="animation"
                      value={advancedOptions?.animation || 'none'}
                      onChange={(e) => handleAdvancedOptionChange('animation', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="fade">Fade In</option>
                      <option value="slide">Slide Down</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </div>
                </div>
              )}
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
                            <div className="h-10 w-10 flex-shrink-0" data-field-type="logoUrl" data-component-type="Header">
                              <S3FilePreview
                                src={logoUrl} 
                                alt="Logo"
                                className="max-h-full max-w-full object-contain"
                                width={80}
                                height={80}
                              />
                            </div>
                          )}
                          <div>
                            {localTitle && (
                              <div className="font-bold text-lg">{localTitle}</div>
                            )}
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
                        ✓ Posición fija - el header se mantendrá al hacer scroll
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <HeaderStyleSaveButton />
                </div>
              </div>
            )}
          </div>
          
          {/* Media selector modal */}
          {showMediaSelector && <MediaSelector />}
        </div>
      ) : (
        <nav
          className={`w-full z-50 transition-all duration-300 py-4 ${
            transparentHeader && !scrolled ? 'bg-transparent' : ''
          } ${
            borderBottom ? 'border-b border-gray-200' : ''
          } ${
            headerSize === 'sm' ? 'py-2' : headerSize === 'lg' ? 'py-6' : 'py-4'
          } ${
            advancedOptions?.customClass || ''
          } ${
            advancedOptions?.glassmorphism ? 'backdrop-filter backdrop-blur' : ''
          } ${
            advancedOptions?.shadow ? `shadow-${advancedOptions.shadow}` : ''
          } ${
            advancedOptions?.animation === 'fade' ? 'animate-fadeIn' : 
            advancedOptions?.animation === 'slide' ? 'animate-slideDown' :
            advancedOptions?.animation === 'bounce' ? 'animate-bounce' : ''
          }`}
          style={{
            backgroundColor: transparentHeader && !scrolled 
              ? 'transparent' 
              : transparency > 0 
                ? `rgba(${hexToRgb(backgroundColor || '#ffffff').r}, ${hexToRgb(backgroundColor || '#ffffff').g}, ${hexToRgb(backgroundColor || '#ffffff').b}, ${(100 - transparency) / 100})`
                : (backgroundColor || '#ffffff'),
            backdropFilter: advancedOptions?.glassmorphism ? `blur(${advancedOptions?.blur || 5}px)` : undefined,
            color: textColor
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              {/* Logo/Title */}
              <Link href={`/${locale}`} className="flex items-center">
                {logoUrl && (
                  <div className="mr-3 flex-shrink-0" data-field-type="logoUrl" data-component-type="Header">
                    <S3FilePreview
                      src={logoUrl} 
                      alt={localTitle || "Logo"}
                      className="h-10 w-auto object-contain"
                      width={100}
                      height={100}
                    />
                  </div>
                )}
                <div>
                  {localTitle && (
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: textColor }} data-field-type="title" data-component-type="Header">
                      {localTitle}
                    </h2>
                  )}
                  {localSubtitle && (
                    <p className="text-sm opacity-80" style={{ color: textColor }} data-field-type="subtitle" data-component-type="Header">
                      {localSubtitle}
                    </p>
                  )}
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className={`hidden md:flex items-center space-x-4 ${
                menuAlignment === 'left' ? 'justify-start' : 
                menuAlignment === 'center' ? 'justify-center' : 'justify-end'
              } flex-1`}>
                <ul className={`flex items-center space-x-4 ${
                  menuAlignment === 'center' ? 'mx-auto' : ''
                }`}>
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
                  className={`p-2 rounded-md focus:outline-none ${
                    menuButtonStyle === 'filled' ? 'bg-primary text-white' :
                    menuButtonStyle === 'outline' ? 'border border-current' : ''
                  }`}
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
            <>
              {/* Overlay for fullscreen and sidebar */}
              {(mobileMenuStyle === 'fullscreen' || mobileMenuStyle === 'sidebar') && (
                <div 
                  className="fixed inset-0 bg-black/30 z-30 md:hidden animate-fadeIn"
                  onClick={() => setIsDropdownOpen(prev => ({ ...prev, mobileMenu: false }))}
                />
              )}
              
              <div 
                className={`md:hidden fixed z-40 transition-all duration-300 ease-in-out ${
                  mobileMenuStyle === 'fullscreen' ? 'inset-0 bg-white animate-fadeIn' :
                  mobileMenuStyle === 'sidebar' ? `top-0 bottom-0 w-[280px] bg-white shadow-xl ${
                    mobileMenuPosition === 'left' ? 'left-0 animate-slideInLeft' : 'right-0 animate-slideInRight'
                  }` :
                  'top-[4rem] left-0 right-0 bg-white/90 backdrop-blur-md shadow-lg animate-slideInDown'
                }`}
              >
                {mobileMenuStyle === 'fullscreen' && (
                  <div className="flex justify-end p-4">
                    <button
                      onClick={() => setIsDropdownOpen(prev => ({ ...prev, mobileMenu: false }))}
                      className="p-2"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className={`${
                  mobileMenuStyle === 'fullscreen' ? 'flex flex-col items-center justify-center h-full' : 'p-4'
                }`}>
                  {mobileMenuStyle === 'fullscreen' && logoUrl && (
                    <div className="mb-8">
                      <S3FilePreview
                        src={logoUrl} 
                        alt={localTitle || "Logo"}
                        className="h-16 w-auto object-contain mx-auto"
                        width={80}
                        height={80}
                      />
                    </div>
                  )}
                  
                  <ul className={`${
                    mobileMenuStyle === 'fullscreen' ? 'space-y-4 text-center' : 'space-y-2'
                  }`}>
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
                        <li key={item.id} className={`relative ${
                          mobileMenuStyle === 'fullscreen' ? 'text-xl' : ''
                        }`}>
                          {hasChildren ? (
                            <div>
                              <button
                                onClick={() => toggleDropdown(item.id)}
                                className={`flex items-center justify-between w-full px-3 py-2 hover:bg-gray-100 rounded-md ${
                                  mobileMenuStyle === 'fullscreen' ? 'text-xl font-medium' : 'text-base'
                                }`}
                              >
                                <span>{item.title}</span>
                                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen[item.id] ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {isDropdownOpen[item.id] && item.children && (
                                <div className={`mt-1 space-y-1 ${
                                  mobileMenuStyle === 'fullscreen' ? 'text-center' : 'pl-4'
                                }`}>
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
                                        className={`block px-3 py-2 hover:bg-gray-100 rounded-md ${
                                          mobileMenuStyle === 'fullscreen' ? 'text-lg' : 'text-sm'
                                        }`}
                                        onClick={() => {
                                          // Close dropdown and mobile menu when clicking a link
                                          setIsDropdownOpen(prev => ({
                                            ...prev,
                                            [item.id]: false,
                                            mobileMenu: false
                                          }));
                                        }}
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
                              className={`block px-3 py-2 hover:bg-gray-100 rounded-md ${
                                mobileMenuStyle === 'fullscreen' ? 'text-xl font-medium' : 'text-base'
                              }`}
                              onClick={() => {
                                // Close mobile menu when clicking a link
                                setIsDropdownOpen(prev => ({...prev, mobileMenu: false}));
                              }}
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
            </>
          )}
        </nav>
      )}
    </>
  );
} 