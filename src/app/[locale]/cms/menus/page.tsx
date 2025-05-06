'use client';

import { useState } from 'react';
import { 
  PlusCircleIcon, 
  MenuIcon, 
  Edit2Icon, 
  Trash2Icon, 
  ArrowUpRightIcon 
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'internal' | 'external';
  children?: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  location: string;
  itemCount: number;
  lastUpdated: string;
  items: MenuItem[];
}

export default function MenusPage() {
  const [menus] = useState<Menu[]>([
    {
      id: '1',
      name: 'Main Navigation',
      location: 'Header',
      itemCount: 5,
      lastUpdated: '2023-05-15',
      items: [
        { id: '1-1', label: 'Home', url: '/', type: 'internal' },
        { id: '1-2', label: 'About', url: '/about', type: 'internal' },
        { id: '1-3', label: 'Services', url: '/services', type: 'internal' },
        { id: '1-4', label: 'Blog', url: '/blog', type: 'internal' },
        { id: '1-5', label: 'Contact', url: '/contact', type: 'internal' }
      ]
    },
    {
      id: '2',
      name: 'Footer Links',
      location: 'Footer',
      itemCount: 3,
      lastUpdated: '2023-05-10',
      items: [
        { id: '2-1', label: 'Privacy Policy', url: '/privacy', type: 'internal' },
        { id: '2-2', label: 'Terms & Conditions', url: '/terms', type: 'internal' },
        { id: '2-3', label: 'Contact Us', url: '/contact', type: 'internal' }
      ]
    }
  ]);

  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  const toggleExpandMenu = (menuId: string) => {
    if (expandedMenuId === menuId) {
      setExpandedMenuId(null);
    } else {
      setExpandedMenuId(menuId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Menu Manager</h1>
        <button className="px-4 py-2 bg-[#01319c] text-white rounded-md flex items-center">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          New Menu
        </button>
      </div>
      
      <p className="text-gray-500">
        Create and manage navigation menus for your website.
      </p>
      
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
                  <p className="text-sm text-gray-500">Location: {menu.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-xs text-gray-500">
                  {menu.itemCount} items • Last updated: {menu.lastUpdated}
                </div>
                <button 
                  onClick={() => toggleExpandMenu(menu.id)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  {expandedMenuId === menu.id ? 'Collapse' : 'Expand'}
                </button>
                <button className="p-1 text-blue-600 hover:text-blue-800">
                  <Edit2Icon className="h-5 w-5" />
                </button>
                <button className="p-1 text-red-500 hover:text-red-700">
                  <Trash2Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {expandedMenuId === menu.id && (
              <div className="p-4">
                <div className="mb-4 flex justify-between">
                  <h4 className="font-medium">Menu Items</h4>
                  <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
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
                      {menu.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.url}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.type === 'internal' ? 'Internal Page' : 'External Link'}
                              {item.type === 'external' && <ArrowUpRightIcon className="ml-1 h-3 w-3" />}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 