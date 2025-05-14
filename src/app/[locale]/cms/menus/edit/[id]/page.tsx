'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  ArrowLeftIcon, 
  Loader2Icon, 
  PlusCircleIcon, 
  SaveIcon, 
  Trash2Icon,
  XIcon,
  ArrowUpRightIcon
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  pageId: string | null;
  order: number;
  target: string | null;
  parentId: string | null;
  children?: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const menuId = params.id as string;
  const itemIdToEdit = searchParams.get('itemId');
  const shouldAddItem = searchParams.get('addItem') === 'true';
  
  const [menu, setMenu] = useState<Menu | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State for menu item form
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemTarget, setItemTarget] = useState('_self');
  const [itemParentId, setItemParentId] = useState<string | null>(null);
  const [itemPageId, setItemPageId] = useState<string | null>(null);
  const [itemType, setItemType] = useState<'url' | 'page'>('url');
  const [savingItem, setSavingItem] = useState(false);
  const [showItemDeleteConfirm, setShowItemDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [pages, setPages] = useState<Array<{id: string, title: string, slug: string}>>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    if (menuId) {
      fetchMenu();
      fetchPages();
    }
  }, [menuId]);

  useEffect(() => {
    // If URL has itemId parameter, open edit form for that item
    if (itemIdToEdit && menu) {
      const item = menu.items.find(item => item.id === itemIdToEdit);
      if (item) {
        editItem(item);
      }
    } else if (shouldAddItem) {
      setShowItemForm(true);
      setEditingItem(null);
      resetItemForm();
    }
  }, [itemIdToEdit, menu, shouldAddItem]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            createdAt
            updatedAt
            items {
              id
              title
              url
              pageId
              target
              parentId
              order
            }
          }
        }
      `;

      const response = await gqlRequest<{ menu: Menu }>(query, { id: menuId });
      
      if (response && response.menu) {
        setMenu(response.menu);
        setName(response.menu.name);
        setLocation(response.menu.location || '');
      } else {
        setError('Menu not found');
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    setLoadingPages(true);
    setError(null);
    try {
      const query = `
        query GetPages {
          pages {
            id
            title
            slug
          }
        }
      `;

      const response = await gqlRequest<{ pages: Array<{id: string, title: string, slug: string}> }>(query);
      
      if (response && response.pages) {
        setPages(response.pages);
        console.log(`Loaded ${response.pages.length} pages for menu item selection`);
      } else {
        console.error('Pages response was empty or invalid');
        setPages([]);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setPages([]);
      // Don't show the error in the UI since this is not critical
    } finally {
      setLoadingPages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const mutation = `
        mutation UpdateMenu($id: ID!, $input: MenuInput!) {
          updateMenu(id: $id, input: $input) {
            id
            name
            location
            updatedAt
          }
        }
      `;

      const variables = {
        id: menuId,
        input: {
          name,
          location: location || null
        }
      };

      const response = await gqlRequest<{ updateMenu: Menu }>(mutation, variables);

      if (response && response.updateMenu) {
        setSuccessMessage('Menu updated successfully');
        // Update the menu data with the new values
        setMenu(prev => prev ? { ...prev, ...response.updateMenu } : response.updateMenu);
      } else {
        setError('Failed to update menu');
      }
    } catch (err) {
      console.error('Error updating menu:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  const deleteMenu = async () => {
    setDeleting(true);
    setError(null);

    try {
      const mutation = `
        mutation DeleteMenu($id: ID!) {
          deleteMenu(id: $id)
        }
      `;

      const response = await gqlRequest<{ deleteMenu: boolean }>(mutation, { id: menuId });

      if (response && response.deleteMenu) {
        // Redirect to menus list
        router.push('/cms/menus');
      } else {
        setError('Failed to delete menu');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting menu:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const editItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    
    if (item.pageId) {
      setItemType('page');
      setItemPageId(item.pageId);
      setItemUrl('');
    } else {
      setItemType('url');
      setItemUrl(item.url || '');
      setItemPageId(null);
    }
    
    setItemTarget(item.target || '_self');
    setItemParentId(item.parentId);
    setShowItemForm(true);
  };

  const resetItemForm = () => {
    setItemTitle('');
    setItemUrl('');
    setItemPageId(null);
    setItemType('url');
    setItemTarget('_self');
    setItemParentId(null);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let mutation, variables;

      if (editingItem) {
        // Update existing item
        mutation = `
          mutation UpdateMenuItem($id: ID!, $input: MenuItemInput!) {
            updateMenuItem(id: $id, input: $input) {
              id
              title
              url
              pageId
              target
              parentId
              order
            }
          }
        `;

        variables = {
          id: editingItem.id,
          input: {
            menuId,
            title: itemTitle,
            url: itemType === 'url' ? itemUrl : null,
            pageId: itemType === 'page' ? itemPageId : null,
            parentId: itemParentId,
            target: itemTarget
          }
        };
      } else {
        // Create new item
        mutation = `
          mutation CreateMenuItem($input: MenuItemInput!) {
            createMenuItem(input: $input) {
              id
              title
              url
              pageId
              target
              parentId
              order
            }
          }
        `;

        variables = {
          input: {
            menuId,
            title: itemTitle,
            url: itemType === 'url' ? itemUrl : null,
            pageId: itemType === 'page' ? itemPageId : null,
            parentId: itemParentId,
            target: itemTarget
          }
        };
      }

      const response = await gqlRequest<{ 
        updateMenuItem?: MenuItem; 
        createMenuItem?: MenuItem;
      }>(mutation, variables);

      if (response && (response.updateMenuItem || response.createMenuItem)) {
        setSuccessMessage(`Menu item ${editingItem ? 'updated' : 'created'} successfully`);
        
        // Refresh menu data
        fetchMenu();
        
        // Reset form
        setShowItemForm(false);
        resetItemForm();
        setEditingItem(null);
        
        // Update URL to remove query parameters
        router.push(`/cms/menus/edit/${menuId}`);
      } else {
        setError(`Failed to ${editingItem ? 'update' : 'create'} menu item`);
      }
    } catch (err) {
      console.error(`Error ${editingItem ? 'updating' : 'creating'} menu item:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async () => {
    if (!editingItem) return;
    
    setDeletingItem(true);
    setError(null);

    try {
      const mutation = `
        mutation DeleteMenuItem($id: ID!) {
          deleteMenuItem(id: $id)
        }
      `;

      const response = await gqlRequest<{ deleteMenuItem: boolean }>(
        mutation, 
        { id: editingItem.id }
      );

      if (response && response.deleteMenuItem) {
        setSuccessMessage('Menu item deleted successfully');
        
        // Refresh menu data
        fetchMenu();
        
        // Reset form and close it
        setShowItemForm(false);
        resetItemForm();
        setEditingItem(null);
        setShowItemDeleteConfirm(false);
        
        // Update URL to remove query parameters
        router.push(`/cms/menus/edit/${menuId}`);
      } else {
        setError('Failed to delete menu item');
        setShowItemDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setShowItemDeleteConfirm(false);
    } finally {
      setDeletingItem(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading menu...</span>
      </div>
    );
  }

  if (!menu && !loading) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <p className="font-medium">Error</p>
        <p>Menu not found or could not be loaded</p>
        <Link href="/cms/menus" className="mt-4 inline-block px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50">
          Back to Menus
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link href="/cms/menus" className="mr-4 p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Menu: {menu?.name}</h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 flex items-center"
        >
          <Trash2Icon className="h-4 w-4 mr-1" />
          Delete Menu
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Success</p>
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Menu Settings Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Menu Settings</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Header, Footer"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Specify where this menu will be displayed
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={saving || !name}
                  className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center ${
                    saving || !name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Menu Items</h2>
              {!showItemForm && (
                <button 
                  onClick={() => {
                    setShowItemForm(true);
                    setEditingItem(null);
                    resetItemForm();
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              )}
            </div>

            {showItemForm && (
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowItemForm(false);
                      setEditingItem(null);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="itemTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="itemTitle"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4 mb-3">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="itemType"
                          value="url"
                          checked={itemType === 'url'}
                          onChange={() => setItemType('url')}
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom URL</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="itemType"
                          value="page"
                          checked={itemType === 'page'}
                          onChange={() => setItemType('page')}
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Select Page</span>
                      </label>
                    </div>

                    {itemType === 'url' ? (
                      <div>
                        <label htmlFor="itemUrl" className="block text-sm font-medium text-gray-700 mb-1">
                          URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="itemUrl"
                          value={itemUrl}
                          onChange={(e) => setItemUrl(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., /about, https://example.com"
                          required={itemType === 'url'}
                        />
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="itemPageId" className="block text-sm font-medium text-gray-700 mb-1">
                          Select Page <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="itemPageId"
                          value={itemPageId || ''}
                          onChange={(e) => setItemPageId(e.target.value || null)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required={itemType === 'page'}
                        >
                          <option value="">-- Select a page --</option>
                          {pages.map(page => (
                            <option key={page.id} value={page.id}>
                              {page.title} ({page.slug})
                            </option>
                          ))}
                        </select>
                        {loadingPages && <p className="mt-1 text-sm text-gray-500">Loading pages...</p>}
                        {pages.length === 0 && !loadingPages && (
                          <p className="mt-1 text-sm text-gray-500">No published pages found</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="itemTarget" className="block text-sm font-medium text-gray-700 mb-1">
                      Open in
                    </label>
                    <select
                      id="itemTarget"
                      value={itemTarget}
                      onChange={(e) => setItemTarget(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="_self">Same Window</option>
                      <option value="_blank">New Window</option>
                    </select>
                  </div>

                  {menu && menu.items.length > 0 && (
                    <div>
                      <label htmlFor="itemParent" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Item (Optional)
                      </label>
                      <select
                        id="itemParent"
                        value={itemParentId || ''}
                        onChange={(e) => setItemParentId(e.target.value || null)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">None (Top Level)</option>
                        {menu.items
                          .filter(item => !item.parentId && (!editingItem || item.id !== editingItem.id))
                          .map(item => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-between border-t border-gray-200">
                    <div>
                      {editingItem && (
                        <button
                          type="button"
                          onClick={() => setShowItemDeleteConfirm(true)}
                          className="px-3 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50 text-sm flex items-center"
                        >
                          <Trash2Icon className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItem(null);
                        }}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingItem || !itemTitle || (itemType === 'url' && !itemUrl) || (itemType === 'page' && !itemPageId)}
                        className={`px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center ${
                          savingItem || !itemTitle || (itemType === 'url' && !itemUrl) || (itemType === 'page' && !itemPageId) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-blue-700'
                        }`}
                      >
                        {savingItem ? (
                          <>
                            <Loader2Icon className="h-3 w-3 animate-spin mr-1" />
                            Saving...
                          </>
                        ) : (
                          'Save Item'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Menu Items List */}
            {menu && menu.items.length > 0 ? (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        URL
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Target
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {menu.items
                      .filter(item => !item.parentId)
                      .sort((a, b) => a.order - b.order)
                      .map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                            <span className="flex items-center">
                              {item.pageId ? (
                                <span className="text-green-600 flex items-center">
                                  Page Link
                                  {item.target === '_blank' && <ArrowUpRightIcon className="ml-1 h-3 w-3" />}
                                </span>
                              ) : (
                                <>
                                  {item.url || 'N/A'}
                                  {!item.pageId && item.url && item.target === '_blank' && (
                                    <ArrowUpRightIcon className="ml-1 h-3 w-3" />
                                  )}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-center hidden sm:table-cell">
                            {item.target === '_blank' ? 'New Window' : 'Same Window'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <button
                              onClick={() => editItem(item)}
                              className="text-blue-600 hover:text-blue-900 ml-3"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No menu items added yet</p>
                {!showItemForm && (
                  <button 
                    onClick={() => {
                      setShowItemForm(true);
                      setEditingItem(null);
                      resetItemForm();
                    }}
                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 inline-flex items-center"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Add Your First Item
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Menu Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete this menu? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteMenu}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Menu'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Menu Item Confirmation Modal */}
      {showItemDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete this menu item? This will also remove any children items.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowItemDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={deletingItem}
              >
                Cancel
              </button>
              <button
                onClick={deleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={deletingItem}
              >
                {deletingItem ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 