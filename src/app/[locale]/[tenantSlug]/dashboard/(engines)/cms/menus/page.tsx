'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  MenuIcon, 
  Edit2Icon, 
  Trash2Icon,
  CopyIcon,
  DownloadIcon,
  UploadIcon,
  SearchIcon,
  FilterIcon,
  MoreVerticalIcon,
  GripVerticalIcon,
  ExternalLinkIcon,
  SettingsIcon,
  SaveIcon,
  AlertTriangleIcon,
  CheckIcon,
  Loader2Icon,
  UndoIcon,
  RedoIcon,
  Sparkles,
  Navigation,
  Link2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult
} from 'react-beautiful-dnd';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { gqlRequest } from '@/lib/graphql-client';

// Types
interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  pageId: string | null;
  order: number;
  target: string | null;
  parentId: string | null;
  icon?: string;
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
  headerStyle?: {
    id?: string;
    transparency?: number;
    headerSize?: string;
    menuAlignment?: string;
    menuButtonStyle?: string;
    mobileMenuStyle?: string;
    mobileMenuPosition?: string;
    transparentHeader?: boolean;
    borderBottom?: boolean;
    fixedHeader?: boolean;
    // Button configuration fields
    showButton?: boolean;
    buttonText?: string;
    buttonAction?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonSize?: string;
    buttonBorderRadius?: number;
    buttonShadow?: string;
    buttonBorderColor?: string;
    buttonBorderWidth?: number;
    buttonWidth?: string;
    buttonHeight?: string;
    buttonPosition?: string;
    buttonDropdown?: boolean;
    buttonDropdownItems?: Array<{id: string; label: string; url: string}>;
    buttonUrlType?: string;
    selectedPageId?: string;
  } | null;
}

interface Page {
  id: string;
  title: string;
  slug: string;
}



// Menu locations
const MENU_LOCATIONS = [
  { value: 'HEADER', label: 'Header Navigation' },
  { value: 'FOOTER', label: 'Footer Navigation' },
  { value: 'SIDEBAR', label: 'Sidebar Navigation' },
  { value: 'MOBILE', label: 'Mobile Navigation' },
];

