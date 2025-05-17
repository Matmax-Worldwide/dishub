'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Github 
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';

interface SocialLink {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github' | 'custom';
  url: string;
  icon?: string; // Para enlaces personalizados
  label?: string; // Para enlaces personalizados
}

interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    url: string;
  }>;
}

interface FooterSectionProps {
  logoUrl?: string;
  companyName: string;
  copyright?: string;
  socialLinks?: SocialLink[];
  columns?: FooterColumn[];
  menuId?: string;
  backgroundColor?: string;
  textColor?: string;
  showYear?: boolean;
  isEditing?: boolean;
  onUpdate?: (data: { 
    logoUrl?: string;
    companyName: string;
    copyright?: string;
    socialLinks?: SocialLink[];
    columns?: FooterColumn[];
    menuId?: string;
    backgroundColor?: string;
    textColor?: string;
    showYear?: boolean;
  }) => void;
}

// Definir un tipo para los campos válidos
type FooterField = keyof Omit<FooterSectionProps, 'isEditing' | 'onUpdate'>;
type FooterValues = FooterSectionProps[FooterField];

// Define simplified menu types that match what we get from the API
interface SimpleMenuItem {
  id: string;
  title: string;
  url?: string | null;
  pageId?: string | null;
  target?: string | null;
  page?: { slug: string } | null;
  children?: SimpleMenuItem[];
}

interface SimpleMenu {
  id: string;
  name: string;
  items: SimpleMenuItem[];
}

