'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import { cmsOperations } from '@/lib/graphql-client';
import { HeaderAdvancedOptions, HeaderSize, MenuAlignment, MenuButtonStyle, MobileMenuStyle, MobileMenuPosition } from '@/types/cms';
import { Menu, MenuItem } from '@/app/api/graphql/types';
import { MediaItem } from '@/components/cms/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';
import MediaSelector from '@/components/cms/MediaSelector';
import ColorSelector from '@/components/cms/ColorSelector';
import TransparencySelector from '@/components/cms/TransparencySelector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import IconSelector from '@/components/cms/IconSelector';
import * as LucideIcons from 'lucide-react';

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
  fixedHeader?: boolean;
  advancedOptions?: HeaderAdvancedOptions;
  menuIcon?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonAction?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  buttonBorderRadius?: number;
  buttonShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  buttonWidth?: string;
  buttonHeight?: string;
  buttonPosition?: 'left' | 'center' | 'right';
  buttonDropdown?: boolean;
  buttonDropdownItems?: Array<{id: string; label: string; url: string}>;
  buttonUrlType?: 'custom' | 'page';
  selectedPageId?: string;
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
    fixedHeader?: boolean;
    advancedOptions?: HeaderAdvancedOptions;
    menuIcon?: string;
    showButton?: boolean;
    buttonText?: string;
    buttonAction?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonSize?: 'sm' | 'md' | 'lg';
    buttonBorderRadius?: number;
    buttonShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    buttonBorderColor?: string;
    buttonBorderWidth?: number;
    buttonWidth?: string;
    buttonHeight?: string;
    buttonPosition?: 'left' | 'center' | 'right';
    buttonDropdown?: boolean;
    buttonDropdownItems?: Array<{id: string; label: string; url: string}>;
    buttonUrlType?: 'custom' | 'page';
    selectedPageId?: string;
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
  fixedHeader: initialFixedHeader = false,
  advancedOptions: initialAdvancedOptions = {},
  menuIcon: initialMenuIcon = 'Menu',
  showButton: initialShowButton = false,
  buttonText: initialButtonText = '',
  buttonAction: initialButtonAction = '',
  buttonColor: initialButtonColor = '',
  buttonTextColor: initialButtonTextColor = '',
  buttonSize: initialButtonSize = 'md',
  buttonBorderRadius: initialButtonBorderRadius = 0,
  buttonShadow: initialButtonShadow = 'none',
  buttonBorderColor: initialButtonBorderColor = '',
  buttonBorderWidth: initialButtonBorderWidth = 0,
  buttonWidth: initialButtonWidth = '',
  buttonHeight: initialButtonHeight = '',
  buttonPosition: initialButtonPosition = 'center',
  buttonDropdown: initialButtonDropdown = false,
  buttonDropdownItems: initialButtonDropdownItems = [],
  buttonUrlType: initialButtonUrlType = 'custom',
  selectedPageId: initialSelectedPageId = '',
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
  const [menuIcon, setMenuIcon] = useState(initialMenuIcon);
  
  // Nuevos estados para las opciones
  const [transparency, setTransparency] = useState(initialTransparency);
  const [headerSize, setHeaderSize] = useState<HeaderSize>(initialHeaderSize);
  const [menuAlignment, setMenuAlignment] = useState<MenuAlignment>(initialMenuAlignment);
  const [menuButtonStyle, setMenuButtonStyle] = useState<MenuButtonStyle>(initialMenuButtonStyle);
  const [mobileMenuStyle, setMobileMenuStyle] = useState<MobileMenuStyle>(initialMobileMenuStyle);
  const [mobileMenuPosition, setMobileMenuPosition] = useState<MobileMenuPosition>(initialMobileMenuPosition);
  const [transparentHeader, setTransparentHeader] = useState(initialTransparentHeader);
  const [borderBottom, setBorderBottom] = useState(initialBorderBottom);
  const [fixedHeader, setFixedHeader] = useState(initialFixedHeader);
  const [advancedOptions, setAdvancedOptions] = useState<HeaderAdvancedOptions>(initialAdvancedOptions);
  
  // Estado para mostrar/ocultar opciones avanzadas en el panel de edición
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Button configuration states
  const [showButton, setShowButton] = useState(initialShowButton);
  const [buttonText, setButtonText] = useState(initialButtonText);
  const [buttonAction, setButtonAction] = useState(initialButtonAction);
  const [buttonColor, setButtonColor] = useState(initialButtonColor);
  const [buttonTextColor, setButtonTextColor] = useState(initialButtonTextColor);
  const [buttonSize, setButtonSize] = useState<'sm' | 'md' | 'lg'>(initialButtonSize);
  const [buttonBorderRadius, setButtonBorderRadius] = useState(initialButtonBorderRadius);
  const [buttonShadow, setButtonShadow] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(initialButtonShadow);
  const [buttonBorderColor, setButtonBorderColor] = useState(initialButtonBorderColor);
  const [buttonBorderWidth, setButtonBorderWidth] = useState(initialButtonBorderWidth);
  const [buttonWidth, setButtonWidth] = useState(initialButtonWidth);
  const [buttonHeight, setButtonHeight] = useState(initialButtonHeight);
  const [buttonPosition] = useState<'left' | 'center' | 'right'>(initialButtonPosition);
  const [buttonDropdown] = useState(initialButtonDropdown);
  const [buttonDropdownItems] = useState<Array<{id: string; label: string; url: string}>>(initialButtonDropdownItems);
  const [isButtonDropdownOpen, setIsButtonDropdownOpen] = useState(false);
  
  // Debounced button preview states to prevent focus loss
  const [debouncedButtonText, setDebouncedButtonText] = useState(initialButtonText);
  const [debouncedButtonColor, setDebouncedButtonColor] = useState(initialButtonColor);
  const [debouncedButtonTextColor, setDebouncedButtonTextColor] = useState(initialButtonTextColor);
  const [debouncedButtonSize, setDebouncedButtonSize] = useState<'sm' | 'md' | 'lg'>(initialButtonSize);
  const [debouncedButtonBorderRadius, setDebouncedButtonBorderRadius] = useState(initialButtonBorderRadius);
  const [debouncedButtonShadow, setDebouncedButtonShadow] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>(initialButtonShadow);
  const [debouncedButtonBorderColor, setDebouncedButtonBorderColor] = useState(initialButtonBorderColor);
  const [debouncedButtonBorderWidth, setDebouncedButtonBorderWidth] = useState(initialButtonBorderWidth);
  const [debouncedButtonWidth, setDebouncedButtonWidth] = useState(initialButtonWidth);
  const [debouncedButtonHeight, setDebouncedButtonHeight] = useState(initialButtonHeight);
  
  // Debounce timeout for button preview
  const buttonPreviewDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Debounce button preview updates to prevent focus loss
  useEffect(() => {
    if (buttonPreviewDebounceRef.current) {
      clearTimeout(buttonPreviewDebounceRef.current);
    }
    
    
    buttonPreviewDebounceRef.current = setTimeout(() => {
      setDebouncedButtonText(buttonText);
      setDebouncedButtonColor(buttonColor);
      setDebouncedButtonTextColor(buttonTextColor);
      setDebouncedButtonSize(buttonSize);
      setDebouncedButtonBorderRadius(buttonBorderRadius);
      setDebouncedButtonShadow(buttonShadow);
      setDebouncedButtonBorderColor(buttonBorderColor);
      setDebouncedButtonBorderWidth(buttonBorderWidth);
      setDebouncedButtonWidth(buttonWidth);
      setDebouncedButtonHeight(buttonHeight);
    }, 500); // 500ms delay for preview updates
    
    return () => {
      if (buttonPreviewDebounceRef.current) {
        clearTimeout(buttonPreviewDebounceRef.current);
      }
    };
  }, [buttonText, buttonColor, buttonTextColor, buttonSize, buttonBorderRadius, 
      buttonShadow, buttonBorderColor, buttonBorderWidth, buttonWidth, buttonHeight]);
  
  // New states for page selection
  const [availablePages, setAvailablePages] = useState<Array<{id: string; title: string; slug: string}>>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  
  // New states for button URL type selection
  const [buttonUrlType, setButtonUrlType] = useState<'custom' | 'page'>(initialButtonUrlType);
  const [selectedPageId, setSelectedPageId] = useState<string>(initialSelectedPageId);
  
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || 'en';
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Detect if we're in edit mode (URL contains /edit)
  const isInEditMode = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-save timeout - Removed: Only save on page save
  // const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

    // Function to save header style to the database with optimistic UI - Removed: Only save on page save
    /*
    const saveHeaderStyle = useCallback(async () => {
      if (!localMenuId) {
        setSaveStatus('error');
        setSaveMessage('No menu selected');
        return;
      }
      
      // Clear auto-save timeout since we're manually saving
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      setIsSaving(true);
      setSaveStatus('saving');
      setSaveMessage('Saving header style...');
      
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
          fixedHeader,
          advancedOptions: advancedOptions || {} // Ensure advancedOptions is always an object
        };
        
        // Save the header style using the GraphQL client
        const result = await cmsOperations.updateHeaderStyle(localMenuId, headerStyleData);
        
        if (result.success) {
          console.log('Header style saved successfully:', result.headerStyle);
          setSaveStatus('success');
          setSaveMessage('Header style saved successfully!');
          setHasUnsavedChanges(false);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSaveStatus('idle');
            setSaveMessage('');
          }, 3000);
        } else {
          console.error('Failed to save header style:', result.message);
          setSaveStatus('error');
          setSaveMessage(result.message || 'Failed to save header style');
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            setSaveStatus('idle');
            setSaveMessage('');
          }, 5000);
        }
      } catch (error) {
        console.error('Error saving header style:', error);
        setSaveStatus('error');
        setSaveMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 5000);
      } finally {
        setIsSaving(false);
      }
    }, [localMenuId, transparency, headerSize, menuAlignment, menuButtonStyle, 
        mobileMenuStyle, mobileMenuPosition, transparentHeader, borderBottom, fixedHeader, advancedOptions,
        setSaveStatus, setSaveMessage, setIsSaving, setHasUnsavedChanges]);
    */
  
  
  // Check if we're in edit mode on mount and URL changes
  useEffect(() => {
    const checkEditMode = () => {
      const url = window.location.pathname;
      isInEditMode.current = url.includes('/edit');
      console.log('Edit Mode Detection:', {
        url,
        isInEditMode: isInEditMode.current
      });
    };
    
    // Initial check
    checkEditMode();
    
    // Listen for URL changes (for SPA navigation)
    const handlePopState = () => {
      checkEditMode();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Load available menus when in editing mode OR when we have a menuId to load
  useEffect(() => {
    const fetchMenus = async () => {
      setLoadingMenus(true);
      try {
        console.log('HeaderSection: Starting to fetch menus...');
        const menusData = await cmsOperations.getMenus();
        console.log('HeaderSection: Received menus data:', menusData);
        
        if (Array.isArray(menusData)) {
          setMenus(menusData as Menu[]);
          console.log('HeaderSection: Set menus successfully, count:', menusData.length);
          
          // If we have a menuId, find and set the selected menu
          if (localMenuId) {
            console.log('HeaderSection: Attempting to load menu with ID:', localMenuId);
            
            try {
            // Use the new function to get menu with header style
            const menuWithStyle = await cmsOperations.getMenuWithHeaderStyle(localMenuId);
            
            if (menuWithStyle) {
                console.log(`HeaderSection: Found menu with ID ${localMenuId} with header style:`, menuWithStyle);
              setSelectedMenu(menuWithStyle as Menu);
              
                // Load header style if available and in editing mode
                if (isEditing && menuWithStyle.headerStyle) {
                const style = menuWithStyle.headerStyle;
                  console.log('HeaderSection: Loading header style:', style);
                setTransparency(style.transparency || 0);
                setHeaderSize((style.headerSize as HeaderSize) || 'md');
                setMenuAlignment((style.menuAlignment as MenuAlignment) || 'right');
                setMenuButtonStyle((style.menuButtonStyle as MenuButtonStyle) || 'default');
                setMobileMenuStyle((style.mobileMenuStyle as MobileMenuStyle) || 'dropdown');
                setMobileMenuPosition((style.mobileMenuPosition as MobileMenuPosition) || 'right');
                setTransparentHeader(style.transparentHeader || false);
                setBorderBottom(style.borderBottom || false);
                setFixedHeader(style.fixedHeader || false);
                setAdvancedOptions((style.advancedOptions as HeaderAdvancedOptions) || {});
              }
            } else {
                console.log('HeaderSection: Menu with header style not found, trying fallback...');
              // Fallback to find menu by ID in the list
              const foundMenu = menusData.find((menu) => menu.id === localMenuId);
              if (foundMenu) {
                  console.log('HeaderSection: Found menu in fallback:', foundMenu);
                setSelectedMenu(foundMenu as Menu);
                } else {
                  console.warn('HeaderSection: Menu not found in fallback either, menuId:', localMenuId);
                }
              }
            } catch (menuError) {
              console.error('HeaderSection: Error loading specific menu:', menuError);
              // Try fallback even if specific menu loading fails
              const foundMenu = menusData.find((menu) => menu.id === localMenuId);
              if (foundMenu) {
                console.log('HeaderSection: Using fallback menu after error:', foundMenu);
                setSelectedMenu(foundMenu as Menu);
              }
            }
          }
        } else {
          console.warn('HeaderSection: Menus data is not an array:', menusData);
        }
      } catch (error) {
        console.error('HeaderSection: Error fetching menus:', error);
        // Provide more detailed error information
        if (error instanceof Error) {
          console.error('HeaderSection: Error message:', error.message);
          console.error('HeaderSection: Error stack:', error.stack);
        }
      } finally {
        setLoadingMenus(false);
        console.log('HeaderSection: Finished loading menus');
      }
    };

    const fetchPages = async () => {
      setLoadingPages(true);
      try {
        const pagesData = await cmsOperations.getAllPages();
        if (Array.isArray(pagesData)) {
          setAvailablePages(pagesData.map(page => ({
            id: page.id,
            title: page.title,
            slug: page.slug
          })));
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setLoadingPages(false);
      }
    };

    // Always fetch menus if we have a menuId, or if we're in editing mode
    if (localMenuId || isEditing) {
      fetchMenus();
    }
    
    // Only fetch pages in editing mode
    if (isEditing) {
      fetchPages();
    }
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
  
  // Auto-save functionality - Removed: Only save on page save
  /*
  useEffect(() => {
    if (hasUnsavedChanges && localMenuId) {
      // Clear existing timeout
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      // Set new timeout for auto-save
      autoSaveRef.current = setTimeout(() => {
        saveHeaderStyle();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }
    
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [hasUnsavedChanges, localMenuId, saveHeaderStyle]);
  */
  
  // Initialize currentValuesRef with current values
  const currentValuesRef = useRef({
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
    fixedHeader,
    advancedOptions,
    menuIcon,
    showButton,
    buttonText,
    buttonAction,
    buttonColor,
    buttonTextColor,
    buttonSize,
    buttonBorderRadius,
    buttonShadow,
    buttonBorderColor,
    buttonBorderWidth,
    buttonWidth,
    buttonHeight,
    buttonPosition,
    buttonDropdown,
    buttonDropdownItems,
    buttonUrlType,
    selectedPageId
  });

  const handleUpdateField = useCallback((field: string, value: string | number | boolean | Record<string, unknown> | Array<{id: string; label: string; url: string}>) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Update the ref with the new value immediately
      currentValuesRef.current = {
        ...currentValuesRef.current,
        [field]: value
      };
      
      // Get current values from ref to avoid dependency issues
      const currentValues = currentValuesRef.current;
      
      // Prepare data to update
      const updateData = {
        title: currentValues.localTitle,
        subtitle: currentValues.localSubtitle,
        menuId: currentValues.localMenuId,
        logoUrl: currentValues.logoUrl,
        transparency: currentValues.transparency,
        headerSize: currentValues.headerSize,
        menuAlignment: currentValues.menuAlignment,
        menuButtonStyle: currentValues.menuButtonStyle,
        mobileMenuStyle: currentValues.mobileMenuStyle,
        mobileMenuPosition: currentValues.mobileMenuPosition,
        transparentHeader: currentValues.transparentHeader,
        borderBottom: currentValues.borderBottom,
        fixedHeader: currentValues.fixedHeader,
        advancedOptions: currentValues.advancedOptions,
        menuIcon: currentValues.menuIcon,
        showButton: currentValues.showButton,
        buttonText: currentValues.buttonText,
        buttonAction: currentValues.buttonAction,
        buttonColor: currentValues.buttonColor,
        buttonTextColor: currentValues.buttonTextColor,
        buttonSize: currentValues.buttonSize,
        buttonBorderRadius: currentValues.buttonBorderRadius,
        buttonShadow: currentValues.buttonShadow,
        buttonBorderColor: currentValues.buttonBorderColor,
        buttonBorderWidth: currentValues.buttonBorderWidth,
        buttonWidth: currentValues.buttonWidth,
        buttonHeight: currentValues.buttonHeight,
        buttonPosition: currentValues.buttonPosition,
        buttonDropdown: currentValues.buttonDropdown,
        buttonDropdownItems: currentValues.buttonDropdownItems,
        buttonUrlType: currentValues.buttonUrlType,
        selectedPageId: currentValues.selectedPageId
      };
      
      // Update the specific field with the new value
      (updateData as Record<string, unknown>)[field] = value;
      
      // Set up a debounced update
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        // Reset the editing ref after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 300);
      }, 500);
    }
  }, [onUpdate]); // Only depend on onUpdate
  
  // Clean up on unmount - Updated: Only cleanup debounce since auto-save is removed
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Auto-save cleanup removed since auto-save functionality is disabled
      /*
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      */
    };
  }, []);
  
  // Individual change handlers with optimistic UI
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
    //setHasUnsavedChanges(true);
    
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
      setFixedHeader(style.fixedHeader || false);
      
      if (style.advancedOptions) {
        setAdvancedOptions(style.advancedOptions as HeaderAdvancedOptions);
      }
    }
    
    handleUpdateField('menuId', menuId);
  };

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
    // Removed: setHasUnsavedChanges(true) since save functionality is disabled
    handleUpdateField('backgroundColor', color);
  }, [handleUpdateField]);

  const handleTextColorChange = useCallback((color: string) => {
    setTextColor(color);
    // Removed: setHasUnsavedChanges(true) since save functionality is disabled
    handleUpdateField('textColor', color);
  }, [handleUpdateField]);
  
  const handleLogoUrlChange = useCallback((newValue: string) => {
    setLogoUrl(newValue);
    // Removed: setHasUnsavedChanges(true) since save functionality is disabled
    handleUpdateField('logoUrl', newValue);
    setShowMediaSelector(false);
  }, [handleUpdateField]);
  
  const toggleDropdown = useCallback((itemId: string) => {
    setIsDropdownOpen(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Handle navigation with instant loading
  const handleNavigation = useCallback((e: React.MouseEvent, targetHref: string) => {
    // Only handle internal navigation
    if (targetHref.startsWith('/') && !targetHref.startsWith('//')) {
      e.preventDefault();
      
      // Use Next.js router for navigation
      router.push(targetHref);
    }
    // For external links, let the default behavior happen
  }, [router]);
  
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
            <a
              href={href}
              target={item.target || "_self"}
              className={`text-sm font-medium block ${linkStyles}`}
              style={{ color: textColor }}
              onClick={(e) => {
                handleNavigation(e, href);
                // Close mobile menu when clicking on a link
                if (isDropdownOpen.mobileMenu) {
                  setIsDropdownOpen(prev => ({...prev, mobileMenu: false}));
                }
              }}
            >
              {item.title}
            </a>
          )}
        </li>
      );
    });
  };
  
  // Replace the MediaLibrary implementation with MediaSelector
  // Update the media selector related code
  const handleMediaSelection = (mediaItem: MediaItem) => {
    setLogoUrl(mediaItem.fileUrl);
    handleLogoUrlChange(mediaItem.fileUrl);
    setShowMediaSelector(false);
  };

  // Agregar handlers para las nuevas opciones
  const handleTransparentHeaderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setTransparentHeader(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('transparentHeader', newValue);
  }, [handleUpdateField]);

  const handleBorderBottomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setBorderBottom(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('borderBottom', newValue);
  }, [handleUpdateField]);

  const handleFixedHeaderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setFixedHeader(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('fixedHeader', newValue);
  }, [handleUpdateField]);

  const handleMenuAlignmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'center' | 'right';
    setMenuAlignment(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('menuAlignment', newValue);
  }, [handleUpdateField]);

  const handleMenuButtonStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'default' | 'filled' | 'outline';
    setMenuButtonStyle(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('menuButtonStyle', newValue);
  }, [handleUpdateField]);

  const handleMobileMenuStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'fullscreen' | 'dropdown' | 'sidebar';
    setMobileMenuStyle(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('mobileMenuStyle', newValue);
  }, [handleUpdateField]);

  const handleMobileMenuPositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'right';
    setMobileMenuPosition(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('mobileMenuPosition', newValue);
  }, [handleUpdateField]);

  // Add handlers for transparency and headerSize
  const handleTransparencyChange = useCallback((transparency: number) => {
    setTransparency(transparency);
    //setHasUnsavedChanges(true);
    handleUpdateField('transparency', transparency.toString());
  }, [handleUpdateField]);
  
  const handleHeaderSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as HeaderSize;
    setHeaderSize(newValue);
    //setHasUnsavedChanges(true);
    handleUpdateField('headerSize', newValue);
  }, [handleUpdateField]);
  
  // Advanced options handlers
  const handleAdvancedOptionChange = useCallback((key: string, value: string | number | boolean) => {
    const updatedOptions = {
      ...advancedOptions,
      [key]: value
    };
    setAdvancedOptions(updatedOptions);
    //setHasUnsavedChanges(true);
    // Pass the object directly instead of stringifying it
    handleUpdateField('advancedOptions', updatedOptions);
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

  // Debug logging for logo URL
  useEffect(() => {
    if (logoUrl) {
      console.log('HeaderSection: Logo URL updated:', logoUrl);
    }
  }, [logoUrl]);

  // Separating components for modularity
  const LogoSelector = () => {
    const [showPreview, setShowPreview] = useState(false);
    
    return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Logo</label>
      <div className="flex flex-col sm:flex-row items-start gap-2">
        <div 
          className="border rounded-md h-20 w-20 flex items-center justify-center overflow-hidden bg-gray-50"
        >
            {logoUrl && showPreview ? (
            <div className="h-10 w-10 flex-shrink-0" data-field-type="logoUrl" data-component-type="Header">
              <S3FilePreview
                src={logoUrl} 
                alt="Logo"
                className="max-h-full max-w-full object-contain" 
                width={80}
                height={80}
              />
            </div>
            ) : logoUrl ? (
              <div className="text-gray-400 text-sm text-center">
                Logo selected<br/>
                <button 
                  onClick={() => setShowPreview(true)}
                  className="text-blue-500 hover:underline text-xs mt-1"
                >
                  View
                </button>
              </div>
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No logo<br/>selected
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowMediaSelector(true)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Select Logo
            </button>
            {logoUrl && (
                <>
                  {showPreview && (
              <button 
                      onClick={() => setShowPreview(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      Hide Preview
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      handleLogoUrlChange('');
                      setShowPreview(false);
                    }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Remove
              </button>
                </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Select an image from your media library or enter a URL
          </div>
        </div>
      </div>
    </div>
  );
  };

  const MenuSelector = () => (
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
    </div>
  );

  // Improved StyleOptions component with better organization
  const StyleOptions = () => (
    <div className="space-y-6">
      {/* Layout & Behavior Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Layout & Behavior
        </h4>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="transparentHeader"
              checked={transparentHeader}
              onChange={handleTransparentHeaderChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="transparentHeader" className="text-sm font-medium">
              Transparent background (changes on scroll)
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="borderBottom"
              checked={borderBottom}
              onChange={handleBorderBottomChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="borderBottom" className="text-sm font-medium">
              Show border at bottom
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="fixedHeader"
              checked={fixedHeader}
              onChange={handleFixedHeaderChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="fixedHeader" className="text-sm font-medium">
              Fixed position (stays at top when scrolling)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="headerSize" className="text-sm font-medium block mb-2">
              Header Size
            </label>
            <select
              id="headerSize"
              value={headerSize}
              onChange={handleHeaderSizeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="transparency" className="text-sm font-medium block mb-2">
              Background Transparency
            </label>
            <TransparencySelector
              value={transparency}
              onChange={handleTransparencyChange}
            />
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Colors
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ColorSelector
              label="Background Color"
              value={backgroundColor}
              onChange={handleBackgroundColorChange}
            />
          </div>
          
          <div>
            <ColorSelector
              label="Text Color"
              value={textColor}
              onChange={handleTextColorChange}
            />
          </div>
        </div>
      </div>

      {/* Menu Configuration Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Menu Configuration
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="menuAlignment" className="text-sm font-medium block mb-2">
              Menu Alignment
            </label>
            <select
              id="menuAlignment"
              value={menuAlignment}
              onChange={handleMenuAlignmentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="menuButtonStyle" className="text-sm font-medium block mb-2">
              Menu Button Style
            </label>
            <select
              id="menuButtonStyle"
              value={menuButtonStyle}
              onChange={handleMenuButtonStyleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="filled">Filled</option>
              <option value="outline">Outline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Menu Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Mobile Menu
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mobileMenuStyle" className="text-sm font-medium block mb-2">
              Mobile Menu Style
            </label>
            <select
              id="mobileMenuStyle"
              value={mobileMenuStyle}
              onChange={handleMobileMenuStyleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dropdown">Dropdown</option>
              <option value="fullscreen">Fullscreen</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="mobileMenuPosition" className="text-sm font-medium block mb-2">
              Sidebar Position (mobile)
            </label>
            <select
              id="mobileMenuPosition"
              value={mobileMenuPosition}
              onChange={handleMobileMenuPositionChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>

      {/* Button Design Section */}
      {showButton && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Button Design
          </h4>
          
          {/* Button Position and Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="buttonPosition" className="text-sm font-medium block mb-2">
                Button Position
              </label>
              <select
                id="buttonPosition"
                value={buttonPosition}
                onChange={(e) => {
                  const newValue = e.target.value as 'left' | 'center' | 'right';
                  handleUpdateField('buttonPosition', newValue);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="buttonSize" className="text-sm font-medium block mb-2">
                Button Size
              </label>
              <select
                id="buttonSize"
                value={buttonSize}
                onChange={handleButtonSizeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="buttonShadow" className="text-sm font-medium block mb-2">
                Shadow
              </label>
              <select
                id="buttonShadow"
                value={buttonShadow}
                onChange={handleButtonShadowChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
          </div>
          
          {/* Button Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ColorSelector
                label="Button Background Color"
                value={buttonColor}
                onChange={handleButtonColorChange}
              />
            </div>
            
            <div>
              <ColorSelector
                label="Button Text Color"
                value={buttonTextColor}
                onChange={handleButtonTextColorChange}
              />
            </div>
          </div>
          
          {/* Button Styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buttonBorderRadius" className="text-sm font-medium block mb-2">
                Border Radius (px)
              </label>
              <StableInput
                value={buttonBorderRadius.toString()}
                onChange={(newValue: string) => {
                  const numValue = parseInt(newValue) || 0;
                  setButtonBorderRadius(numValue);
                  handleUpdateField('buttonBorderRadius', numValue);
                }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                debounceTime={300}
                data-field-id="buttonBorderRadius"
                data-component-type="Header"
              />
              <p className="text-xs text-gray-500 mt-1">
                Range: 0-50px
              </p>
            </div>
            
            <div>
              <label htmlFor="buttonBorderWidth" className="text-sm font-medium block mb-2">
                Border Width (px)
              </label>
              <StableInput
                value={buttonBorderWidth.toString()}
                onChange={(newValue: string) => {
                  const numValue = parseInt(newValue) || 0;
                  setButtonBorderWidth(numValue);
                  handleUpdateField('buttonBorderWidth', numValue);
                }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                debounceTime={300}
                data-field-id="buttonBorderWidth"
                data-component-type="Header"
              />
              <p className="text-xs text-gray-500 mt-1">
                Range: 0-10px
              </p>
            </div>
          </div>
          
          {/* Border Color */}
          {buttonBorderWidth > 0 && (
            <div>
              <ColorSelector
                label="Border Color"
                value={buttonBorderColor}
                onChange={handleButtonBorderColorChange}
              />
            </div>
          )}
          
          {/* Button Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buttonWidth" className="text-sm font-medium block mb-2">
                Custom Width (optional)
              </label>
              <StableInput
                value={buttonWidth}
                onChange={(newValue: string) => {
                  setButtonWidth(newValue);
                  handleUpdateField('buttonWidth', newValue);
                }}
                placeholder="auto, 120px, 100%"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                debounceTime={300}
                data-field-id="buttonWidth"
                data-component-type="Header"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for auto width
              </p>
            </div>
            
            <div>
              <label htmlFor="buttonHeight" className="text-sm font-medium block mb-2">
                Custom Height (optional)
              </label>
              <StableInput
                value={buttonHeight}
                onChange={(newValue: string) => {
                  setButtonHeight(newValue);
                  handleUpdateField('buttonHeight', newValue);
                }}
                placeholder="auto, 40px, 3rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                debounceTime={300}
                data-field-id="buttonHeight"
                data-component-type="Header"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for auto height
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const MenuIconSelector = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Menu Icon</label>
      <div className="flex flex-col sm:flex-row items-start gap-2">
        <IconSelector 
          selectedIcon={menuIcon} 
          onSelectIcon={setMenuIcon} 
          className="w-full" 
        />
        <div className="text-xs text-gray-500 mt-1">
          This icon will be used for the mobile menu button
        </div>
      </div>
    </div>
  );

  const ButtonConfiguration = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
        Header Button Configuration
      </h4>
      
      {/* Enable Button */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showButton"
          checked={showButton}
          onChange={handleShowButtonChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showButton" className="text-sm font-medium">
          Show Button in Header
        </label>
      </div>
      
      {showButton && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-200">
          {/* Button Text */}
          <div>
            <label htmlFor="buttonText" className="text-sm font-medium block mb-2">
              Button Text
            </label>
            <StableInput
              value={buttonText}
              onChange={(newValue: string) => {
                setButtonText(newValue);
                handleUpdateField('buttonText', newValue);
              }}
              placeholder="Get Started"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              debounceTime={300}
              data-field-id="buttonText"
              data-component-type="Header"
            />
          </div>
          
          {/* URL Type Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Button URL/Action
            </label>
            <div className="space-y-3">
              {/* URL Type Radio Buttons */}
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="buttonUrlType"
                    value="custom"
                    checked={buttonUrlType === 'custom'}
                    onChange={() => {
                      setButtonUrlType('custom');
                      handleUpdateField('buttonUrlType', 'custom');
                    }}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Custom URL</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="buttonUrlType"
                    value="page"
                    checked={buttonUrlType === 'page'}
                    onChange={() => {
                      setButtonUrlType('page');
                      handleUpdateField('buttonUrlType', 'page');
                    }}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Existing Page</span>
                </label>
              </div>
              
              {/* Custom URL Input */}
              {buttonUrlType === 'custom' && (
                <div>
                  <StableInput
                    value={buttonAction}
                    onChange={(newValue: string) => {
                      setButtonAction(newValue);
                      handleUpdateField('buttonAction', newValue);
                    }}
                    placeholder="/contact"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    debounceTime={300}
                    data-field-id="buttonAction"
                    data-component-type="Header"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use relative URLs (/contact) or absolute URLs (https://example.com)
                  </p>
                </div>
              )}
              
              {/* Existing Page Selection */}
              {buttonUrlType === 'page' && (
                <div>
                  <select
                    value={selectedPageId}
                    onChange={(e) => {
                      const pageId = e.target.value;
                      setSelectedPageId(pageId);
                      
                      // Find the selected page and set the button action to its slug
                      const selectedPage = availablePages.find(page => page.id === pageId);
                      if (selectedPage) {
                        const pageUrl = `/${selectedPage.slug}`;
                        setButtonAction(pageUrl);
                        handleUpdateField('buttonAction', pageUrl);
                        handleUpdateField('selectedPageId', pageId);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingPages}
                  >
                    <option value="">Select a page...</option>
                    {availablePages.map(page => (
                      <option key={page.id} value={page.id}>
                        {page.title} (/{page.slug})
                      </option>
                    ))}
                  </select>
                  {loadingPages && (
                    <p className="text-xs text-gray-500 mt-1">Loading pages...</p>
                  )}
                  {!loadingPages && availablePages.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No pages available</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Button Preview */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Button Preview</label>
              
            </div>
            <div className="p-4 bg-gray-50 rounded-md flex justify-center relative">
              {renderHeaderButton()}
              
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ✨ Preview updates automatically after you stop typing to prevent focus loss
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const AdvancedOptions = () => (
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
            <StableInput
              value={advancedOptions?.customClass || ''}
              onChange={(newValue: string) => handleAdvancedOptionChange('customClass', newValue)}
              placeholder="e.g. my-header-class"
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              debounceTime={300}
              data-field-id="customClass"
              data-component-type="Header"
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
  );

  const HeaderPreview = () => {
    const [showLogoPreview, setShowLogoPreview] = useState(false);
    
    return (
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {logoUrl && (
                    <div className="h-10 w-10 flex-shrink-0 border rounded bg-gray-50 flex items-center justify-center" data-field-type="logoUrl" data-component-type="Header">
                      {showLogoPreview ? (
                    <S3FilePreview
                      src={logoUrl} 
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                      width={80}
                      height={80}
                    />
                      ) : (
                        <button 
                          onClick={() => setShowLogoPreview(true)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View Logo
                        </button>
                      )}
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
              <div className="flex flex-wrap gap-2 sm:gap-4">
                  {loadingMenus ? (
                    <div className="text-sm text-gray-500 flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading menu...
                    </div>
                  ) : selectedMenu && selectedMenu.items && selectedMenu.items.length > 0 ? (
                    selectedMenu.items.slice(0, 4).map(item => (
                  <div key={item.id} className="text-sm font-medium">{item.title}</div>
                    ))
                  ) : localMenuId ? (
                    <div className="text-sm text-red-500">
                      ⚠️ Menu not found (ID: {localMenuId})
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No menu selected
                    </div>
                  )}
                {selectedMenu && selectedMenu.items && selectedMenu.items.length > 4 && (
                  <div className="text-sm font-medium">+ {selectedMenu.items.length - 4} más</div>
                )}
              </div>
            </div>
            {fixedHeader && (
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                ✓ Posición fija - el header se mantendrá al hacer scroll
              </div>
            )}
              {/* Debug information */}
              {isEditing && (
                <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded border-t">
                  <strong>Debug Info:</strong><br/>
                  Menu ID: {localMenuId || 'None'}<br/>
                  Selected Menu: {selectedMenu ? selectedMenu.name : 'None'}<br/>
                  Menu Items: {selectedMenu?.items?.length || 0}<br/>
                  Loading: {loadingMenus ? 'Yes' : 'No'}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
  };

  // Function to render the menu icon
  const renderMenuIcon = () => {
    if (menuIcon === 'PaperAirplaneIcon') {
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    }
    
    const IconComponent = LucideIcons[menuIcon as keyof typeof LucideIcons] as React.ElementType || LucideIcons.Menu;
    return <IconComponent className="h-6 w-6" />;
  };

  // Function to render the configurable button
  const renderHeaderButton = useCallback(() => {
    if (!showButton || !debouncedButtonText) return null;

    const buttonSizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    const buttonStyle: React.CSSProperties = {
      backgroundColor: debouncedButtonColor || '#3B82F6',
      color: debouncedButtonTextColor || '#FFFFFF',
      borderRadius: `${debouncedButtonBorderRadius}px`,
      borderWidth: `${debouncedButtonBorderWidth}px`,
      borderColor: debouncedButtonBorderColor || 'transparent',
      borderStyle: debouncedButtonBorderWidth > 0 ? 'solid' : 'none',
      width: debouncedButtonWidth || 'auto',
      height: debouncedButtonHeight || 'auto',
      transition: 'all 0.2s ease-in-out'
    };

    const buttonClasses = `
      ${buttonSizeClasses[debouncedButtonSize]} 
      ${shadowClasses[debouncedButtonShadow]} 
      font-medium 
      transition-all 
      duration-200 
      hover:opacity-90 
      focus:outline-none 
      focus:ring-2 
      focus:ring-offset-2 
      focus:ring-blue-500
      relative
    `.trim();

    const handleButtonClick = (e: React.MouseEvent) => {
      if (buttonDropdown && buttonDropdownItems.length > 0) {
        e.preventDefault();
        setIsButtonDropdownOpen(!isButtonDropdownOpen);
      } else if (buttonAction) {
        if (buttonAction.startsWith('/')) {
          e.preventDefault();
          router.push(buttonAction);
        } else if (buttonAction.startsWith('http')) {
          window.open(buttonAction, '_blank');
        }
      }
    };

    return (
      <div className="relative">
        <button
          onClick={handleButtonClick}
          className={buttonClasses}
          style={buttonStyle}
          data-field-type="button"
          data-component-type="Header"
        >
          {debouncedButtonText}
          {buttonDropdown && buttonDropdownItems.length > 0 && (
            <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform duration-200 ${isButtonDropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Button Dropdown */}
        {buttonDropdown && buttonDropdownItems.length > 0 && isButtonDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            {buttonDropdownItems.map((item) => {
              // Determine the final URL
              let finalUrl = item.url;
              if (item.url.startsWith('page:')) {
                const pageSlug = item.url.replace('page:', '');
                finalUrl = pageSlug ? `/${locale}/${pageSlug}` : '#';
              }
              
              return (
                <a
                  key={item.id}
                  href={finalUrl}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  onClick={(e) => {
                    if (finalUrl.startsWith('/')) {
                      e.preventDefault();
                      router.push(finalUrl);
                    }
                    setIsButtonDropdownOpen(false);
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }, [showButton, debouncedButtonText, debouncedButtonColor, debouncedButtonTextColor, 
      debouncedButtonSize, debouncedButtonBorderRadius, debouncedButtonShadow, 
      debouncedButtonBorderColor, debouncedButtonBorderWidth, debouncedButtonWidth, 
      debouncedButtonHeight, buttonDropdown, buttonDropdownItems, isButtonDropdownOpen, 
      buttonAction, router, locale]);

  // Memoized header button component for the actual header (non-editing mode)
  const MemoizedHeaderButton = React.memo(() => {
    if (!showButton || !buttonText) return null;

    const buttonSizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    const buttonStyle: React.CSSProperties = {
      backgroundColor: buttonColor || '#3B82F6',
      color: buttonTextColor || '#FFFFFF',
      borderRadius: `${buttonBorderRadius}px`,
      borderWidth: `${buttonBorderWidth}px`,
      borderColor: buttonBorderColor || 'transparent',
      borderStyle: buttonBorderWidth > 0 ? 'solid' : 'none',
      width: buttonWidth || 'auto',
      height: buttonHeight || 'auto',
      transition: 'all 0.2s ease-in-out'
    };

    const buttonClasses = `
      ${buttonSizeClasses[buttonSize]} 
      ${shadowClasses[buttonShadow]} 
      font-medium 
      transition-all 
      duration-200 
      hover:opacity-90 
      focus:outline-none 
      focus:ring-2 
      focus:ring-offset-2 
      focus:ring-blue-500
      relative
    `.trim();

    const handleButtonClick = (e: React.MouseEvent) => {
      if (buttonDropdown && buttonDropdownItems.length > 0) {
        e.preventDefault();
        setIsButtonDropdownOpen(!isButtonDropdownOpen);
      } else if (buttonAction) {
        if (buttonAction.startsWith('/')) {
          e.preventDefault();
          router.push(buttonAction);
        } else if (buttonAction.startsWith('http')) {
          window.open(buttonAction, '_blank');
        }
      }
    };

    return (
      <div className="relative">
        <button
          onClick={handleButtonClick}
          className={buttonClasses}
          style={buttonStyle}
          data-field-type="button"
          data-component-type="Header"
        >
          {buttonText}
          {buttonDropdown && buttonDropdownItems.length > 0 && (
            <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform duration-200 ${isButtonDropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Button Dropdown */}
        {buttonDropdown && buttonDropdownItems.length > 0 && isButtonDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            {buttonDropdownItems.map((item) => {
              // Determine the final URL
              let finalUrl = item.url;
              if (item.url.startsWith('page:')) {
                const pageSlug = item.url.replace('page:', '');
                finalUrl = pageSlug ? `/${locale}/${pageSlug}` : '#';
              }
              
              return (
                <a
                  key={item.id}
                  href={finalUrl}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  onClick={(e) => {
                    if (finalUrl.startsWith('/')) {
                      e.preventDefault();
                      router.push(finalUrl);
                    }
                    setIsButtonDropdownOpen(false);
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  });

  // Add display name for debugging
  MemoizedHeaderButton.displayName = 'MemoizedHeaderButton';

  // Button change handlers
  const handleShowButtonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowButton(newValue);
    handleUpdateField('showButton', newValue);
  }, [handleUpdateField]);

  const handleButtonColorChange = useCallback((color: string) => {
    setButtonColor(color);
    handleUpdateField('buttonColor', color);
  }, [handleUpdateField]);

  const handleButtonTextColorChange = useCallback((color: string) => {
    setButtonTextColor(color);
    handleUpdateField('buttonTextColor', color);
  }, [handleUpdateField]);

  const handleButtonSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'sm' | 'md' | 'lg';
    setButtonSize(newValue);
    handleUpdateField('buttonSize', newValue);
  }, [handleUpdateField]);

  const handleButtonShadowChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'none' | 'sm' | 'md' | 'lg' | 'xl';
    setButtonShadow(newValue);
    handleUpdateField('buttonShadow', newValue);
  }, [handleUpdateField]);

  const handleButtonBorderColorChange = useCallback((color: string) => {
    setButtonBorderColor(color);
    handleUpdateField('buttonBorderColor', color);
  }, [handleUpdateField]);

  return (
    <>
      {isEditing ? (
        <Tabs defaultValue="details" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="flex flex-wrap space-x-2 w-full">
            <TabsTrigger value="details" className="flex-1 min-w-[100px]">Details</TabsTrigger>
            <TabsTrigger value="styles" className="flex-1 min-w-[100px]">Styles</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 min-w-[100px]">Preview</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-4">
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
            
            <LogoSelector />
            <MenuSelector />
            <MenuIconSelector />
            <ButtonConfiguration />
          </TabsContent>

          {/* STYLES TAB */}
          <TabsContent value="styles" className="space-y-4">
            <StyleOptions />
            <AdvancedOptions />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <HeaderPreview />
          </TabsContent>
          
          {/* Media selector modal */}
          {showMediaSelector && (
            <MediaSelector
              isOpen={showMediaSelector}
              onClose={() => setShowMediaSelector(false)}
              onSelect={handleMediaSelection}
              title="Select Logo"
            />
          )}
        </Tabs>
      ) : (
        <nav
          className={`w-full z-1000 transition-all duration-300 py-4 ${
            // Use sticky positioning in edit mode (preview containers), fixed in real pages
            isInEditMode.current && fixedHeader ? 'sticky top-0' : 
            !isEditing && !isInEditMode.current && fixedHeader ? 'fixed top-0 left-0 right-0' : 'relative'
          } ${
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
            color: textColor,
            // Use sticky positioning in edit mode (preview containers), fixed in real pages
            position: isInEditMode.current && fixedHeader ? 'sticky' : 
                     !isEditing && !isInEditMode.current && fixedHeader ? 'fixed' : 'relative',
            top: (isInEditMode.current && fixedHeader) || (!isEditing && !isInEditMode.current && fixedHeader) ? 0 : 'auto',
            left: !isEditing && !isInEditMode.current && fixedHeader ? 0 : 'auto',
            right: !isEditing && !isInEditMode.current && fixedHeader ? 0 : 'auto',
            zIndex: fixedHeader ? 1000 : 'auto'
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
                    // Only show menu loading/error messages in editing mode
                    // In non-editing mode, just don't render anything if menu is not found
                    isEditing && menuId && (
                      <div className="text-sm text-gray-500">
                        {loadingMenus ? "Loading menu..." : "Menu not found"}
                      </div>
                    )
                  )}
                </ul>
                
                {/* Header Button - positioned in center */}
                {showButton && buttonPosition === 'center' && (
                  <div className="mx-4">
                    <MemoizedHeaderButton />
                  </div>
                )}
              </div>

              {/* Right side - Button and Mobile menu */}
              <div className="flex items-center space-x-4">
                {/* Header Button - positioned on the right */}
                {showButton && buttonPosition === 'right' && <MemoizedHeaderButton />}

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
                      <LucideIcons.X className="h-6 w-6" />
                    ) : (
                      renderMenuIcon()
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Header Button - positioned on the left (below logo/title on mobile) */}
            {showButton && buttonPosition === 'left' && (
              <div className="mt-4 md:mt-0 md:absolute md:left-4 md:top-1/2 md:transform md:-translate-y-1/2">
                <MemoizedHeaderButton />
              </div>
            )}
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
                  mobileMenuStyle === 'sidebar' ? `top-0 bottom-0 h-screen w-[280px] bg-white shadow-xl ${
                    mobileMenuPosition === 'left' ? 'left-0 animate-slideInLeft' : 'right-0 animate-slideInRight'
                  }` :
                  'top-[4rem] left-0 right-0 bg-white/90 backdrop-blur-md shadow-lg animate-slideInDown'
                }`}
              >
                {(mobileMenuStyle === 'fullscreen' || mobileMenuStyle === 'sidebar') && (
                  <div className="flex justify-between items-center p-4 border-b">
                    {logoUrl && (
                      <div className="h-8 w-8">
                        <S3FilePreview
                          src={logoUrl}
                          alt={localTitle || "Logo"}
                          className="h-full w-auto object-contain"
                          width={32}
                          height={32}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setIsDropdownOpen(prev => ({ ...prev, mobileMenu: false }))}
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <LucideIcons.X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                <div className={`${
                  mobileMenuStyle === 'fullscreen' ? 'flex flex-col items-center justify-center h-full' : 
                  mobileMenuStyle === 'sidebar' ? 'p-4 overflow-y-auto max-h-screen' : 'p-4'
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
                                      <a
                                        key={child.id}
                                        href={childHref}
                                        target={child.target || "_self"}
                                        className={`block px-3 py-2 hover:bg-gray-100 rounded-md ${
                                          mobileMenuStyle === 'fullscreen' ? 'text-lg' : 'text-sm'
                                        }`}
                                        onClick={(e) => {
                                          handleNavigation(e, childHref);
                                          // Close dropdown and mobile menu when clicking a link
                                          setIsDropdownOpen(prev => ({
                                            ...prev,
                                            [item.id]: false,
                                            mobileMenu: false
                                          }));
                                        }}
                                      >
                                        {child.title}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <a
                              href={href}
                              target={item.target || "_self"}
                              className={`block px-3 py-2 hover:bg-gray-100 rounded-md ${
                                mobileMenuStyle === 'fullscreen' ? 'text-xl font-medium' : 'text-base'
                              }`}
                              onClick={(e) => {
                                handleNavigation(e, href);
                                // Close mobile menu when clicking a link
                                setIsDropdownOpen(prev => ({...prev, mobileMenu: false}));
                              }}
                            >
                              {item.title}
                            </a>
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