export default function MenusManagerPage() {
  // State management
  const [menus, setMenus] = useState<Menu[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [menuForm, setMenuForm] = useState({
    name: '',
    location: '',
  });

  const [itemForm, setItemForm] = useState({
    title: '',
    url: '',
    pageId: '',
    target: '_self',
    parentId: '',
    icon: '',
    type: 'url' as 'url' | 'page',
  });

  // History for undo/redo
  const [history, setHistory] = useState<Menu[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load data
  useEffect(() => {
    fetchMenus();
    fetchPages();
  }, []);

    const fetchMenus = async () => {
    setIsLoading(true);
      try {
        const query = `
          query GetMenus {
            menus {
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
                order
                target
                parentId
              icon
              page {
                id
                title
                slug
              }
              }
              headerStyle {
                id
                transparency
                headerSize
                menuAlignment
                menuButtonStyle
                mobileMenuStyle
                mobileMenuPosition
                transparentHeader
                borderBottom
                fixedHeader
              }
            }
          }
        `;

        const response = await gqlRequest<{ menus: Menu[] }>(query);
        if (response && response.menus) {
          setMenus(response.menus);
        // Initialize history
        setHistory([response.menus]);
        setHistoryIndex(0);
        }
      } catch (err) {
        console.error('Error fetching menus:', err);
        setError('Failed to load menus. Please try again later.');
      } finally {
      setIsLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const query = `
        query GetAllCMSPages {
          getAllCMSPages {
            id
            title
            slug
          }
        }
      `;

      const response = await gqlRequest<{ getAllCMSPages: Page[] }>(query);
      if (response && response.getAllCMSPages) {
        setPages(response.getAllCMSPages);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    }
  };

  // History management
  const saveToHistory = useCallback((newMenus: Menu[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newMenus);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setMenus(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setMenus(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Menu operations
  const createMenu = async () => {
    if (!menuForm.name.trim()) return;

    setIsSaving(true);
    try {
      const mutation = `
        mutation CreateMenu($input: MenuInput!) {
          createMenu(input: $input) {
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
              order
              target
              parentId
              icon
            }
          }
        }
      `;

      const response = await gqlRequest<{ createMenu: Menu }>(mutation, {
        input: menuForm
      });

      if (response && response.createMenu) {
        const newMenus = [...menus, response.createMenu];
        setMenus(newMenus);
        saveToHistory(newMenus);
        setSuccessMessage('Menu created successfully');
        resetMenuForm();
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error creating menu:', err);
      setError('Failed to create menu');
    } finally {
      setIsSaving(false);
    }
  };

  const updateMenu = async (menuId: string, updates: Partial<Menu>) => {
    setIsSaving(true);
    try {
      // Handle header style updates separately
      if (updates.headerStyle) {
        const headerStyleMutation = `
          mutation UpdateHeaderStyle($menuId: ID!, $input: HeaderStyleInput!) {
            updateHeaderStyle(menuId: $menuId, input: $input) {
              success
              message
              headerStyle {
                id
                menuId
                transparency
                headerSize
                menuAlignment
                menuButtonStyle
                mobileMenuStyle
                mobileMenuPosition
                transparentHeader
                borderBottom
                fixedHeader
                advancedOptions
                showButton
                buttonText
                buttonAction
                buttonColor
                buttonTextColor
                buttonSize
                buttonBorderRadius
                buttonShadow
                buttonBorderColor
                buttonBorderWidth
                buttonWidth
                buttonHeight
                buttonPosition
                buttonDropdown
                buttonDropdownItems
                buttonUrlType
                selectedPageId
              }
            }
          }
        `;

        const headerStyleResponse = await gqlRequest<{
          updateHeaderStyle: {
            success: boolean;
            message: string;
            headerStyle: Menu['headerStyle'];
          }
        }>(headerStyleMutation, {
          menuId,
          input: updates.headerStyle
        });

        if (headerStyleResponse?.updateHeaderStyle?.success) {
          // Update the menu with the new header style
          const newMenus = menus.map(menu => 
            menu.id === menuId ? { 
              ...menu, 
              headerStyle: headerStyleResponse.updateHeaderStyle.headerStyle 
            } : menu
          );
          setMenus(newMenus);
          saveToHistory(newMenus);
          setSuccessMessage('Header button configuration updated successfully');
        }
        
        // Remove headerStyle from updates to avoid sending it to the regular menu update
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { headerStyle, ...menuUpdates } = updates;
        
        // If there are no other updates, we're done
        if (Object.keys(menuUpdates).length === 0) {
          setIsSaving(false);
          return;
        }
        
        // Continue with regular menu updates if there are other fields
        updates = menuUpdates;
      }

      // Handle regular menu updates
      if (Object.keys(updates).length > 0) {
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

        const response = await gqlRequest<{ updateMenu: Menu }>(mutation, {
          id: menuId,
          input: updates
        });

        if (response && response.updateMenu) {
          const newMenus = menus.map(menu => 
            menu.id === menuId ? { ...menu, ...response.updateMenu } : menu
          );
          setMenus(newMenus);
          saveToHistory(newMenus);
          setSuccessMessage('Menu updated successfully');
        }
      }
    } catch (err) {
      console.error('Error updating menu:', err);
      setError('Failed to update menu');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMenu = async (menuId: string) => {
    setIsSaving(true);
    try {
      const mutation = `
        mutation DeleteMenu($id: ID!) {
          deleteMenu(id: $id)
        }
      `;

      const response = await gqlRequest<{ deleteMenu: boolean }>(mutation, { id: menuId });

      if (response && response.deleteMenu) {
        const newMenus = menus.filter(menu => menu.id !== menuId);
        setMenus(newMenus);
        saveToHistory(newMenus);
        setSuccessMessage('Menu deleted successfully');
        if (selectedMenu?.id === menuId) {
          setSelectedMenu(null);
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error('Error deleting menu:', err);
      setError('Failed to delete menu');
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(null);
    }
  };

  const duplicateMenu = async (menu: Menu) => {
    setIsSaving(true);
    try {
      const mutation = `
        mutation CreateMenu($input: MenuInput!) {
          createMenu(input: $input) {
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
              order
              target
              parentId
              icon
            }
          }
        }
      `;

      const duplicatedMenu = {
        name: `${menu.name} (Copy)`,
        location: menu.location,
      };

      const response = await gqlRequest<{ createMenu: Menu }>(mutation, {
        input: duplicatedMenu
      });

      if (response && response.createMenu) {
        const newMenus = [...menus, response.createMenu];
        setMenus(newMenus);
        saveToHistory(newMenus);
        setSuccessMessage('Menu duplicated successfully');
      }
    } catch (err) {
      console.error('Error duplicating menu:', err);
      setError('Failed to duplicate menu');
    } finally {
      setIsSaving(false);
    }
  };

  // Menu item operations
  const addMenuItem = async () => {
    if (!selectedMenu || !itemForm.title.trim()) return;

    setIsSaving(true);
    try {
      const mutation = `
        mutation CreateMenuItem($input: MenuItemInput!) {
          createMenuItem(input: $input) {
            id
            title
            url
            pageId
            order
            target
            parentId
            icon
            page {
              id
              title
              slug
            }
          }
        }
      `;

      // Validate inputs based on type
      if (itemForm.type === 'url' && !itemForm.url.trim()) {
        setError('Please enter a valid URL');
        setIsSaving(false);
        return;
      }
      
      if (itemForm.type === 'page' && !itemForm.pageId) {
        setError('Please select a page');
        setIsSaving(false);
        return;
      }

      const response = await gqlRequest<{ createMenuItem: MenuItem }>(mutation, {
        input: {
          menuId: selectedMenu.id,
          title: itemForm.title,
          url: itemForm.type === 'url' ? itemForm.url : null,
          pageId: itemForm.type === 'page' ? itemForm.pageId : null,
          target: itemForm.target,
          parentId: itemForm.parentId || null,
          icon: itemForm.icon,
        }
      });

      if (response && response.createMenuItem) {
        const updatedMenu = {
          ...selectedMenu,
          items: [...selectedMenu.items, response.createMenuItem]
        };
        const newMenus = menus.map(menu => 
          menu.id === selectedMenu.id ? updatedMenu : menu
        );
        setMenus(newMenus);
        setSelectedMenu(updatedMenu);
        saveToHistory(newMenus);
        setSuccessMessage('Menu item added successfully');
        resetItemForm();
        setShowItemForm(false);
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError('Failed to add menu item');
    } finally {
      setIsSaving(false);
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    if (!selectedMenu) return;

    setIsSaving(true);
    try {
      // If we have a "type" field in the updates, we need to make sure
      // we set the right field to null (url or pageId)
      if ('type' in updates) {
        const type = updates.type;
        if (type === 'url') {
          updates.pageId = null;
        } else if (type === 'page') {
          updates.url = null;
        }
      }
      
      // If updating pageId, set url to null
      if (updates.pageId) {
        updates.url = null;
      }
      
      // If updating url, set pageId to null
      if (updates.url) {
        updates.pageId = null;
      }
      
      const mutation = `
        mutation UpdateMenuItem($id: ID!, $input: MenuItemInput!) {
          updateMenuItem(id: $id, input: $input) {
            id
            title
            url
            pageId
            order
            target
            parentId
            icon
            page {
              id
              title
              slug
            }
          }
        }
      `;

      const response = await gqlRequest<{ updateMenuItem: MenuItem }>(mutation, {
        id: itemId,
        input: updates
      });

      if (response && response.updateMenuItem) {
        const updatedMenu = {
          ...selectedMenu,
          items: selectedMenu.items.map(item => 
            item.id === itemId ? { ...item, ...response.updateMenuItem } : item
          )
        };
        const newMenus = menus.map(menu => 
          menu.id === selectedMenu.id ? updatedMenu : menu
        );
        setMenus(newMenus);
        setSelectedMenu(updatedMenu);
        saveToHistory(newMenus);
        setSuccessMessage('Menu item updated successfully');
      }
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError('Failed to update menu item');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!selectedMenu) return;

    setIsSaving(true);
    try {
      const mutation = `
        mutation DeleteMenuItem($id: ID!) {
          deleteMenuItem(id: $id)
        }
      `;

      const response = await gqlRequest<{ deleteMenuItem: boolean }>(mutation, { id: itemId });

      if (response && response.deleteMenuItem) {
        const updatedMenu = {
          ...selectedMenu,
          items: selectedMenu.items.filter(item => item.id !== itemId)
        };
        const newMenus = menus.map(menu => 
          menu.id === selectedMenu.id ? updatedMenu : menu
        );
        setMenus(newMenus);
        setSelectedMenu(updatedMenu);
        saveToHistory(newMenus);
        setSuccessMessage('Menu item deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError('Failed to delete menu item');
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and drop
  const handleDragEnd = async (result: DropResult) => {
    if (!selectedMenu || !result.destination) return;

    const { source, destination } = result;
    const items = Array.from(selectedMenu.items);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    const updatedMenu = { ...selectedMenu, items: updatedItems };
    const newMenus = menus.map(menu => 
      menu.id === selectedMenu.id ? updatedMenu : menu
    );
    
    setMenus(newMenus);
    setSelectedMenu(updatedMenu);
    saveToHistory(newMenus);

    // Save to backend
    try {
      const mutation = `
        mutation UpdateMenuItemsOrder($items: [MenuItemOrderUpdate!]!) {
          updateMenuItemsOrder(items: $items)
        }
      `;

      const orderUpdates = updatedItems.map(item => ({
        id: item.id,
        order: item.order,
        parentId: item.parentId
      }));

      await gqlRequest<{ updateMenuItemsOrder: boolean }>(mutation, { items: orderUpdates });
    } catch (err) {
      console.error('Error updating item order:', err);
      setError('Failed to update item order');
    }
  };

  // Import/Export
  const exportMenu = (menu: Menu) => {
    const dataStr = JSON.stringify(menu, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `menu-${menu.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importMenu = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const menuData = JSON.parse(e.target?.result as string);
        // Process imported menu data
        setMenuForm({
          name: `${menuData.name} (Imported)`,
          location: menuData.location || '',
        });
        setSuccessMessage('Menu imported successfully. Please review and save.');
      } catch {
        setError('Invalid menu file format');
      }
    };
    reader.readAsText(file);
  };

  // Utility functions
  const resetMenuForm = () => {
    setMenuForm({
      name: '',
      location: '',
    });
  };

  const resetItemForm = () => {
    setItemForm({
      title: '',
      url: '',
      pageId: '',
      target: '_self',
      parentId: '',
      icon: '',
      type: 'url',
    });
    // Also clear any error messages related to the form
    setError(null);
  };

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocation === 'all' || menu.location === filterLocation;
    return matchesSearch && matchesLocation;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading menus...</span>
      </div>
    );
  }

    return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mr-4">
              <Navigation className="h-8 w-8 text-white" />
      </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Navigation Menus</h1>
              <p className="text-gray-600 text-lg">
                Create and manage beautiful navigation menus with advanced features
              </p>
            </div>
          </div>

          {/* Feature Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-3">
                  <MenuIcon className="h-6 w-6 text-blue-600" />
      </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
                  <p className="text-sm text-gray-600">Total Menus</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-green-100 rounded-lg mr-3">
                  <Link2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{menus.reduce((total, menu) => total + menu.items.length, 0)}</p>
                  <p className="text-sm text-gray-600">Menu Items</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-3">
                  <Eye className="h-6 w-6 text-purple-600" />
        </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{menus.filter(m => m.location).length}</p>
                  <p className="text-sm text-gray-600">Active Locations</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-orange-100 rounded-lg mr-3">
                  <Sparkles className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(menus.length * 0.85)}</p>
                  <p className="text-sm text-gray-600">Published</p>
                  </div>
                </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Action Toolbar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Undo/Redo */}
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Undo"
                className="border-gray-300 hover:bg-gray-50"
              >
                <UndoIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RedoIcon className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Import */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importMenu}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
            
            {/* Create Menu */}
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Menu
            </Button>
          </div>
        </motion.div>
        
        {/* Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center shadow-sm"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <CheckIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Success</h3>
                <p className="text-sm">{successMessage}</p>
                  </div>
                  <button 
                onClick={() => setSuccessMessage(null)}
                className="ml-auto p-1 hover:bg-green-100 rounded-lg transition-colors"
                  >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                  </button>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center shadow-sm"
            >
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                </div>
              <div>
                <h3 className="font-medium">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
        >
          {/* Filters and Search */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search menus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
              
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {MENU_LOCATIONS.map(location => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Menus List */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Menus ({filteredMenus.length})</h2>
                </div>
                
                {filteredMenus.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full mb-4">
                        <MenuIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No menus found</h3>
                      <p className="text-gray-500 text-center mb-4 text-sm">
                        {searchQuery || filterLocation !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'Create your first navigation menu to get started'
                        }
                      </p>
                      {!searchQuery && filterLocation === 'all' && (
                        <Button 
                          onClick={() => setIsEditing(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Menu
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredMenus.map((menu, index) => (
                      <motion.div
                        key={menu.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            selectedMenu?.id === menu.id 
                              ? 'ring-2 ring-blue-500 border-blue-200 shadow-lg' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => setSelectedMenu(menu)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate text-gray-900">{menu.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  {menu.location && (
                                    <Badge variant="secondary" className="text-xs">
                                      {MENU_LOCATIONS.find(l => l.value === menu.location)?.label || menu.location}
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVerticalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedMenu(menu);
                                    setIsEditing(true);
                                  }}>
                                    <Edit2Icon className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateMenu(menu)}>
                                    <CopyIcon className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportMenu(menu)}>
                                    <DownloadIcon className="h-4 w-4 mr-2" />
                                    Export
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setShowDeleteConfirm(menu.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2Icon className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span className="flex items-center">
                                <Link2 className="h-3 w-3 mr-1" />
                                {menu.items.length} items
                              </span>
                              <span>{formatDate(menu.updatedAt)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Editor */}
              <div className="lg:col-span-2">
                {selectedMenu ? (
                  <MenuEditor 
                    menu={selectedMenu}
                    pages={pages}
                    onUpdate={(updates: Partial<Menu>) => updateMenu(selectedMenu.id, updates)}
                    onAddItem={() => setShowItemForm(true)}
                    onEditItem={setEditingItem}
                    onDeleteItem={deleteMenuItem}
                    onDragEnd={handleDragEnd}
                    isSaving={isSaving}
                  />
                ) : isEditing ? (
                  <MenuCreator 
                    form={menuForm}
                    onFormChange={setMenuForm}
                    onCreate={createMenu}
                    onCancel={() => {
                      setIsEditing(false);
                      resetMenuForm();
                    }}
                    isSaving={isSaving}
                  />
                ) : (
                  <Card className="border-dashed border-2 bg-gray-50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="p-4 bg-gray-200 rounded-full mb-4">
                        <SettingsIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a menu to edit</h3>
                      <p className="text-gray-500 text-center text-sm">
                        Choose a menu from the list to view and edit its structure and settings
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Menu Item Form Modal */}
      {showItemForm && (
        <MenuItemForm
          form={itemForm}
          pages={pages}
          parentItems={selectedMenu?.items.filter(item => !item.parentId) || []}
          onFormChange={setItemForm}
          onSave={addMenuItem}
          onCancel={() => {
            setShowItemForm(false);
            resetItemForm();
          }}
          isSaving={isSaving}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <MenuItemForm
          form={{
            title: editingItem.title,
            url: editingItem.url || '',
            pageId: editingItem.pageId || '',
            target: editingItem.target || '_self',
            parentId: editingItem.parentId || '',
            icon: editingItem.icon || '',
            type: editingItem.pageId ? 'page' : 'url',
          }}
          pages={pages}
          parentItems={selectedMenu?.items.filter(item => !item.parentId && item.id !== editingItem.id) || []}
          onFormChange={(form) => {
            const updates: Partial<MenuItem> = {
              title: form.title,
              url: form.type === 'url' ? form.url : null,
              pageId: form.type === 'page' ? form.pageId : null,
              target: form.target,
              parentId: form.parentId || null,
              icon: form.icon,
            };
            updateMenuItem(editingItem.id, updates);
          }}
          onSave={() => setEditingItem(null)}
          onCancel={() => setEditingItem(null)}
          isSaving={isSaving}
          isEditing
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                Delete Menu
              </CardTitle>
              <CardDescription>
                Are you sure you want to delete this menu? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteMenu(showDeleteConfirm)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

// Menu Editor Component
interface MenuEditorProps {
  menu: Menu;
  pages: Page[];
  onUpdate: (updates: Partial<Menu>) => void;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDragEnd: (result: DropResult) => void;
  isSaving: boolean;
}

function MenuEditor({ 
  menu, 
  pages, 
  onUpdate, 
  onAddItem, 
  onEditItem, 
  onDeleteItem, 
  onDragEnd,
  isSaving 
}: MenuEditorProps) {
  const [localForm, setLocalForm] = useState({
    name: menu.name,
    location: menu.location || '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = 
      localForm.name !== menu.name ||
      localForm.location !== menu.location;
    setHasChanges(changed);
  }, [localForm, menu]);

  const handleSave = () => {
    onUpdate(localForm);
    setHasChanges(false);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => (
    <Draggable key={item.id} draggableId={item.id} index={item.order}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border rounded-lg p-3 bg-white ${
            snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
          } ${level > 0 ? 'ml-6 border-l-4 border-l-blue-200' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div {...provided.dragHandleProps} className="cursor-move">
                <GripVerticalIcon className="h-4 w-4 text-gray-400" />
                </div>
                
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-sm">{item.icon}</span>}
                  <span className="font-medium">{item.title}</span>
                  </div>
                
                <div className="flex items-center gap-2 mt-1">
                  {item.pageId ? (
                    <Badge variant="secondary" className="text-xs">
                      Page: {pages.find(p => p.id === item.pageId)?.title || 'Unknown'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      URL: {item.url}
                    </Badge>
                  )}
                  
                  {item.target === '_blank' && (
                    <ExternalLinkIcon className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditItem(item)}
              >
                <Edit2Icon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteItem(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
                </div>
              </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Menu: {menu.name}</CardTitle>
            <CardDescription>
              Configure menu settings and manage menu items
            </CardDescription>
          </div>
          
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Menu Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="menu-name">Menu Name</Label>
            <Input
              id="menu-name"
              value={localForm.name}
              onChange={(e) => setLocalForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter menu name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="menu-location">Location</Label>
            <Select 
              value={localForm.location} 
              onValueChange={(value) => setLocalForm(prev => ({ ...prev, location: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {MENU_LOCATIONS.map(location => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Menu Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Menu Items ({menu.items.length})</h3>
            <Button onClick={onAddItem}>
              <PlusIcon className="h-4 w-4 mr-2" />
                      Add Item
            </Button>
                  </div>
                  
                  {menu.items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <MenuIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No menu items yet</p>
              <Button variant="outline" onClick={onAddItem} className="mt-2">
                Add First Item
              </Button>
                    </div>
                  ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="menu-items" isDropDisabled={false}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                          {menu.items
                            .sort((a, b) => a.order - b.order)
                      .map(item => renderMenuItem(item))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <Separator />

        {/* Header Button Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Header Button Configuration</h3>
            <Badge variant="outline">Optional</Badge>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="space-y-4">
              {/* Enable Button */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showButton"
                  checked={menu.headerStyle?.showButton || false}
                  onChange={(e) => {
                    const newHeaderStyle = {
                      ...menu.headerStyle,
                      showButton: e.target.checked
                    } as Partial<Menu['headerStyle']>;
                    onUpdate({ headerStyle: newHeaderStyle });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="showButton" className="text-sm font-medium">
                  Show Button in Header
                </Label>
              </div>
              
              {menu.headerStyle?.showButton && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  {/* Button Text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buttonText">Button Text</Label>
                      <Input
                        id="buttonText"
                        value={menu.headerStyle?.buttonText || ''}
                        onChange={(e) => {
                          const newHeaderStyle = {
                            ...menu.headerStyle,
                            buttonText: e.target.value
                          };
                          onUpdate({ headerStyle: newHeaderStyle });
                        }}
                        placeholder="Get Started"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buttonAction">Button URL/Action</Label>
                      <Input
                        id="buttonAction"
                        value={menu.headerStyle?.buttonAction || ''}
                        onChange={(e) => {
                          const newHeaderStyle = {
                            ...menu.headerStyle,
                            buttonAction: e.target.value
                          };
                          onUpdate({ headerStyle: newHeaderStyle });
                        }}
                        placeholder="/contact"
                      />
                    </div>
                  </div>
                  
                  {/* Button Styling */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buttonColor">Button Color</Label>
                      <Input
                        id="buttonColor"
                        type="color"
                        value={menu.headerStyle?.buttonColor || '#3B82F6'}
                        onChange={(e) => {
                          const newHeaderStyle = {
                            ...menu.headerStyle,
                            buttonColor: e.target.value
                          };
                          onUpdate({ headerStyle: newHeaderStyle });
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buttonTextColor">Text Color</Label>
                      <Input
                        id="buttonTextColor"
                        type="color"
                        value={menu.headerStyle?.buttonTextColor || '#FFFFFF'}
                        onChange={(e) => {
                          const newHeaderStyle = {
                            ...menu.headerStyle,
                            buttonTextColor: e.target.value
                          };
                          onUpdate({ headerStyle: newHeaderStyle });
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buttonSize">Button Size</Label>
                      <Select 
                        value={menu.headerStyle?.buttonSize || 'md'} 
                        onValueChange={(value) => {
                          const newHeaderStyle = {
                            ...menu.headerStyle,
                            buttonSize: value
                          };
                          onUpdate({ headerStyle: newHeaderStyle });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Button Position */}
                  <div className="space-y-2">
                    <Label htmlFor="buttonPosition">Button Position</Label>
                    <Select 
                      value={menu.headerStyle?.buttonPosition || 'center'} 
                      onValueChange={(value) => {
                        const newHeaderStyle = {
                          ...menu.headerStyle,
                          buttonPosition: value
                        };
                        onUpdate({ headerStyle: newHeaderStyle });
                      }}
                    >
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Button Preview */}
                  <div className="border-t border-gray-200 pt-4">
                    <Label className="text-sm font-medium mb-2 block">Button Preview</Label>
                    <div className="p-4 bg-white rounded-md border flex justify-center">
                      <button
                        style={{
                          backgroundColor: menu.headerStyle?.buttonColor || '#3B82F6',
                          color: menu.headerStyle?.buttonTextColor || '#FFFFFF',
                          padding: menu.headerStyle?.buttonSize === 'sm' ? '6px 12px' : 
                                  menu.headerStyle?.buttonSize === 'lg' ? '12px 24px' : '8px 16px',
                          fontSize: menu.headerStyle?.buttonSize === 'sm' ? '14px' : 
                                   menu.headerStyle?.buttonSize === 'lg' ? '18px' : '16px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {menu.headerStyle?.buttonText || 'Button Text'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Form types
interface MenuFormData {
  name: string;
  location: string;
}

interface MenuItemFormData {
  title: string;
  url: string;
  pageId: string;
  target: string;
  parentId: string;
  icon: string;
  type: 'url' | 'page';
}

// Menu Creator Component
interface MenuCreatorProps {
  form: MenuFormData;
  onFormChange: (form: MenuFormData) => void;
  onCreate: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function MenuCreator({ form, onFormChange, onCreate, onCancel, isSaving }: MenuCreatorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Menu</CardTitle>
        <CardDescription>
          Set up a new navigation menu for your website
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-menu-name">Menu Name *</Label>
            <Input
              id="new-menu-name"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="Main Navigation"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-menu-location">Location</Label>
            <Select 
              value={form.location} 
              onValueChange={(value) => onFormChange({ ...form, location: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {MENU_LOCATIONS.map(location => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
                    </div>
        </div>
        
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!form.name.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Menu
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Menu Item Form Component
interface MenuItemFormProps {
  form: MenuItemFormData;
  pages: Page[];
  parentItems: MenuItem[];
  onFormChange: (form: MenuItemFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isEditing?: boolean;
}

function MenuItemForm({ 
  form, 
  pages, 
  parentItems, 
  onFormChange, 
  onSave, 
  onCancel, 
  isSaving,
  isEditing = false 
}: MenuItemFormProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit' : 'Add'} Menu Item</CardTitle>
          <CardDescription>
            Configure the menu item settings and behavior
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-title">Title *</Label>
              <Input
                id="item-title"
                value={form.title}
                onChange={(e) => onFormChange({ ...form, title: e.target.value })}
                placeholder="Menu item title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-icon">Icon (optional)</Label>
              <Input
                id="item-icon"
                value={form.icon}
                onChange={(e) => onFormChange({ ...form, icon: e.target.value })}
                placeholder="🏠 or icon name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Link Type</Label>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => onFormChange({ ...form, type: 'url', pageId: '' })}
                className={`flex-1 py-2 text-sm font-medium ${
                  form.type === 'url' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Custom URL
              </button>
              <button
                type="button"
                onClick={() => onFormChange({ ...form, type: 'page', url: '' })}
                className={`flex-1 py-2 text-sm font-medium ${
                  form.type === 'page' ? 'bg-green-100 text-green-800' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Internal Page
              </button>
            </div>
          </div>
          
          {form.type === 'url' ? (
            <div className="space-y-2">
              <Label htmlFor="item-url">URL *</Label>
              <Input
                id="item-url"
                value={form.url}
                onChange={(e) => onFormChange({ ...form, url: e.target.value })}
                placeholder="https://example.com or /about"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="item-page">Page *</Label>
              <select
                id="item-page"
                value={form.pageId}
                onChange={(e) => onFormChange({ ...form, pageId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a page</option>
                {pages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title} ({page.slug})
                  </option>
                ))}
              </select>
              {pages.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">No pages available. Please create pages first.</p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-target">Open In</Label>
              <select
                id="item-target"
                value={form.target}
                onChange={(e) => onFormChange({ ...form, target: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="_self">Same Window</option>
                <option value="_blank">New Window</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-parent">Parent Item</Label>
              <select
                id="item-parent"
                value={form.parentId || "none"}
                onChange={(e) => onFormChange({ ...form, parentId: e.target.value === "none" ? "" : e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">None (top level)</option>
                {parentItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={onSave} 
              disabled={!form.title.trim() || (form.type === 'url' && !form.url.trim()) || (form.type === 'page' && !form.pageId) || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Add'} Item
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 