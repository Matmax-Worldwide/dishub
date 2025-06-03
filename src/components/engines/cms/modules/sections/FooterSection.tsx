'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Github,
  Trash2,
  Plus,
  LayoutPanelTop,
  FileText,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import { MediaItem } from '@/components/engines/cms/modules/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import MediaSelector from '@/components/engines/cms/ui/selectors/MediaSelector';

// Types from schema.prisma
interface SocialLink {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github' | 'custom';
  url: string;
  icon?: string;
  label?: string;
}

interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    url: string;
    pageId?: string;
    isPageLink?: boolean;
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
  footerStyle?: FooterStyle;
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
    footerStyle?: FooterStyle;
  }) => void;
}

// Define field types
type FooterField = keyof Omit<FooterSectionProps, 'isEditing' | 'onUpdate'>;
type FooterValues = FooterSectionProps[FooterField];

// Menu types aligned with schema.prisma
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

// Footer style types
interface FooterStyle {
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  logoSize?: 'small' | 'medium' | 'large';
  advancedOptions?: {
    glassmorphism?: boolean;
    blur?: number;
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    animation?: 'none' | 'fade' | 'slide' | 'bounce';
    customClass?: string;
  };
}

// Social icon renderer
const SocialIcon = ({ type, size = 20 }: { type: SocialLink['type'], size?: number }) => {
  switch (type) {
    case 'facebook': return <Facebook size={size} />;
    case 'twitter': return <Twitter size={size} />;
    case 'instagram': return <Instagram size={size} />;
    case 'linkedin': return <Linkedin size={size} />;
    case 'youtube': return <Youtube size={size} />;
    case 'github': return <Github size={size} />;
    default: return <div>•</div>;
  }
};

// SocialLinkItem component for rendering each social link
const SocialLinkItem = ({ 
  link, 
  index, 
  onRemove, 
  onChange 
}: { 
  link: SocialLink; 
  index: number; 
  onRemove: (index: number) => void; 
  onChange: (index: number, field: keyof SocialLink, value: string) => void 
}) => {
  // Create local input state
  const [localUrl, setLocalUrl] = useState(link.url);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalUrl(link.url);
  }, [link.url]);
  
  return (
    <div className="flex items-center space-x-2 p-2 border rounded-md">
      <div className="flex-shrink-0 w-8 flex justify-center">
        <SocialIcon type={link.type} size={18} />
      </div>
      <select
        value={link.type}
        onChange={e => onChange(index, 'type', e.target.value as SocialLink['type'])}
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
      
      <input
        type="text"
        value={localUrl}
        onChange={(e) => setLocalUrl(e.target.value)}
        onBlur={() => onChange(index, 'url', localUrl)}
        placeholder="Enter URL..."
        className="flex-1 px-2 py-1 border rounded"
      />
      
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1 text-destructive"
        title="Remove"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// FooterColumnLink component for rendering each link in a column
const FooterColumnLink = ({
  link,
  columnIndex,
  linkIndex,
  pages,
  onChange,
  onRemove
}: {
  link: FooterColumn['links'][0];
  columnIndex: number;
  linkIndex: number;
  pages: Array<{id: string; title: string; slug: string}>;
  locale: string;
  onChange: (columnIndex: number, linkIndex: number, field: 'label' | 'url' | 'pageId' | 'isPageLink', value: string | boolean) => void;
  onRemove: (columnIndex: number, linkIndex: number) => void;
}) => {
  // Create local state for link values
  const [localLabel, setLocalLabel] = useState(link.label);
  const [localUrl, setLocalUrl] = useState(link.url);
  
  // Update local state when props change
  useEffect(() => {
    setLocalLabel(link.label);
    setLocalUrl(link.url);
  }, [link.label, link.url]);
  
  return (
    <div className="flex flex-col space-y-2 border border-muted p-3 rounded-md">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={() => onChange(columnIndex, linkIndex, 'label', localLabel)}
          placeholder="Link text"
          className="flex-1 text-sm px-2 py-1 border rounded"
        />
        <button
          type="button"
          onClick={() => onRemove(columnIndex, linkIndex)}
          className="text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        <select 
          className="text-xs px-2 py-1 border rounded"
          value={link.isPageLink ? "page" : "url"}
          onChange={(e) => {
            onChange(
              columnIndex,
              linkIndex,
              'isPageLink',
              e.target.value === "page"
            );
          }}
        >
          <option value="url">URL directa</option>
          <option value="page">Página del sitio</option>
        </select>
        
        {link.isPageLink ? (
          <select
            value={link.pageId || ""}
            onChange={(e) => {
              onChange(
                columnIndex,
                linkIndex,
                'pageId',
                e.target.value
              );
            }}
            className="flex-1 text-sm px-2 py-1 border rounded"
          >
            <option value="">Seleccionar página...</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.title} ({page.slug})
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            onBlur={() => onChange(columnIndex, linkIndex, 'url', localUrl)}
            placeholder="URL"
            className="flex-1 text-sm px-2 py-1 border rounded"
          />
        )}
      </div>
    </div>
  );
};