export default function FooterSection({ 
  logoUrl: initialLogoUrl = '',
  companyName: initialCompanyName = 'Company Name',
  copyright: initialCopyright = 'All rights reserved',
  socialLinks: initialSocialLinks = [],
  columns: initialColumns = [],
  menuId: initialMenuId = '',
  backgroundColor: initialBackgroundColor = '#111827',
  textColor: initialTextColor = '#f9fafb',
  showYear: initialShowYear = true,
  isEditing = false, 
  onUpdate 
}: FooterSectionProps) {
  // Local state to maintain during typing
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [copyright, setCopyright] = useState(initialCopyright);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks);
  const [columns, setColumns] = useState<FooterColumn[]>(initialColumns);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [showYear, setShowYear] = useState(initialShowYear);
  const [menuId, setMenuId] = useState(initialMenuId);
  const [menus, setMenus] = useState<SimpleMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<SimpleMenu | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(false);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load available menus when in editing mode
  useEffect(() => {
    const fetchMenus = async () => {
      if (!isEditing) return;
      
      setLoadingMenus(true);
      try {
        const menusData = await cmsOperations.getMenus();
        if (Array.isArray(menusData)) {
          setMenus(menusData);
          
          // If we have a menuId, find and set the selected menu
          if (menuId) {
            const menu = menusData.find(m => m.id === menuId);
            if (menu) {
              setSelectedMenu(menu);
            }
          }
        }
      } catch (error) {
        console.error('Error loading menus:', error);
      } finally {
        setLoadingMenus(false);
      }
    };
    
    fetchMenus();
  }, [isEditing, menuId]);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialLogoUrl !== logoUrl) setLogoUrl(initialLogoUrl);
      if (initialCompanyName !== companyName) setCompanyName(initialCompanyName);
      if (initialCopyright !== copyright) setCopyright(initialCopyright);
      if (initialSocialLinks !== socialLinks) setSocialLinks([...initialSocialLinks]);
      if (initialColumns !== columns) setColumns([...initialColumns]);
      if (initialBackgroundColor !== backgroundColor) setBackgroundColor(initialBackgroundColor);
      if (initialTextColor !== textColor) setTextColor(initialTextColor);
      if (initialShowYear !== showYear) setShowYear(initialShowYear);
      if (initialMenuId !== menuId) setMenuId(initialMenuId);
    }
  }, [
    initialLogoUrl, logoUrl,
    initialCompanyName, companyName,
    initialCopyright, copyright,
    initialSocialLinks, socialLinks,
    initialColumns, columns,
    initialBackgroundColor, backgroundColor,
    initialTextColor, textColor,
    initialShowYear, showYear,
    initialMenuId, menuId
  ]);
  
  // Optimize update handler with debouncing
  const handleUpdateField = useCallback(
    (field: FooterField, value: FooterValues) => {
      if (onUpdate) {
        // Mark that we're in editing mode
        isEditingRef.current = true;
        
        // Clear any pending debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        
        // Prepare data to update
        const updateData = {
          logoUrl,
          companyName,
          copyright,
          socialLinks,
          columns,
          menuId,
          backgroundColor,
          textColor,
          showYear,
        };
        
        // Update the specific field
        (updateData as Record<string, FooterValues>)[field] = value;
        
        // Set timeout to update parent
        debounceRef.current = setTimeout(() => {
          onUpdate(updateData);
          
          // Reset editing flag after a short delay
          setTimeout(() => {
            isEditingRef.current = false;
          }, 500);
        }, 300);
      }
    }, 
    [onUpdate, logoUrl, companyName, copyright, socialLinks, columns, menuId, backgroundColor, textColor, showYear]
  );
  
  // Individual change handlers
  const handleCompanyNameChange = useCallback((newValue: string) => {
    setCompanyName(newValue);
    handleUpdateField('companyName', newValue);
  }, [handleUpdateField]);
  
  const handleCopyrightChange = useCallback((newValue: string) => {
    setCopyright(newValue);
    handleUpdateField('copyright', newValue);
  }, [handleUpdateField]);
  
  const handleLogoUrlChange = useCallback((newValue: string) => {
    setLogoUrl(newValue);
    handleUpdateField('logoUrl', newValue);
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
  
  const handleShowYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowYear(newValue);
    handleUpdateField('showYear', newValue);
  }, [handleUpdateField]);

  // Add a new empty column
  const handleAddColumn = useCallback(() => {
    const newColumns = [...columns, { title: 'New Column', links: [] }];
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField]);

  // Add a new link to a column
  const handleAddLink = useCallback((columnIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links.push({ label: 'New Link', url: '#' });
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField]);

  // Update column title
  const handleColumnTitleChange = useCallback((columnIndex: number, newTitle: string) => {
    const newColumns = [...columns];
    newColumns[columnIndex].title = newTitle;
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField]);

  // Update link in a column
  const handleLinkChange = useCallback((columnIndex: number, linkIndex: number, field: 'label' | 'url', value: string) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links[linkIndex][field] = value;
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField]);

  // Remove a column
  const handleRemoveColumn = useCallback((columnIndex: number) => {
    const newColumns = columns.filter((_, index) => index !== columnIndex);
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField]);

  // Remove a link from a column
  const handleRemoveLink = useCallback((columnIndex: number, linkIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links = newColumns[columnIndex].links.filter((_, index) => index !== linkIndex);
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField]);

  // Add social link
  const handleAddSocialLink = useCallback(() => {
    const newSocialLinks: SocialLink[] = [...socialLinks, { type: 'facebook' as const, url: 'https://facebook.com' }];
    setSocialLinks(newSocialLinks);
    handleUpdateField('socialLinks', newSocialLinks);
  }, [socialLinks, handleUpdateField]);

  // Update social link
  const handleSocialLinkChange = useCallback((index: number, field: keyof SocialLink, value: string) => {
    const newSocialLinks = [...socialLinks];
    (newSocialLinks[index] as Record<keyof SocialLink, string>)[field] = value;
    setSocialLinks(newSocialLinks);
    handleUpdateField('socialLinks', newSocialLinks);
  }, [socialLinks, handleUpdateField]);

  // Remove social link
  const handleRemoveSocialLink = useCallback((index: number) => {
    const newSocialLinks = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(newSocialLinks);
    handleUpdateField('socialLinks', newSocialLinks);
  }, [socialLinks, handleUpdateField]);

  // Add menu change handler
  const handleMenuChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMenuId = e.target.value;
    setMenuId(newMenuId);
    
    // Find selected menu
    const menu = menus.find(m => m.id === newMenuId);
    setSelectedMenu(menu || null);
    
    // Update parent
    handleUpdateField('menuId', newMenuId);
  }, [menus, handleUpdateField]);

  // Render menu items for the footer
  const renderMenuItems = (items: SimpleMenuItem[]) => {
    if (!items || items.length === 0) return null;
    
    return items.map((item) => {
      // Determine the URL
      let href = '#';
      
      if (item.pageId && item.page?.slug) {
        // If the item has a pageId and the page object with slug, use that
        href = `/${locale}/${item.page.slug}`;
      } else if (item.url) {
        // Otherwise use the direct URL if available
        href = item.url;
      }
      
      return (
        <li key={item.id}>
          <Link 
            href={href}
            target={item.target || "_self"}
            className="text-sm hover:underline"
          >
            {item.title}
          </Link>
        </li>
      );
    });
  };

  // Render social icon based on type
  const renderSocialIcon = (type: SocialLink['type']) => {
    switch (type) {
      case 'facebook': return <Facebook size={20} />;
      case 'twitter': return <Twitter size={20} />;
      case 'instagram': return <Instagram size={20} />;
      case 'linkedin': return <Linkedin size={20} />;
      case 'youtube': return <Youtube size={20} />;
      case 'github': return <Github size={20} />;
      default: return <div>•</div>;
    }
  };

  return (
    <footer 
      className={cn(
        "w-full py-8", 
        isEditing ? "rounded-lg border border-dashed border-border" : ""
      )}
      style={{ 
        backgroundColor: isEditing ? 'transparent' : backgroundColor,
        color: isEditing ? 'inherit' : textColor 
      }}
    >
      {isEditing ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Footer Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <StableInput
                  value={companyName}
                  onChange={handleCompanyNameChange}
                  placeholder="Enter company name..."
                  className="font-medium text-xl"
                  label="Company Name"
                  debounceTime={300}
                  data-field-id="companyName"
                  data-component-type="Footer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Logo URL</label>
                <StableInput
                  value={logoUrl}
                  onChange={handleLogoUrlChange}
                  placeholder="Enter logo URL..."
                  label="Logo URL (optional)"
                  debounceTime={300}
                  data-field-id="logoUrl"
                  data-component-type="Footer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Copyright Text</label>
                <StableInput
                  value={copyright}
                  onChange={handleCopyrightChange}
                  placeholder="Enter copyright text..."
                  className="text-muted-foreground"
                  label="Copyright Text"
                  debounceTime={300}
                  data-field-id="copyright"
                  data-component-type="Footer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="footer-menu-selector">
                  Menu for Footer Navigation
                </label>
                <select
                  id="footer-menu-selector"
                  value={menuId}
                  onChange={handleMenuChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (No Menu Navigation)</option>
                  {menus.map(menu => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
                {loadingMenus && <p className="text-sm text-muted-foreground">Loading menus...</p>}
              </div>
              
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Background Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={handleBackgroundColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={handleBackgroundColorChange}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Text Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={handleTextColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={handleTextColorChange}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showYear}
                    onChange={handleShowYearChange}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Show Current Year</span>
                </label>
              </div>
            </div>
            
            {/* Menu Preview */}
            {selectedMenu && (
              <div className="mt-4 border p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Selected Menu: {selectedMenu.name}</h4>
                </div>
                
                {selectedMenu.items && selectedMenu.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Menu Items</h5>
                      <ul className="space-y-1 text-sm">
                        {selectedMenu.items.map((item: SimpleMenuItem) => (
                          <li key={item.id} className="px-2 py-1 bg-gray-50 rounded-sm">
                            {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This menu has no items.
                  </p>
                )}
                
                <div className="text-sm text-muted-foreground mt-2">
                  This menu will be displayed in the footer along with other footer content.
                </div>
              </div>
            )}
            
            {/* Social Links Editor */}
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Social Media Links</h4>
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
                >
                  Add Social Link
                </button>
              </div>
              
              {socialLinks.length > 0 ? (
                <div className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                      <select
                        value={link.type}
                        onChange={e => handleSocialLinkChange(index, 'type', e.target.value as SocialLink['type'])}
                        className="p-2 border rounded-md"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter</option>
                        <option value="instagram">Instagram</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="youtube">YouTube</option>
                        <option value="github">GitHub</option>
                        <option value="custom">Custom</option>
                      </select>
                      
                      <StableInput
                        value={link.url}
                        onChange={value => handleSocialLinkChange(index, 'url', value)}
                        placeholder="Enter URL..."
                        className="flex-1"
                        debounceTime={300}
                      />
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(index)}
                        className="p-1 text-destructive"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No social links added yet. Click &quot;Add Social Link&quot; to add one.
                </p>
              )}
            </div>
            
            {/* Footer Columns Editor */}
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Footer Columns</h4>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
                >
                  Add Column
                </button>
              </div>
              
              {columns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <StableInput
                          value={column.title}
                          onChange={value => handleColumnTitleChange(columnIndex, value)}
                          placeholder="Column Title"
                          className="font-medium"
                          debounceTime={300}
                        />
                        
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => handleAddLink(columnIndex)}
                            className="p-1 text-xs bg-muted hover:bg-muted/80 rounded"
                            title="Add Link"
                          >
                            + Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(columnIndex)}
                            className="p-1 text-xs text-destructive"
                            title="Remove Column"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      {column.links.length > 0 ? (
                        <div className="space-y-2">
                          {column.links.map((link, linkIndex) => (
                            <div key={linkIndex} className="flex items-center space-x-2">
                              <StableInput
                                value={link.label}
                                onChange={value => handleLinkChange(columnIndex, linkIndex, 'label', value)}
                                placeholder="Link text"
                                className="flex-1 text-sm"
                                debounceTime={300}
                              />
                              <StableInput
                                value={link.url}
                                onChange={value => handleLinkChange(columnIndex, linkIndex, 'url', value)}
                                placeholder="URL"
                                className="flex-1 text-sm"
                                debounceTime={300}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(columnIndex, linkIndex)}
                                className="p-1 text-destructive"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No links added. Click &quot;+ Link&quot; to add.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No columns added yet. Click &quot;Add Column&quot; to add one.
                </p>
              )}
            </div>
            
            {/* Preview */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Preview</h4>
              <div 
                className="p-4 rounded-md" 
                style={{ backgroundColor, color: textColor }}
              >
                <div className="text-sm">
                  <div className="flex items-center space-x-3" data-field-type="companyName" data-component-type="Footer">
                    {logoUrl && (
                      <div className="h-8 w-8" data-field-type="logoUrl" data-component-type="Footer">
                        <Image 
                          src={logoUrl}
                          alt={companyName}
                          width={32}
                          height={32}
                          className="h-full w-auto"
                        />
                      </div>
                    )}
                    <span className="text-lg font-semibold">
                      {companyName}
                    </span>
                  </div>
                  <div className="text-sm opacity-80" data-field-type="copyright" data-component-type="Footer">
                    © {showYear ? new Date().getFullYear() : ''} {companyName}. {copyright}
                  </div>
                  {socialLinks.length > 0 && (
                    <div className="flex mt-2 space-x-2">
                      {socialLinks.map((link, i) => (
                        <span key={i} className="inline-block" title={link.url}>
                          {renderSocialIcon(link.type)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company info */}
            <div className="md:col-span-1">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3" data-field-type="companyName" data-component-type="Footer">
                  {logoUrl && (
                    <div className="h-8 w-8" data-field-type="logoUrl" data-component-type="Footer">
                      <Image 
                        src={logoUrl}
                        alt={companyName}
                        width={32}
                        height={32}
                        className="h-full w-auto"
                      />
                    </div>
                  )}
                  <span className="text-lg font-semibold">
                    {companyName}
                  </span>
                </div>
                
                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex space-x-4 mt-4">
                    {socialLinks.map((link, index) => (
                      <Link 
                        key={index} 
                        href={link.url} 
                        target="_blank" 
                        className="hover:opacity-80 transition-opacity"
                      >
                        {renderSocialIcon(link.type)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Columns */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {/* Menu Items (if menu is selected) */}
              {selectedMenu && selectedMenu.items && selectedMenu.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-base mb-4">{selectedMenu.name}</h4>
                  <ul className="space-y-2">
                    {renderMenuItems(selectedMenu.items)}
                  </ul>
                </div>
              )}
            
              {/* Custom columns */}
              {columns.length > 0 && 
                columns.map((column, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-base mb-4">{column.title}</h4>
                    <ul className="space-y-2">
                      {column.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <Link 
                            href={link.url} 
                            className="text-sm hover:underline"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              }
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-12 pt-6 border-t border-gray-700 text-sm">
            <div className="text-sm opacity-80" data-field-type="copyright" data-component-type="Footer">
              © {showYear ? new Date().getFullYear() : ''} {companyName}. {copyright}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
} 