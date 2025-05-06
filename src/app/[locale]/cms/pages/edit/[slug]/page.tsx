'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SaveIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  TagIcon,
  LayoutIcon,
  EyeIcon,
  PencilIcon,
  Loader2Icon,
  CalendarIcon,
  ImageIcon,
  InfoIcon,
  AlignLeftIcon,
  PlusIcon,
  ArrowUpDownIcon,
  TrashIcon,
  EditIcon,
  RefreshCwIcon
} from 'lucide-react';
import { cmsOperations, CMSComponent, PageData } from '@/lib/graphql-client';
import ManageableSection from '@/components/cms/ManageableSection';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface SectionItem {
  id: string;
  title?: string;
  order: number;
  componentType?: string;
  data?: Record<string, unknown>;
  isVisible?: boolean;
  components?: CMSComponent[];
}

// Define preview data structure
interface SectionPreview {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
}

interface PagePreview {
  page: PageData;
  sections: SectionPreview[];
}

interface AvailableSection {
  sectionId: string;
  name: string;
  description: string;
  componentCount: number;
}

// Component to handle section component loading and editing
function SectionComponentEditor({ sectionId }: { sectionId: string }) {
  const [components, setComponents] = useState<CMSComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [componentData, setComponentData] = useState<Record<string, unknown>>({});

  // Load components for this section
  const loadComponents = async () => {
    if (!sectionId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Loading components for section ${sectionId}`);
      const sectionData = await cmsOperations.loadSectionComponentsForEdit(sectionId);
      
      if (sectionData && Array.isArray(sectionData.components)) {
        console.log(`Loaded ${sectionData.components.length} components for section ${sectionId}`);
        setComponents(sectionData.components);
      } else {
        console.log(`No components found for section ${sectionId}`);
        setComponents([]);
      }
    } catch (error) {
      console.error(`Error loading section components for ${sectionId}:`, error);
      setError('Failed to load components');
    } finally {
      setIsLoading(false);
    }
  };

  // Load components when the component mounts
  useEffect(() => {
    loadComponents();
  }, [sectionId]);

  // Handle saving component edits
  const handleSaveComponent = async () => {
    if (!editingComponent || !sectionId) return;
    
    try {
      setIsLoading(true);
      
      const result = await cmsOperations.applyComponentEdit(
        sectionId, 
        editingComponent, 
        componentData
      );
      
      if (result.success) {
        // Reload components to show the updated data
        await loadComponents();
        setEditingComponent(null);
      } else {
        setError(`Failed to save: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving component:', error);
      setError('Failed to save component');
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing a component
  const startEditing = (component: CMSComponent) => {
    setEditingComponent(component.id);
    setComponentData(component.data || {});
    setError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComponent(null);
    setComponentData({});
    setError(null);
  };

  // Handle input change for component editing
  const handleInputChange = (key: string, value: unknown) => {
    setComponentData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading && components.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
        <span>Loading components...</span>
      </div>
    );
  }

  if (error && components.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex flex-col items-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button 
          onClick={loadComponents}
          className="flex items-center text-sm px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCwIcon className="w-4 h-4 mr-1" />
          Retry
        </button>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
        <p className="text-gray-500 mb-2">No components in this section</p>
        <p className="text-sm text-gray-400">Components can be added in the section editor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">
          {components.length} component{components.length !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={loadComponents}
          disabled={isLoading}
          className="text-xs flex items-center text-blue-600 hover:text-blue-800"
        >
          <RefreshCwIcon className="w-3 h-3 mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {components.map(component => (
          <div 
            key={component.id} 
            className={`border rounded-md ${
              editingComponent === component.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="px-3 py-2 flex justify-between items-center border-b border-gray-200">
              <div className="font-medium text-sm">{component.type}</div>
              
              {editingComponent === component.id ? (
                <div className="flex space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveComponent}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2Icon className="w-3 h-3 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(component)}
                  className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded flex items-center"
                >
                  <EditIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
            </div>
            
            <div className="p-3">
              {editingComponent === component.id ? (
                <div className="space-y-3">
                  {Object.entries(componentData).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 items-center">
                      <label className="text-xs font-medium text-gray-700 col-span-1">
                        {key}:
                      </label>
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="col-span-2 px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(component.data || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-xs font-medium text-gray-600 col-span-1">{key}:</span>
                      <span className="text-xs text-gray-800 col-span-2 break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditPage() {
  const { locale, slug } = useParams<{ locale: string; slug: string }>();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableSections, setAvailableSections] = useState<AvailableSection[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [availableTemplates] = useState([
    { value: 'default', label: 'Default' },
    { value: 'full-width', label: 'Full Width' },
    { value: 'sidebar', label: 'With Sidebar' },
    { value: 'landing', label: 'Landing Page' },
  ]);
  
  // Page data state
  const [pageData, setPageData] = useState({
    id: '',
    title: '',
    slug: '',
    description: '',
    template: 'default',
    isPublished: false,
    publishDate: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    parentId: '',
    order: 0,
    pageType: 'CONTENT',
    locale: locale || 'en',
    sections: [] as SectionItem[]
  });

  const [previewData, setPreviewData] = useState<PagePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Page type options
  const pageTypes = [
    { value: 'HOME', label: 'Home' },
    { value: 'CONTENT', label: 'Content' },
    { value: 'BLOG', label: 'Blog' },
    { value: 'LANDING', label: 'Landing' },
    { value: 'CONTACT', label: 'Contact' },
    { value: 'SERVICES', label: 'Services' },
    { value: 'ABOUT', label: 'About' },
    { value: 'CUSTOM', label: 'Custom' }
  ];

  // Load page data
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setIsLoading(true);
        
        // Ensure slug is properly formatted
        const normalizedSlug = String(slug).trim();
        
        console.log(`Attempting to fetch page with slug: "${normalizedSlug}"`);
        
        // Fetch the page with this slug
        const page = await cmsOperations.getPageBySlug(normalizedSlug);
        
        // Log the result for debugging
        console.log('getPageBySlug result:', page ? 'Page found' : 'Page not found', page ? `(ID: ${page.id})` : '');
        
        if (page) {
          // Format page data
          setPageData({
            id: page.id,
            title: page.title,
            slug: page.slug,
            description: page.description || '',
            template: page.template || 'default',
            isPublished: page.isPublished,
            publishDate: page.publishDate ? new Date(page.publishDate).toISOString().split('T')[0] : '',
            featuredImage: page.featuredImage || '',
            metaTitle: page.metaTitle || '',
            metaDescription: page.metaDescription || '',
            parentId: page.parentId || '',
            order: page.order || 0,
            pageType: page.pageType,
            locale: page.locale || locale || 'en',
            sections: Array.isArray(page.sections) ? page.sections.map((section: {
              id: string;
              title?: string;
              order?: number;
              componentType?: string;
              data?: Record<string, unknown>;
              isVisible?: boolean;
            }) => ({
              id: section.id,
              title: section.title || '',
              order: section.order || 0,
              componentType: section.componentType || '',
              data: section.data,
              isVisible: section.isVisible !== false
            })) : []
          });
          
          // Load available sections
          const sectionsData = await cmsOperations.getAllCMSSections();
          if (Array.isArray(sectionsData)) {
            const formattedSections = sectionsData.map(section => ({
              sectionId: section.sectionId,
              name: section.name || section.sectionId,
              description: section.description || '',
              componentCount: Array.isArray(section.components) ? section.components.length : 0
            }));
            setAvailableSections(formattedSections);
            console.log(availableSections);
          }
        } else {
          // Try to list available pages to help debugging
          try {
            const pagesData = await cmsOperations.getAllPages();
            if (pagesData && pagesData.length > 0) {
              console.log('Available pages:', pagesData.map(p => ({
                id: p.id,
                slug: p.slug,
                title: p.title
              })));
              
              // Check if we have a page with a similar slug to suggest
              const similarPages = pagesData.filter(p => 
                p.slug.includes(normalizedSlug) || 
                normalizedSlug.includes(p.slug)
              );
              
              console.log(`Page not found for slug: "${normalizedSlug}". URL slug: "${slug}". Similar pages:`, 
                similarPages.length ? similarPages.map(p => `${p.title} (${p.slug})`) : 'None');
              
              if (similarPages.length > 0) {
                setNotification({
                  type: 'error',
                  message: `Page not found. Did you mean "${similarPages[0].title}" (${similarPages[0].slug})?`
                });
              } else {
                setNotification({
                  type: 'error',
                  message: 'Page not found'
                });
              }
            } else {
              setNotification({
                type: 'error',
                message: 'Page not found'
              });
            }
          } catch (listError) {
            console.error('Error listing pages:', listError);
            setNotification({
              type: 'error',
              message: 'Page not found'
            });
          }
        }
      } catch (error) {
        console.error('Error loading page:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load page data'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPageData();
    }
  }, [slug, locale]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPageData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPageData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle section changes
  const handleSectionChange = (sectionId: string, updatedData: Partial<SectionItem>) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updatedData } : section
      )
    }));
  };

  // Add a new section
  const handleAddSection = () => {
    // Generate a temporary ID for the new section
    const newSectionId = `temp-section-${Date.now()}`;
    
    // Add new section to the end
    const newOrder = pageData.sections.length > 0 
      ? Math.max(...pageData.sections.map(s => s.order)) + 1 
      : 0;
    
    setPageData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newSectionId,
          title: 'New Section',
          order: newOrder,
          componentType: 'generic',
          data: {},
          isVisible: true
        }
      ]
    }));
  };

  // Remove a section
  const handleRemoveSection = (sectionId: string) => {
    if (confirm('Are you sure you want to remove this section?')) {
      setPageData(prev => ({
        ...prev,
        sections: prev.sections.filter(section => section.id !== sectionId)
      }));
    }
  };

  // Reorder sections
  const handleMoveSectionUp = (sectionId: string) => {
    setPageData(prev => {
      const sectionIndex = prev.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex <= 0) return prev;
      
      const newSections = [...prev.sections];
      const currentSection = newSections[sectionIndex];
      const prevSection = newSections[sectionIndex - 1];
      
      // Swap orders
      const tempOrder = currentSection.order;
      currentSection.order = prevSection.order;
      prevSection.order = tempOrder;
      
      // Swap positions in array
      newSections[sectionIndex] = prevSection;
      newSections[sectionIndex - 1] = currentSection;
      
      return {
        ...prev,
        sections: newSections
      };
    });
  };

  const handleMoveSectionDown = (sectionId: string) => {
    setPageData(prev => {
      const sectionIndex = prev.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex < 0 || sectionIndex >= prev.sections.length - 1) return prev;
      
      const newSections = [...prev.sections];
      const currentSection = newSections[sectionIndex];
      const nextSection = newSections[sectionIndex + 1];
      
      // Swap orders
      const tempOrder = currentSection.order;
      currentSection.order = nextSection.order;
      nextSection.order = tempOrder;
      
      // Swap positions in array
      newSections[sectionIndex] = nextSection;
      newSections[sectionIndex + 1] = currentSection;
      
      return {
        ...prev,
        sections: newSections
      };
    });
  };

  // Handle saving
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare section data
      const sectionData = pageData.sections.map((section, index) => ({
        id: section.id.startsWith('temp-') ? undefined : section.id,
        order: index, // Use array index as order to guarantee sequence
        title: section.title || `Section ${index + 1}`,
        componentType: section.componentType || 'generic',
        data: section.data || {},
        isVisible: section.isVisible !== false
      }));
      
      // Call the API to update the page
      const result = await cmsOperations.updatePage(pageData.id, {
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description || null,
        template: pageData.template,
        isPublished: pageData.isPublished,
        publishDate: pageData.publishDate ? new Date(pageData.publishDate).toISOString() : null,
        featuredImage: pageData.featuredImage || null,
        metaTitle: pageData.metaTitle || null,
        metaDescription: pageData.metaDescription || null,
        parentId: pageData.parentId || null,
        order: pageData.order,
        pageType: pageData.pageType,
        locale: pageData.locale,
        sections: sectionData
      });
      
      if (result && result.success) {
        setNotification({
          type: 'success',
          message: 'Page updated successfully!'
        });
        
        // Redirect back to pages list after successful save
        setTimeout(() => {
          router.push(`/${locale}/cms/pages`);
        }, 1500);
      } else {
        throw new Error(result?.message || 'Unknown error updating page');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update page'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancellation (navigate back to pages list)
  const handleCancel = () => {
    router.push(`/${locale}/cms/pages`);
  };

  // Load preview data
  const loadPagePreview = async () => {
    if (!pageData.id) return;
    
    try {
      setIsLoadingPreview(true);
      console.log(`Loading preview for page: ${pageData.title}`);
      
      const previewData = await cmsOperations.getPagePreview(pageData);
      console.log(`Preview loaded with ${previewData.sections.length} sections`);
      
      setPreviewData(previewData);
    } catch (error) {
      console.error("Error loading page preview:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  // Load preview when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview' && pageData.id && !previewData) {
      loadPagePreview();
    }
  }, [activeTab, pageData.id, previewData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading page data...</span>
      </div>
    );
  }

  // Add a specific error state for "Page not found"
  if (notification?.type === 'error' && notification?.message.startsWith('Page not found')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="p-4 rounded-md bg-red-50 text-red-800 flex items-center">
          <AlertCircleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-lg font-medium">{notification.message}</span>
        </div>
        <p className="text-gray-600">The page you&apos;re trying to edit could not be found.</p>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push(`/${locale}/cms/pages`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Pages
          </button>
          
          <button
            onClick={() => router.push(`/${locale}/cms/pages/create`)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md flex items-center hover:bg-blue-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCancel}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Back to pages"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Page: {pageData.title}</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 disabled:bg-blue-300"
            disabled={!pageData.title || !pageData.slug || isSaving}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div 
          className={`p-4 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckIcon className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === 'edit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('edit')}
        >
          <div className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </div>
        </button>
      </div>

      {activeTab === 'edit' ? (
        <>
          {/* Basic Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FileTextIcon className="h-4 w-4 mr-1" />
                      Title <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={pageData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter page title"
                    required
                  />
                </div>
                
                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <GlobeIcon className="h-4 w-4 mr-1" />
                      URL Slug <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">/{locale}/</span>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={pageData.slug}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="page-url-slug"
                      required
                    />
                  </div>
                </div>
                
                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <AlignLeftIcon className="h-4 w-4 mr-1" />
                      Description
                    </div>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={pageData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the page"
                  />
                </div>
                
                {/* Page Type */}
                <div>
                  <label htmlFor="pageType" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      Page Type
                    </div>
                  </label>
                  <select
                    id="pageType"
                    name="pageType"
                    value={pageData.pageType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {pageTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Template */}
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <LayoutIcon className="h-4 w-4 mr-1" />
                      Template
                    </div>
                  </label>
                  <select
                    id="template"
                    name="template"
                    value={pageData.template}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableTemplates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Order */}
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <ArrowUpDownIcon className="h-4 w-4 mr-1" />
                      Order
                    </div>
                  </label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    value={pageData.order}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Locale */}
                <div>
                  <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <GlobeIcon className="h-4 w-4 mr-1" />
                      Locale
                    </div>
                  </label>
                  <input
                    type="text"
                    id="locale"
                    name="locale"
                    value={pageData.locale}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="en"
                  />
                </div>
                
                {/* Featured Image */}
                <div>
                  <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Featured Image URL
                    </div>
                  </label>
                  <input
                    type="text"
                    id="featuredImage"
                    name="featuredImage"
                    value={pageData.featuredImage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                {/* Publish Date */}
                <div>
                  <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Publish Date
                    </div>
                  </label>
                  <input
                    type="date"
                    id="publishDate"
                    name="publishDate"
                    value={pageData.publishDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Published status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={pageData.isPublished}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                    Publish page (make it visible to users)
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* SEO Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">SEO Information</h2>
              
              <div className="space-y-4">
                {/* Meta Title */}
                <div>
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <InfoIcon className="h-4 w-4 mr-1" />
                      Meta Title
                    </div>
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={pageData.metaTitle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO title (shown in search results)"
                  />
                </div>
                
                {/* Meta Description */}
                <div>
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <AlignLeftIcon className="h-4 w-4 mr-1" />
                      Meta Description
                    </div>
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={pageData.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO description (shown in search results)"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sections */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium flex items-center">
                  <LayoutIcon className="h-5 w-5 mr-2" />
                  Sections
                </h2>
                <button
                  onClick={handleAddSection}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Section
                </button>
              </div>
              
              {pageData.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No sections added yet. Click &quot;Add Section&quot; to create your first section.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pageData.sections.map((section, index) => (
                    <div 
                      key={section.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:bg-blue-50/30 transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Section {index + 1}:</span>
                          <input
                            type="text"
                            value={section.title || ''}
                            onChange={(e) => handleSectionChange(section.id, { title: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Section Title"
                          />
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleMoveSectionUp(section.id)}
                            disabled={index === 0}
                            className={`p-1 rounded-md ${index === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Move up"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveSectionDown(section.id)}
                            disabled={index === pageData.sections.length - 1}
                            className={`p-1 rounded-md ${index === pageData.sections.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Move down"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveSection(section.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                            title="Remove section"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Component Type
                          </label>
                          <select
                            value={section.componentType || 'generic'}
                            onChange={(e) => handleSectionChange(section.id, { componentType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="generic">Generic</option>
                            <option value="hero">Hero</option>
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="gallery">Gallery</option>
                            <option value="feature">Feature</option>
                            <option value="testimonial">Testimonial</option>
                            <option value="contact">Contact</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`isVisible-${section.id}`}
                            checked={section.isVisible !== false}
                            onChange={(e) => handleSectionChange(section.id, { isVisible: e.target.checked })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`isVisible-${section.id}`} className="ml-2 block text-sm text-gray-700">
                            Visible (show this section on the page)
                          </label>
                        </div>
                      </div>
                      
                      {/* Section components editor */}
                      <div className="mt-4 border-t pt-4">
                        <ManageableSection 
                          sectionId={section.id}
                          isEditing={true}
                          autoSave={false}
                        />
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-3">Section Components</h4>
                          <SectionComponentEditor sectionId={section.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Preview tab
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="prose max-w-full">
            <h1>{pageData.title}</h1>
            {pageData.description && <p className="text-gray-600">{pageData.description}</p>}
            
            {isLoadingPreview ? (
              <div className="flex justify-center items-center py-12">
                <Loader2Icon className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                <span>Loading preview...</span>
              </div>
            ) : previewData ? (
              <div className="mt-8 space-y-8">
                {previewData.sections.map((section: SectionPreview, index: number) => (
                  <div key={section.id} className="border-t pt-4">
                    <h2>{section.title || `Section ${index + 1}`}</h2>
                    <div className="bg-gray-100 p-4 rounded-md">
                      <p className="text-sm font-medium text-gray-700">
                        {section.components.length} components in this section
                      </p>
                      <div className="mt-2 space-y-2">
                        {section.components.map((component: CMSComponent) => (
                          <div key={component.id} className="bg-white p-3 rounded border">
                            <div className="font-medium">{component.type}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {Object.keys(component.data || {}).length} properties
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Preview not available. Try refreshing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 