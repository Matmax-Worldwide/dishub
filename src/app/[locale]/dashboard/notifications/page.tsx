'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { BellIcon, CheckIcon, TrashIcon, FilterIcon } from 'lucide-react';

type NotificationType = 'assignment' | 'payment' | 'schedule' | 'system' | 'document';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  date: string;
}

// Sample notification data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New assignment available',
    message: 'You have been assigned to a new interpretation job on July 15, 2023.',
    type: 'assignment',
    isRead: false,
    date: '2023-07-12T10:30:00Z'
  },
  {
    id: '2',
    title: 'Payment processed',
    message: 'Your payment for June services has been processed successfully.',
    type: 'payment',
    isRead: true,
    date: '2023-07-10T08:15:00Z'
  },
  {
    id: '3',
    title: 'Schedule change',
    message: 'Your appointment on July 20 has been rescheduled to July 21 at 2:00 PM.',
    type: 'schedule',
    isRead: false,
    date: '2023-07-09T16:45:00Z'
  },
  {
    id: '4',
    title: 'System maintenance',
    message: 'The platform will be under maintenance on July 22 from 1:00 AM to 3:00 AM EST.',
    type: 'system',
    isRead: false,
    date: '2023-07-08T11:20:00Z'
  },
  {
    id: '5',
    title: 'Document verification',
    message: 'Your submitted documents have been verified successfully.',
    type: 'document',
    isRead: true,
    date: '2023-07-05T09:10:00Z'
  }
];

export default function NotificationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { locale } = useParams();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  
  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };
  
  // Filter notifications based on current filter settings
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filter === 'all' || notification.type === filter;
    const matchesReadStatus = !showUnreadOnly || !notification.isRead;
    return matchesType && matchesReadStatus;
  });
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };
  
  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="notification-filter" className="sr-only">
                Filter notifications
              </label>
              <div className="relative rounded-md shadow-sm">
                <select
                  id="notification-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All types</option>
                  <option value="assignment">Assignments</option>
                  <option value="payment">Payments</option>
                  <option value="schedule">Schedule</option>
                  <option value="system">System</option>
                  <option value="document">Documents</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FilterIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="unread-only"
                name="unread-only"
                type="checkbox"
                checked={showUnreadOnly}
                onChange={() => setShowUnreadOnly(!showUnreadOnly)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="unread-only" className="ml-2 block text-sm text-gray-900">
                Unread only
              </label>
            </div>
          </div>
          
          <div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CheckIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Mark all as read
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(notification.date)}</p>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                      >
                        <span className="sr-only">Mark as read</span>
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                      <span className="sr-only">Delete</span>
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don&apos;t have any notifications matching your current filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 