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
  ArrowUpRightIcon,
  GripVerticalIcon,
  CornerDownRightIcon,
  LayoutIcon
} from 'lucide-react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult
} from 'react-beautiful-dnd';

interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  pageId: string | null;
  order: number;
  target: string | null;
  parentId: string | null;
  children?: MenuItem[];
  page?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface Menu {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}

interface MenuItemTreeProps {
  items: MenuItem[];
  parentId?: string | null;
  editItem: (item: MenuItem) => void;
  level?: number;
  pages: Array<{id: string, title: string, slug: string}>;
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
  const [reordering, setReordering] = useState(false);

  const MenuItemTree: React.FC<MenuItemTreeProps> = ({ 
    items, 
    parentId = null, 
    editItem, 
    level = 0, 
    pages
  }) => {
    // Sort items by order
    const sortedItems = [...items]
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.order - b.order);

    if (sortedItems.length === 0) return null;

    return (
      <div className={`menu-tree-level-${level}`}>
        {sortedItems.map((item, index) => {
          // Check if this item has children
          const hasChildren = items.some((childItem: MenuItem) => childItem.parentId === item.id);
          
          return (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={`menu-item-wrapper ${hasChildren ? 'has-children' : ''} ${level > 0 ? 'ml-4' : ''}`}
                >
                  <div className={`menu-tree-item relative ${level > 0 ? 'border-l-2 border-indigo-100 pl-4 ml-2' : ''}`}>
                    {level > 0 && (
                      <div className="absolute left-0 top-1/2 w-4 h-px bg-indigo-200" style={{ transform: 'translateY(-50%)' }}></div>
                    )}
                    <div className={`flex items-center p-2 hover:bg-gray-50 rounded-md ${snapshot.isDragging ? 'bg-blue-50 shadow-md' : ''} ${level > 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <span {...provided.dragHandleProps} className="mr-2 cursor-move">
                        <GripVerticalIcon className="h-4 w-4 text-gray-400" />
                      </span>
                      {level > 0 && (
                        <CornerDownRightIcon className="h-4 w-4 text-indigo-400 mr-2" />
                      )}
                      <span className={`flex-1 ${hasChildren ? 'font-medium' : ''}`}>{item.title}</span>
                      <span className="flex items-center text-xs text-gray-500 space-x-2">
                        {item.pageId ? (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-md mr-1 flex items-center" title={`Page: ${item.page?.title || 'Unknown'} (URL: ${item.url || ''})`}>
                            Page {item.target === '_blank' && <ArrowUpRightIcon className="ml-1 h-3 w-3" />}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-md mr-1 flex items-center" title={`URL: ${item.url || ''}`}>
                            URL {item.target === '_blank' && <ArrowUpRightIcon className="ml-1 h-3 w-3" />}
                          </span>
                        )}
                        <button
                          onClick={() => editItem(item)}
                          className="text-blue-600 hover:text-blue-900 px-2 py-0.5 text-xs"
                        >
                          Edit
                        </button>
                      </span>
                    </div>
                  </div>
                  
                  {/* Render children recursively */}
                  {hasChildren && (
                    <div className="child-items-container ml-8 mt-1 pl-2 border-l-2 border-indigo-100">
                      <Droppable droppableId={item.id} type="menu-sub-item" isDropDisabled={false} isCombineEnabled={false}>
                        {(childrenProvided, childrenSnapshot) => (
                          <div 
                            ref={childrenProvided.innerRef}
                            {...childrenProvided.droppableProps}
                            className={`pl-2 py-1 ${childrenSnapshot.isDraggingOver ? 'bg-indigo-50 rounded-md' : ''}`}
                          >
                            <MenuItemTree 
                              items={items} 
                              parentId={item.id} 
                              editItem={editItem} 
                              level={level + 1} 
                              pages={pages}
                            />
                            {childrenProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </div>
              )}
            </Draggable>
          );
        })}
      </div>
    );
  };

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
      
      // If we have pages loaded, get the page title for display in the info box
      if (pages.length > 0) {
        const selectedPage = pages.find(page => page.id === item.pageId);
        if (selectedPage) {
          console.log(`Editing page menu item: ${selectedPage.title} (${selectedPage.slug})`);
        }
      }
    } else {
      setItemType('url');
      setItemUrl(item.url || '');
      setItemPageId(null);
      console.log(`Editing URL menu item: ${item.url}`);
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

  // Helper function to get page slug from pageId
  const getPageSlug = (pageId: string): string | undefined => {
    const page = pages.find(p => p.id === pageId);
    return page?.slug;
  };

  const handlePageSelect = (pageId: string | null) => {
    setItemPageId(pageId);
    
    // Auto-fill title with page title if currently empty
    if (pageId) {
      const selectedPage = pages.find(page => page.id === pageId);
      if (selectedPage && (!itemTitle || (editingItem && editingItem.pageId === pageId))) {
        setItemTitle(selectedPage.title);
      }
      
      // Clear URL field as it will be generated from page slug
      setItemUrl('');
    }
  };
  
  // Helper function to get page URL from pageId
  const getPageUrl = (pageId: string): string => {
    const page = pages.find(p => p.id === pageId);
    return page ? `/${page.slug}` : '';
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let mutation, variables;

      // Ensure correct handling of URL vs Page type menu items
      const inputData = {
        menuId,
        title: itemTitle,
        url: itemType === 'url' ? itemUrl : null,
        pageId: itemType === 'page' ? itemPageId : null,
        parentId: itemParentId,
        target: itemTarget
      };

      // Log what we're saving for debugging
      console.log(`Saving menu item: ${itemTitle}`);
      console.log(`Item type: ${itemType}`);
      if (itemType === 'url') {
        console.log(`URL: ${itemUrl}`);
      } else {
        console.log(`Page ID: ${itemPageId}`);
        console.log(`Page slug: ${getPageSlug(itemPageId || '')}`);
      }

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
          input: inputData
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
          input: inputData
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

  const reorderItems = async (result: DropResult) => {
    if (!result.destination || !menu) return;
    
    // No change in position
    if (
      result.destination.droppableId === result.source.droppableId && 
      result.destination.index === result.source.index
    ) return;
    
    console.log("Drag result:", result);
    
    setReordering(true);
    
    try {
      // Create a deep copy of menu items to work with
      const newItems = [...menu.items];
      
      // Get details about the drag operation
      const sourceDroppableId = result.source.droppableId;
      const destDroppableId = result.destination.droppableId;
      const draggedItemId = result.draggableId;
      const dragType = result.type;
      
      console.log(`Moving item ${draggedItemId} from ${sourceDroppableId} to ${destDroppableId} (type: ${dragType})`);
      
      // Find the item being dragged
      const draggedItemIndex = newItems.findIndex(item => item.id === draggedItemId);
      if (draggedItemIndex === -1) {
        console.error('Could not find dragged item with ID:', draggedItemId);
        return;
      }
      
      const draggedItem = { ...newItems[draggedItemIndex] };
      
      // Is this a change in parent?
      const isChangingParent = sourceDroppableId !== destDroppableId;
      
      // Remove the dragged item from its original position
      newItems.splice(draggedItemIndex, 1);
      
      // Update parent ID if dropping into a different droppable
      if (isChangingParent) {
        // If dropping into the root, set parentId to null
        // Otherwise, the droppableId is the new parent's ID
        draggedItem.parentId = destDroppableId === 'menu-items' ? null : destDroppableId;
      }
      
      // Get the items in the destination container (either top level or children of a parent)
      const destinationItems = newItems.filter(item => 
        (destDroppableId === 'menu-items' && item.parentId === null) || 
        (item.parentId === destDroppableId)
      );
      
      // Insert the dragged item at the destination position
      const insertIndex = Math.min(result.destination.index, destinationItems.length);
      destinationItems.splice(insertIndex, 0, draggedItem);
      
      // For each item in the destination container, update its order if needed
      const updatedItems = [...newItems];
      
      // Add the dragged item back to the list
      updatedItems.push(draggedItem);
      
      // Now, update the orders for all items based on their positions in their respective parent groups
      // Group items by parentId
      const itemsByParent: { [key: string]: MenuItem[] } = {};
      
      // Group for top-level items (parentId === null)
      itemsByParent['root'] = [];
      
      updatedItems.forEach(item => {
        const parentKey = item.parentId || 'root';
        if (!itemsByParent[parentKey]) {
          itemsByParent[parentKey] = [];
        }
        itemsByParent[parentKey].push(item);
      });
      
      // Sort each group and update orders
      const finalItems: MenuItem[] = [];
      Object.entries(itemsByParent).forEach(([parentKey, items]) => {
        // Skip the sorting part for empty arrays
        if (items.length === 0) return;
        
        // Sort items within each parent group
        const sorted = items.sort((a, b) => {
          // Special handling for the dragged item
          if (a.id === draggedItem.id) {
            if (parentKey === (draggedItem.parentId || 'root')) {
              // This is the new position, use the destination index
              return result.destination!.index - b.order;
            }
          }
          if (b.id === draggedItem.id) {
            if (parentKey === (draggedItem.parentId || 'root')) {
              // This is the new position, use the destination index
              return a.order - result.destination!.index;
            }
          }
          
          // Default sort by existing order
          return a.order - b.order;
        });
        
        // Update orders sequentially
        sorted.forEach((item, index) => {
          item.order = index + 1;
          finalItems.push(item);
        });
      });
      
      // Update the menu state with the new items
      setMenu({ ...menu, items: finalItems });
      
      // Update orders in the database
      const orderUpdates = finalItems.map(item => ({
        id: item.id,
        order: item.order,
        parentId: item.parentId
      }));
      
      const mutation = `
        mutation UpdateMenuItemsOrder($items: [MenuItemOrderUpdate!]!) {
          updateMenuItemsOrder(items: $items)
        }
      `;
      
      const response = await gqlRequest<{ updateMenuItemsOrder: boolean }>(
        mutation, 
        { items: orderUpdates }
      );
      
      if (response && response.updateMenuItemsOrder) {
        setSuccessMessage('Menu items reordered successfully');
      } else {
        setError('Failed to update menu item order');
        // Revert to original order by refetching
        fetchMenu();
      }
    } catch (err) {
      console.error('Error reordering items:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while reordering');
      fetchMenu();
    } finally {
      setReordering(false);
    }
  };

  // Update renderMenuItemsTable to ensure the type property is specified
  const renderMenuItemsTable = () => {
    if (!menu || menu.items.length === 0) {
      return (
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
      );
    }
    
    return (
      <DragDropContext onDragEnd={reorderItems}>
        <div className="border border-gray-200 rounded-md overflow-hidden p-4">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Menu Structure</h3>
            <div className="text-xs text-gray-500">
              <span className="inline-flex items-center mr-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                Top Level
              </span>
              <span className="inline-flex items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 mr-1"></div>
                Child Item
              </span>
            </div>
          </div>
          
          <Droppable droppableId="menu-items" type="menu-sub-item" isDropDisabled={false} isCombineEnabled={false}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-2 rounded-md ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
              >
                <MenuItemTree 
                  items={menu.items} 
                  editItem={editItem} 
                  pages={pages}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    );
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
                        {itemUrl && (
                          <p className="mt-1 text-xs text-gray-500">
                            This menu item will link to: <span className="font-medium">{itemUrl}</span>
                          </p>
                        )}
                        <p className="mt-1 text-xs text-blue-600">
                          <span className="font-medium">Note:</span> Custom URLs will be used exactly as entered.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="itemPageId" className="block text-sm font-medium text-gray-700 mb-1">
                          Select Page <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="itemPageId"
                          value={itemPageId || ''}
                          onChange={(e) => handlePageSelect(e.target.value || null)}
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
                        {itemPageId && itemType === 'page' && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">Selected page:</span>{' '}
                              {pages.find(p => p.id === itemPageId)?.title}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              <span className="font-medium">URL will be:</span>{' '}
                              {getPageUrl(itemPageId || '')}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              <span className="font-medium">Note:</span> URL will be automatically generated from the page slug.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>


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

                  <div>
                    <label htmlFor="itemParent" className="block text-sm font-medium text-gray-700 mb-1">
                      Menu Position
                    </label>
                    
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="positionTopLevel"
                          checked={!itemParentId}
                          onChange={() => setItemParentId(null)}
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <label htmlFor="positionTopLevel" className="ml-2 text-sm flex items-center">
                          <LayoutIcon className="h-4 w-4 mr-1 text-blue-500" />
                          <span>Top Level Item</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="positionSubItem"
                          checked={!!itemParentId}
                          onChange={() => {
                            // If no selected parent, set to the first available one
                            if (!itemParentId && menu && menu.items.length > 0) {
                              const topLevelItems = menu.items.filter(item => !item.parentId && (!editingItem || item.id !== editingItem.id));
                              if (topLevelItems.length > 0) {
                                setItemParentId(topLevelItems[0].id);
                              }
                            }
                          }}
                          className="form-radio h-4 w-4 text-blue-600"
                          disabled={!menu || menu.items.filter(item => !item.parentId && (!editingItem || item.id !== editingItem.id)).length === 0}
                        />
                        <label htmlFor="positionSubItem" className="ml-2 text-sm flex items-center">
                          <CornerDownRightIcon className="h-4 w-4 mr-1 text-indigo-500" />
                          <span>Child of Another Item</span>
                        </label>
                      </div>
                    </div>
                    
                    {itemParentId && menu && (
                      <div className="pl-6 border-l-2 border-indigo-100 ml-2">
                        <select
                          id="itemParent"
                          value={itemParentId || ''}
                          onChange={(e) => setItemParentId(e.target.value || null)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-indigo-50"
                        >
                          <option value="">-- Select Parent Item --</option>
                          {menu.items
                            .filter(item => !item.parentId && (!editingItem || item.id !== editingItem.id))
                            .map(item => (
                              <option key={item.id} value={item.id}>
                                {item.title}
                              </option>
                            ))
                          }
                        </select>
                        {itemParentId && (
                          <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-md text-xs">
                            <div className="flex items-center">
                              <CornerDownRightIcon className="h-3 w-3 text-indigo-400 mr-1" />
                              <span className="text-indigo-800">
                                This item will appear as a child of &quot;{menu.items.find(item => item.id === itemParentId)?.title || 'Selected Item'}&quot;
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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

            {/* Menu Items List with drag-drop */}
            {reordering && (
              <div className="flex justify-center items-center py-2">
                <Loader2Icon className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-blue-500">Updating order...</span>
              </div>
            )}
            
            {renderMenuItemsTable()}
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

      {/* Add the global CSS for the menu tree */}
      <style jsx global>{`
        .menu-tree-level-0 > .menu-item-wrapper {
          margin-bottom: 0.5rem;
          border-radius: 0.375rem;
          overflow: hidden;
        }
        
        .menu-tree-level-0 > .menu-item-wrapper > .menu-tree-item {
          background-color: rgba(249, 250, 251, 0.5);
        }
        
        .menu-item-wrapper.has-children > .menu-tree-item {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .child-items-container {
          position: relative;
        }
        
        .child-items-container:before {
          content: '';
          position: absolute;
          top: 0;
          left: -2px;
          width: 2px;
          height: calc(100% - 8px);
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
} 