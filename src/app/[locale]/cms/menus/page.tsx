'use client';

import { useState, useEffect } from 'react';
import { 
  PlusCircleIcon, 
  MenuIcon, 
  Edit2Icon, 
  ArrowUpRightIcon,
  Loader2Icon
} from 'lucide-react';
import Link from 'next/link';
import { gqlRequest } from '@/lib/graphql-client';

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
  headerStyle?: {
    id: string;
    transparency: number;
    headerSize: string;
    menuAlignment: string;
    menuButtonStyle: string;
    mobileMenuStyle: string;
    mobileMenuPosition: string;
    transparentHeader: boolean;
    borderBottom: boolean;
  } | null;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
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
              }
            }
          }
        `;

        const response = await gqlRequest<{ menus: Menu[] }>(query);
        if (response && response.menus) {
          setMenus(response.menus);
        }
      } catch (err) {
        console.error('Error fetching menus:', err);
        setError('Failed to load menus. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const toggleExpandMenu = (menuId: string) => {
    if (expandedMenuId === menuId) {
      setExpandedMenuId(null);
    } else {
      setExpandedMenuId(menuId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading menus...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Menu Manager</h1>
        <Link href="/cms/menus/create" className="px-4 py-2 bg-[#01319c] text-white rounded-md flex items-center">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          New Menu
        </Link>
      </div>
      
      <p className="text-gray-500">
        Create and manage navigation menus for your website.
      </p>
      
      {menus.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <MenuIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Menus Found</h3>
          <p className="mt-2 text-gray-500">
            You haven&apos;t created any menus yet. Click the button above to create your first menu.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                    <MenuIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{menu.name}</h3>
                    <p className="text-sm text-gray-500">Location: {menu.location || 'Not assigned'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500">
                    {menu.items.length} items • Last updated: {formatDate(menu.updatedAt)}
                  </div>
                  <button 
                    onClick={() => toggleExpandMenu(menu.id)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  >
                    {expandedMenuId === menu.id ? 'Collapse' : 'Expand'}
                  </button>
                  <Link href={`/cms/menus/edit/${menu.id}`} className="p-1 text-blue-600 hover:text-blue-800">
                    <Edit2Icon className="h-5 w-5" />
                  </Link>
                </div>
              </div>
              
              {expandedMenuId === menu.id && (
                <div className="p-4">
                  <div className="mb-4 flex justify-between">
                    <h4 className="font-medium">Menu Items</h4>
                    <Link 
                      href={`/cms/menus/edit/${menu.id}?addItem=true`} 
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      Add Item
                    </Link>
                  </div>
                  
                  {menu.items.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No menu items added yet.</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {menu.items
                            .filter(item => !item.parentId) // Show only top-level items
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.url || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {item.pageId ? 'Internal Page' : 'External Link'}
                                    {!item.pageId && item.url && <ArrowUpRightIcon className="ml-1 h-3 w-3" />}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link 
                                    href={`/cms/menus/edit/${menu.id}?itemId=${item.id}`} 
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    Edit
                                  </Link>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 