// FooterColumnItem component for rendering each column
const FooterColumnItem = ({
  column,
  columnIndex,
  pages,
  locale,
  onTitleChange,
  onAddLink,
  onRemoveColumn,
  onLinkChange,
  onRemoveLink
}: {
  column: FooterColumn;
  columnIndex: number;
  pages: Array<{id: string; title: string; slug: string}>;
  locale: string;
  onTitleChange: (columnIndex: number, title: string) => void;
  onAddLink: (columnIndex: number) => void;
  onRemoveColumn: (columnIndex: number) => void;
  onLinkChange: (columnIndex: number, linkIndex: number, field: 'label' | 'url' | 'pageId' | 'isPageLink', value: string | boolean) => void;
  onRemoveLink: (columnIndex: number, linkIndex: number) => void;
}) => {
  // Create local state for column title
  const [localTitle, setLocalTitle] = useState(column.title);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalTitle(column.title);
  }, [column.title]);
  
  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex-1 mr-2">
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => onTitleChange(columnIndex, localTitle)}
            placeholder="Column Title"
            className="font-medium w-full px-2 py-1 border rounded"
          />
        </div>
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => onAddLink(columnIndex)}
            className="p-1 text-xs bg-muted hover:bg-muted/80 rounded flex items-center gap-1"
            title="Add Link"
          >
            <Plus size={14} />
            Link
          </button>
          <button
            type="button"
            onClick={() => onRemoveColumn(columnIndex)}
            className="p-1 text-xs text-destructive"
            title="Remove Column"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {column.links.length > 0 ? (
        <div className="space-y-2">
          {column.links.map((link, linkIndex) => (
            <FooterColumnLink
              key={linkIndex}
              link={link}
              columnIndex={columnIndex}
              linkIndex={linkIndex}
              pages={pages}
              locale={locale}
              onChange={onLinkChange}
              onRemove={onRemoveLink}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          No links added. Click &quot;+ Link&quot; to add.
        </p>
      )}
    </div>
  );
};

// Main Footer Component
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
  footerStyle: initialFooterStyle = {},
  isEditing = false, 
  onUpdate 
}: FooterSectionProps) {
  // Local state
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
  const [footerStyle, setFooterStyle] = useState(initialFooterStyle);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [pages, setPages] = useState<Array<{id: string; title: string; slug: string}>>([]);
  
  // References
  const isEditingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  const locale = params.locale as string || 'en';

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
  
  // Load all available pages when in editing mode
  useEffect(() => {
    const fetchPages = async () => {
      if (!isEditing) return;
      
      setPages([]); // Clear pages first
      try {
        const pagesData = await cmsOperations.getAllPages();
        if (Array.isArray(pagesData)) {
          setPages(pagesData);
        }
      } catch (error) {
        console.error('Error loading pages:', error);
      }
    };
    
    fetchPages();
  }, [isEditing]);
  
  // Update local state when props change, but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialLogoUrl !== logoUrl) setLogoUrl(initialLogoUrl);
      if (initialCompanyName !== companyName) setCompanyName(initialCompanyName);
      if (initialCopyright !== copyright) setCopyright(initialCopyright);
      if (JSON.stringify(initialSocialLinks) !== JSON.stringify(socialLinks)) setSocialLinks([...initialSocialLinks]);
      if (JSON.stringify(initialColumns) !== JSON.stringify(columns)) setColumns([...initialColumns]);
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
  
  // Separate useEffect for footerStyle to prevent infinite loops
  useEffect(() => {
    // Only run when initialFooterStyle changes and not during editing
    if (!isEditingRef.current && initialFooterStyle) {
      const initialStyleStr = JSON.stringify(initialFooterStyle);
      const currentStyleStr = JSON.stringify(footerStyle || {});
      if (initialStyleStr !== currentStyleStr) {
        // Use a timeout to break the potential update cycle
        const timeoutId = setTimeout(() => {
          setFooterStyle({...initialFooterStyle});
        }, 0);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [initialFooterStyle]);
  
  // Update handler with debouncing
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
          footerStyle
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
    [onUpdate, logoUrl, companyName, copyright, socialLinks, columns, menuId, backgroundColor, textColor, showYear, footerStyle]
  );
  
  // Individual change handlers
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
  const handleLinkChange = useCallback((columnIndex: number, linkIndex: number, field: 'label' | 'url' | 'pageId' | 'isPageLink', value: string | boolean) => {
    const newColumns = [...columns];
    
    if (field === 'isPageLink') {
      // Cuando cambia entre URL y página
      newColumns[columnIndex].links[linkIndex].isPageLink = value as boolean;
      
      // Reset the other field
      if (value) {
        newColumns[columnIndex].links[linkIndex].pageId = '';
        // Keep URL for now in case they switch back
      } else {
        // Going back to URL mode
        newColumns[columnIndex].links[linkIndex].pageId = undefined;
      }
    } else {
      // Para otros campos (label, url, pageId)
      (newColumns[columnIndex].links[linkIndex] as Record<string, string | boolean>)[field] = value;
      
      // If changing pageId, update URL to reflect the page path
      if (field === 'pageId' && value) {
        const selectedPage = pages.find(p => p.id === value);
        if (selectedPage) {
          // Format URL as /locale/slug
          newColumns[columnIndex].links[linkIndex].url = `/${locale}/${selectedPage.slug}`;
        }
      }
    }
    
    setColumns(newColumns);
    handleUpdateField('columns', newColumns);
  }, [columns, handleUpdateField, pages, locale]);

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

  // Footer style handlers
  const handleFooterStyleChange = useCallback((field: keyof typeof footerStyle, value: unknown) => {
    try {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Update local state immediately
      const newFooterStyle = { ...footerStyle, [field]: value };
      setFooterStyle(newFooterStyle);
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Add a debounce to prevent rapid updates
      debounceRef.current = setTimeout(() => {
        handleUpdateField('footerStyle', newFooterStyle);
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 300);
    } catch (error) {
      console.error('Error updating footer style:', error);
    }
  }, [footerStyle, handleUpdateField]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Replace the MediaLibrary implementation with MediaSelector
  const handleMediaSelection = (mediaItem: MediaItem) => {
    setLogoUrl(mediaItem.fileUrl);
    handleLogoUrlChange(mediaItem.fileUrl);
    setShowMediaSelector(false);
  };

  // Helper function to get logo size classes based on footerStyle.logoSize
  const getLogoSizeClasses = () => {
    switch (footerStyle.logoSize) {
      case 'small':
        return 'h-6 w-6';
      case 'large':
        return 'h-12 w-12';
      case 'medium':
      default:
        return 'h-8 w-8';
    }
  };

  // Details Tab Component
  const DetailsTab = () => {
    // Create separate local state for form inputs
    const [localInputs, setLocalInputs] = useState({
      companyName: companyName,
      copyright: copyright
    });
    
    // Update local state when props change and not editing
    useEffect(() => {
      if (!isEditingRef.current) {
        setLocalInputs({
          companyName: companyName,
          copyright: copyright
        });
      }
    }, [companyName, copyright]);

    // Function to safely update inputs
    const updateLocalInput = (field: keyof typeof localInputs, value: string) => {
      // Update only the local state without triggering any parent updates
      setLocalInputs(prev => ({
        ...prev,
        [field]: value
      }));
    };
    
    // Handle form submission - only update parent when form is submitted
    const handleFormSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      // Only update if values changed
      if (localInputs.companyName !== companyName) {
        handleUpdateField('companyName', localInputs.companyName);
      }
      
      if (localInputs.copyright !== copyright) {
        handleUpdateField('copyright', localInputs.copyright);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
          <form 
            className="flex-1" 
            onSubmit={handleFormSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={localInputs.companyName}
                onChange={(e) => updateLocalInput('companyName', e.target.value)}
                onBlur={handleFormSubmit}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-xl"
                placeholder="Company Name..."
                />
              </div>
              
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Copyright Text</label>
              <input
                type="text"
                value={localInputs.copyright}
                onChange={(e) => updateLocalInput('copyright', e.target.value)}
                onBlur={handleFormSubmit}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-muted-foreground"
                placeholder="Copyright text..."
                />
              </div>
              
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={showYear}
                onChange={handleShowYearChange}
                className="rounded border-gray-300"
                id="showYear"
              />
              <label htmlFor="showYear" className="text-sm font-medium">
                Show Current Year
              </label>
            </div>
          </form>
              </div>
              
        {/* Logo Selector */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <LayoutPanelTop className="h-4 w-4 mr-2 text-muted-foreground" />
            Footer Logo
          </h3>
          <div className="flex flex-col sm:flex-row items-start gap-2">
            <div 
              className="border rounded-md h-20 w-20 flex items-center justify-center overflow-hidden bg-gray-50"
            >
              {logoUrl ? (
                <div className={getLogoSizeClasses()}>
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
            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowMediaSelector(true)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Select Logo
                </button>
                {logoUrl && (
                  <button 
                    onClick={() => handleLogoUrlChange('')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Select an image from your media library or enter a URL
              </div>
            </div>
          </div>
        </div>
        
        {/* Menu Selector */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            Menu Selection
          </h3>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="footer-menu-selector">
                  Menu for Footer Navigation
                </label>
                <select
                  id="footer-menu-selector"
                  value={menuId}
                  onChange={handleMenuChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
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
              </div>
            )}
        </div>
      </div>
    );
  };
            
  // Content Tab Component
  const ContentTab = () => (
    <div className="space-y-6">
            {/* Social Links Editor */}
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Social Media Links</h4>
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Social Link
                </button>
              </div>
              
              {socialLinks.length > 0 ? (
                <div className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <SocialLinkItem 
                      key={index}
                      link={link}
                      index={index}
                      onRemove={handleRemoveSocialLink}
                      onChange={handleSocialLinkChange}
                    />
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
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Column
                </button>
              </div>
              
              {columns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {columns.map((column, columnIndex) => (
                    <FooterColumnItem
                      key={columnIndex}
                      column={column}
                      columnIndex={columnIndex}
                      pages={pages}
                      locale={locale}
                      onTitleChange={handleColumnTitleChange}
                      onAddLink={handleAddLink}
                      onRemoveColumn={handleRemoveColumn}
                      onLinkChange={handleLinkChange}
                      onRemoveLink={handleRemoveLink}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No columns added yet. Click &quot;Add Column&quot; to add one.
                </p>
              )}
            </div>
    </div>
  );

  // Styles Tab Component
  const StylesTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="footerAlignment" className="text-sm block mb-1">
            Content Alignment
          </label>
          <select
            id="footerAlignment"
            value={footerStyle.alignment || 'left'}
            onChange={(e) => handleFooterStyleChange('alignment', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="footerWidth" className="text-sm block mb-1">
            Footer Width
          </label>
          <select
            id="footerWidth"
            value={footerStyle.width || 'container'}
            onChange={(e) => handleFooterStyleChange('width', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="full">Full Width</option>
            <option value="container">Container (max-width)</option>
            <option value="narrow">Narrow</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="columnLayout" className="text-sm block mb-1">
            Column Layout
          </label>
          <select
            id="columnLayout"
            value={footerStyle.columnLayout || 'grid'}
            onChange={(e) => handleFooterStyleChange('columnLayout', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="stacked">Stacked</option>
            <option value="grid">Grid</option>
            <option value="flex">Flex</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="socialAlignment" className="text-sm block mb-1">
            Social Links Alignment
          </label>
          <select
            id="socialAlignment"
            value={footerStyle.socialAlignment || 'left'}
            onChange={(e) => handleFooterStyleChange('socialAlignment', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="padding" className="text-sm block mb-1">
            Padding
          </label>
          <select
            id="padding"
            value={footerStyle.padding || 'medium'}
            onChange={(e) => handleFooterStyleChange('padding', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="logoSize" className="text-sm block mb-1">
            Logo Size
          </label>
          <select
            id="logoSize"
            value={footerStyle.logoSize || 'medium'}
            onChange={(e) => handleFooterStyleChange('logoSize', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              value={footerStyle.transparency || 0}
              onChange={(e) => handleFooterStyleChange('transparency', parseInt(e.target.value))}
              className="flex-1 mr-2"
            />
            <span className="text-sm">{footerStyle.transparency || 0}%</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            id="borderTop"
            checked={footerStyle.borderTop || false}
            onChange={(e) => handleFooterStyleChange('borderTop', e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="borderTop" className="text-sm font-medium">
            Show Border at Top
          </label>
        </div>
      </div>
    </div>
  );

  // Preview Tab Component
  const PreviewTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-3">Footer Preview</h3>
      <div 
        className="p-4 rounded-md border" 
                style={{ backgroundColor, color: textColor }}
              >
        <div className={`${
          footerStyle.width === 'narrow' ? 'max-w-3xl' :
          footerStyle.width === 'container' ? 'max-w-7xl' : 'w-full'
        } mx-auto`}>
          <div className={`${
            footerStyle.columnLayout === 'stacked' ? 'flex flex-col space-y-6' :
            footerStyle.columnLayout === 'flex' ? 'flex flex-wrap justify-between gap-8' :
            'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8'
          }`}>
            {/* Company info */}
            <div>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3">
                    {logoUrl && (
                    <div className={getLogoSizeClasses()}>
                      <S3FilePreview 
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
                  <div className={`flex space-x-4 mt-4 ${
                    footerStyle.socialAlignment === 'center' ? 'justify-center' :
                    footerStyle.socialAlignment === 'right' ? 'justify-end' : 'justify-start'
                  }`}>
                    {socialLinks.map((link, index) => (
                      <span key={index} className="inline-block" title={link.url}>
                        <SocialIcon type={link.type} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            
            {/* Menu Preview */}
            {selectedMenu && selectedMenu.items && selectedMenu.items.length > 0 && (
              <div>
                <h4 className="font-medium text-base mb-4">{selectedMenu.name}</h4>
                <ul className="space-y-2">
                  {selectedMenu.items.map(item => {
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
                  })}
                </ul>
            </div>
            )}
            
            {/* Columns Preview */}
            {columns.map((column, index) => (
              <div key={index}>
                <h4 className="font-medium text-base mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex} className="text-sm">
                      {link.label}
                    </li>
                  ))}
                </ul>
          </div>
            ))}
        </div>
          
          {/* Copyright */}
          <div className={`mt-12 pt-6 ${footerStyle.borderTop ? 'border-t' : ''} text-sm ${
            footerStyle.alignment === 'center' ? 'text-center' :
            footerStyle.alignment === 'right' ? 'text-right' : 'text-left'
          }`}>
            <div className="text-sm opacity-80">
              © {showYear ? new Date().getFullYear() : ''} {companyName}. {copyright}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4  to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="styles" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Styles
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Preview
              </TabsTrigger>
            </TabsList>

            {/* DETAILS TAB */}
            <TabsContent value="details" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <DetailsTab />
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <ContentTab />
            </TabsContent>

            {/* STYLES TAB */}
            <TabsContent value="styles" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <StylesTab />
            </TabsContent>

            {/* PREVIEW TAB */}
            <TabsContent value="preview" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <PreviewTab />
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
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company info */}
            <div className="md:col-span-1">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3">
                  {logoUrl && (
                    <div className={getLogoSizeClasses()}>
                      <S3FilePreview 
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
                        <SocialIcon type={link.type} />
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
                    {selectedMenu.items.map(item => {
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
                    })}
                  </ul>
                </div>
              )}
            
              {/* Custom columns */}
              {columns.map((column, index) => (
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
              ))}
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-12 pt-6 border-t border-gray-700 text-sm">
            <div className="text-sm opacity-80">
              © {showYear ? new Date().getFullYear() : ''} {companyName}. {copyright}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
} 