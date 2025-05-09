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
  SearchIcon,
} from 'lucide-react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import Image from 'next/image';
import ManageableSection from '@/components/cms/ManageableSection';
import { ComponentType } from '@prisma/client';

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

interface AvailableSection {
  sectionId: string;
  name: string;
  description: string;
  componentCount: number;
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

  // Función para asegurar que se usa un valor válido del enum ComponentType
  const getValidComponentType = (type?: string): ComponentType => {
    if (!type) return ComponentType.CUSTOM;
    
    // Comprobar si el valor es parte del enum ComponentType
    if (Object.values(ComponentType).includes(type as ComponentType)) {
      return type as ComponentType;
    }
    
    // Mapear valores comunes a valores válidos del enum
    switch (type.toUpperCase()) {
      case 'GENERIC':
        return ComponentType.CUSTOM;
      case 'TEXT':
        return ComponentType.TEXT;
      case 'IMAGE':
        return ComponentType.IMAGE;
      case 'HERO':
        return ComponentType.HERO;
      case 'GALLERY':
        return ComponentType.GALLERY;
      case 'VIDEO':
        return ComponentType.VIDEO;
      case 'FORM':
        return ComponentType.FORM;
      case 'CTA':
        return ComponentType.CTA;
      case 'TESTIMONIALS':
        return ComponentType.TESTIMONIALS;
      default:
        return ComponentType.CUSTOM; // Valor por defecto
    }
  };

  // Handle saving
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare section data
      const sectionData = pageData.sections.map((section, index) => {
        // Asegurarnos de que section.data tenga un sectionId válido
        let sectionDataObject = section.data ? { ...section.data } : {};
        
        // Si es un objeto, podemos verificar si ya tiene un sectionId
        if (typeof sectionDataObject === 'object') {
          if ('sectionId' in sectionDataObject && sectionDataObject.sectionId) {
            console.log(`Section ${index} already has sectionId:`, sectionDataObject.sectionId);
          } else {
            // No tiene sectionId, o es null/undefined - usar componentType como fallback
            // pero solo si tampoco tiene un sectionId definido
            if (section.componentType) {
              sectionDataObject.sectionId = section.componentType;
              console.log(`Added sectionId to section ${index}:`, sectionDataObject.sectionId);
            } else {
              console.warn(`Section ${index} has no componentType to use as sectionId`);
            }
          }
        } else {
          // Si data no es un objeto, crear uno nuevo con sectionId
          sectionDataObject = {
            sectionId: section.componentType || `section-${index}`
          };
          console.log(`Created new data object for section ${index} with sectionId:`, sectionDataObject.sectionId);
        }
        
        // Asegurarnos de que el sectionId esté definido
        if (!sectionDataObject.sectionId) {
          console.warn(`No sectionId for section ${index}, using fallback`);
          sectionDataObject.sectionId = `section-${index}`;
        }
        
        return {
          id: section.id.startsWith('temp-') ? undefined : section.id,
          order: index, // Use array index as order to guarantee sequence
          title: section.title || `Section ${index + 1}`,
          componentType: getValidComponentType(section.componentType), // Convert to valid enum value
          data: sectionDataObject,
          isVisible: section.isVisible !== false
        };
      });
      
      console.log('Sending sections data for save:', sectionData);
      
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
            activeTab === 'seo'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('seo')}
        >
          <div className="flex items-center">
            <SearchIcon className="h-4 w-4 mr-2" />
            SEO
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

        </>
      ) : activeTab === 'seo' ? (
        <>
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
                  <p className="mt-1 text-sm text-gray-500">
                    {!pageData.metaTitle && "If left empty, the page title will be used"}
                  </p>
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
                  <p className="mt-1 text-sm text-gray-500">
                    {!pageData.metaDescription && "If left empty, the page description will be used"}
                  </p>
                </div>

                {/* Featured Image Preview */}
                {pageData.featuredImage && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Featured Image Preview
                    </label>
                    <div className="mt-1 border border-gray-200 rounded-md overflow-hidden">
                      <Image 
                        src={pageData.featuredImage} 
                        alt="Featured" 
                        className="h-40 w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/400x200?text=Image+Not+Found";
                        }}
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      The featured image can be set in the Edit tab
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Search Result Preview</h2>
              
              <div className="border border-gray-100 rounded-md p-4 bg-gray-50">
                <div className="text-blue-700 text-lg font-medium truncate">
                  {pageData.metaTitle || pageData.title}
                </div>
                <div className="text-green-700 text-sm truncate">
                  {`${window.location.origin}/${locale}/${pageData.slug}`}
                </div>
                <div className="text-gray-700 text-sm mt-1 line-clamp-2">
                  {pageData.metaDescription || pageData.description || "No description available"}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Preview tab
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="prose max-w-full">
              <h1>{pageData.title}</h1>
              {pageData.description && <p className="text-gray-600">{pageData.description}</p>}
            </div>
          </div>
          
          {pageData.sections && pageData.sections.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium">Page Preview</h2>
              </div>
              
              <div className="relative">
                {/* Contenido de la página */}
                <div className="page-content">
                  {pageData.sections.map((section, index) => {
                    // Extraer el sectionId de manera segura
                    let sectionId: string | null = null;
                    
                    // Si section.data existe y es un objeto
                    if (section.data && typeof section.data === 'object') {
                      // Intentar obtener sectionId directamente
                      if ('sectionId' in section.data) {
                        sectionId = String(section.data.sectionId);
                      }
                    }
                    
                    // Si no se encontró sectionId, usar componentType como fallback
                    if (!sectionId && section.componentType) {
                      sectionId = section.componentType;
                    }
                    
                    return (
                      <div key={section.id} className="relative">
                        {/* Etiqueta flotante con el nombre de la sección */}
                        <div className="absolute top-0 right-0 z-10 px-2 py-1 text-xs text-gray-500 bg-white/80 border-l border-b border-gray-200 rounded-bl">
                          {section.title || `Section ${index + 1}`}
                        </div>
                        
                        {/* Línea separadora sutil entre secciones */}
                        {index > 0 && (
                          <div className="border-t border-dashed border-gray-200 my-1 mx-4"></div>
                        )}
                        
                        {/* Contenido de la sección */}
                        <div className="section-content relative">
                          {sectionId ? (
                            <ManageableSection 
                              sectionId={sectionId}
                              isEditing={false}
                              autoSave={false}
                            />
                          ) : (
                            <div className="py-4 px-6 text-center text-gray-400 italic text-sm">
                              Esta sección no tiene un ID válido configurado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-500">This page doesn&apos;t have any sections yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 