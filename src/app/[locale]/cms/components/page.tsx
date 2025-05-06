'use client';

import { useState, useEffect } from 'react';
import { 
  PlusCircleIcon, 
  SearchIcon, 
  PackageIcon,
  LayoutIcon,
  Rows3Icon,
  Image as ImageIcon,
  Type as TypeIcon,
  Save as SaveIcon,
  X as XIcon,
  Trash2 as TrashIcon,
  FileJson as JsonIcon
} from 'lucide-react';
import { cmsOperations, CMSComponentDB } from '@/lib/graphql-client';

type ComponentType = 'all' | 'ui' | 'layout' | 'form' | 'media';

export default function ComponentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ComponentType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [components, setComponents] = useState<CMSComponentDB[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<CMSComponentDB | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'ui',
    icon: '',
    schema: '{}'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    // Fetch components from API
    const fetchComponents = async () => {
      try {
        setIsLoading(true);
        const componentsData = await cmsOperations.getAllComponents();
        setComponents(componentsData);
      } catch (error) {
        console.error('Error fetching components:', error);
        showNotification('error', 'Error loading components');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getComponentTypeIcon = (type: string | undefined) => {
    if (!type) return <PackageIcon className="h-5 w-5" />;
    
    switch (type) {
      case 'ui':
        return <PackageIcon className="h-5 w-5" />;
      case 'layout':
        return <LayoutIcon className="h-5 w-5" />;
      case 'form':
        return <Rows3Icon className="h-5 w-5" />;
      case 'media':
        return <ImageIcon className="h-5 w-5" />;
      default:
        return <TypeIcon className="h-5 w-5" />;
    }
  };

  const filterComponentsByType = (components: CMSComponentDB[], type: ComponentType) => {
    if (type === 'all') return components;
    return components.filter(component => component.category === type);
  };

  const filterComponentsBySearch = (components: CMSComponentDB[], query: string) => {
    if (!query) return components;
    const lowercaseQuery = query.toLowerCase();
    return components.filter(
      component => 
        component.name.toLowerCase().includes(lowercaseQuery) || 
        (component.description && component.description.toLowerCase().includes(lowercaseQuery))
    );
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate schema JSON
      let schema = {};
      try {
        schema = formData.schema ? JSON.parse(formData.schema) : {};
      } catch {
        showNotification('error', 'Invalid JSON schema');
        setIsSubmitting(false);
        return;
      }
      
      const result = await cmsOperations.createComponent({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        category: formData.category,
        icon: formData.icon,
        schema
      });
      
      if (result.success && result.component) {
        setComponents([result.component, ...components]);
        setShowCreateModal(false);
        resetForm();
        showNotification('success', 'Component created successfully');
      } else {
        showNotification('error', result.message || 'Error creating component');
      }
    } catch (error) {
      console.error('Error creating component:', error);
      showNotification('error', 'Error creating component');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedComponent) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate schema JSON
      let schema = {};
      try {
        schema = formData.schema ? JSON.parse(formData.schema) : {};
      } catch {
        showNotification('error', 'Invalid JSON schema');
        setIsSubmitting(false);
        return;
      }
      
      const result = await cmsOperations.updateComponent(selectedComponent.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        icon: formData.icon,
        schema
      });
      
      if (result.success && result.component) {
        setComponents(components.map(c => 
          c.id === result.component?.id ? result.component : c
        ));
        setShowEditModal(false);
        resetForm();
        showNotification('success', 'Component updated successfully');
      } else {
        showNotification('error', result.message || 'Error updating component');
      }
    } catch (error) {
      console.error('Error updating component:', error);
      showNotification('error', 'Error updating component');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;
    
    try {
      const result = await cmsOperations.deleteComponent(id);
      
      if (result.success) {
        setComponents(components.filter(c => c.id !== id));
        showNotification('success', 'Component deleted successfully');
      } else {
        showNotification('error', result.message || 'Error deleting component');
      }
    } catch (error) {
      console.error('Error deleting component:', error);
      showNotification('error', 'Error deleting component');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'ui',
      icon: '',
      schema: '{}'
    });
    setSelectedComponent(null);
  };

  const openEditModal = (component: CMSComponentDB) => {
    setSelectedComponent(component);
    setFormData({
      name: component.name,
      slug: component.slug,
      description: component.description || '',
      category: component.category || 'ui',
      icon: component.icon || '',
      schema: component.schema ? JSON.stringify(component.schema, null, 2) : '{}'
    });
    setShowEditModal(true);
  };

  const displayedComponents = filterComponentsBySearch(
    filterComponentsByType(components, activeTab),
    searchQuery
  );

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Components Library</h1>
        <button 
          className="px-4 py-2 bg-[#01319c] text-white rounded-md flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          New Component
        </button>
      </div>
      
      <p className="text-gray-500">
        Create and manage reusable components that can be used across your website.
      </p>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`px-3 py-1.5 rounded-md ${activeTab === 'all' ? 'bg-[#01319c] text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('ui')} 
            className={`px-3 py-1.5 rounded-md ${activeTab === 'ui' ? 'bg-[#01319c] text-white' : 'bg-gray-100'}`}
          >
            UI
          </button>
          <button 
            onClick={() => setActiveTab('layout')} 
            className={`px-3 py-1.5 rounded-md ${activeTab === 'layout' ? 'bg-[#01319c] text-white' : 'bg-gray-100'}`}
          >
            Layout
          </button>
          <button 
            onClick={() => setActiveTab('form')} 
            className={`px-3 py-1.5 rounded-md ${activeTab === 'form' ? 'bg-[#01319c] text-white' : 'bg-gray-100'}`}
          >
            Form
          </button>
          <button 
            onClick={() => setActiveTab('media')} 
            className={`px-3 py-1.5 rounded-md ${activeTab === 'media' ? 'bg-[#01319c] text-white' : 'bg-gray-100'}`}
          >
            Media
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search components..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Components List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              <div className="mt-4 flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {displayedComponents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No components found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedComponents.map((component) => (
                <div 
                  key={component.id}
                  className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md ${
                        component.category === 'ui' ? 'bg-blue-100 text-blue-700' :
                        component.category === 'layout' ? 'bg-purple-100 text-purple-700' :
                        component.category === 'form' ? 'bg-green-100 text-green-700' :
                        component.category === 'media' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getComponentTypeIcon(component.category)}
                      </div>
                      <h3 className="ml-3 text-lg font-medium">{component.name}</h3>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button 
                        onClick={() => openEditModal(component)}
                        className="p-1 text-blue-600 hover:text-blue-800 bg-blue-50 rounded-md"
                      >
                        <SaveIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteComponent(component.id)}
                        className="p-1 text-red-600 hover:text-red-800 bg-red-50 rounded-md"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">{component.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">Type: {component.slug}</span>
                    <span className="flex items-center text-gray-500">
                      {component.schema && Object.keys(component.schema).length > 0 && (
                        <JsonIcon className="h-4 w-4 mr-1 text-blue-500" aria-label="Has schema" />
                      )}
                      {new Date(component.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Create Component Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Component</h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateComponent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="auto-generated-if-empty"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="ui">UI</option>
                    <option value="layout">Layout</option>
                    <option value="form">Form</option>
                    <option value="media">Media</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Icon class or name"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <JsonIcon className="h-4 w-4 mr-1" />
                    JSON Schema
                  </label>
                  <textarea
                    value={formData.schema}
                    onChange={(e) => setFormData({...formData, schema: e.target.value})}
                    className="w-full font-mono text-sm border border-gray-300 rounded-md px-3 py-2"
                    rows={8}
                    placeholder="{}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Define the component&apos;s structure in JSON format
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#01319c] text-white rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Component Modal */}
      {showEditModal && selectedComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Component</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateComponent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="ui">UI</option>
                    <option value="layout">Layout</option>
                    <option value="form">Form</option>
                    <option value="media">Media</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Icon class or name"
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <JsonIcon className="h-4 w-4 mr-1" />
                    JSON Schema
                  </label>
                  <textarea
                    value={formData.schema}
                    onChange={(e) => setFormData({...formData, schema: e.target.value})}
                    className="w-full font-mono text-sm border border-gray-300 rounded-md px-3 py-2"
                    rows={8}
                    placeholder="{}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Define the component&apos;s structure in JSON format
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#01319c] text-white rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 