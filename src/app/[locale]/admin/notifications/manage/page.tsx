'use client';

import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { BellIcon, MoreHorizontal, ArrowLeft, Trash2, Search, RefreshCw } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useParams } from 'next/navigation';

// Define notification type
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedItemId?: string;
  relatedItemType?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// GraphQL queries and mutations
const GET_ALL_NOTIFICATIONS = gql`
  query GetAllNotifications {
    allNotifications {
      id
      type
      title
      message
      isRead
      relatedItemId
      relatedItemType
      createdAt
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;

const DELETE_MULTIPLE_NOTIFICATIONS = gql`
  mutation DeleteMultipleNotifications($ids: [ID!]!) {
    deleteMultipleNotifications(ids: $ids)
  }
`;

export default function ManageNotificationsPage() {
  const params = useParams();
  const locale = params.locale;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [isDeleteMultiple, setIsDeleteMultiple] = useState(false);
  
  // Get all notifications
  const { data, loading, error, refetch } = useQuery(GET_ALL_NOTIFICATIONS, {
    client,
    fetchPolicy: 'network-only',
    onError: (error) => {
      toast.error(`Failed to fetch notifications: ${error.message}`);
    }
  });
  
  // Delete notification mutation
  const [deleteNotification, { loading: deleteLoading }] = useMutation(DELETE_NOTIFICATION, {
    client,
    onCompleted: () => {
      toast.success('Notification deleted successfully');
      refetch();
      setShowDeleteDialog(false);
      setNotificationToDelete(null);
    },
    onError: (error) => {
      toast.error(`Error deleting notification: ${error.message}`);
    }
  });
  
  // Delete multiple notifications mutation
  const [deleteMultipleNotifications, { loading: deleteMultipleLoading }] = useMutation(DELETE_MULTIPLE_NOTIFICATIONS, {
    client,
    onCompleted: (data) => {
      toast.success(`${data.deleteMultipleNotifications} notifications deleted successfully`);
      refetch();
      setShowDeleteDialog(false);
      setSelectedNotifications([]);
    },
    onError: (error) => {
      toast.error(`Error deleting notifications: ${error.message}`);
    }
  });
  
  const notifications = data?.allNotifications || [];
  
  // Filter notifications based on search term
  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      notification.title.toLowerCase().includes(searchLower) ||
      notification.message.toLowerCase().includes(searchLower) ||
      notification.user.firstName.toLowerCase().includes(searchLower) ||
      notification.user.lastName.toLowerCase().includes(searchLower) ||
      notification.user.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n: Notification) => n.id));
    }
  };
  
  // Handle single notification selection
  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter((nId) => nId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };
  
  // Confirm notification deletion
  const confirmDelete = (id: string) => {
    setNotificationToDelete(id);
    setIsDeleteMultiple(false);
    setShowDeleteDialog(true);
  };
  
  // Confirm multiple notifications deletion
  const confirmDeleteMultiple = () => {
    if (selectedNotifications.length === 0) {
      toast.error('No notifications selected');
      return;
    }
    
    setIsDeleteMultiple(true);
    setShowDeleteDialog(true);
  };
  
  // Execute deletion
  const handleDelete = () => {
    if (isDeleteMultiple) {
      deleteMultipleNotifications({
        variables: { ids: selectedNotifications }
      });
    } else if (notificationToDelete) {
      deleteNotification({
        variables: { id: notificationToDelete }
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Unknown date';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => window.location.href = `/${locale}/admin/notifications`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Manage Notifications</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>
                Manage all notifications in the system
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {selectedNotifications.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={confirmDeleteMultiple}
                  disabled={deleteMultipleLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected ({selectedNotifications.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-red-500">Error loading notifications</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                <Button className="mt-4" onClick={() => refetch()}>Try Again</Button>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <BellIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <p className="text-lg font-medium mt-4">No notifications found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? 'Try a different search term' : 'There are no notifications in the system'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0} 
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[220px]">Recipient</TableHead>
                    <TableHead className="w-[180px]">Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification: Notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNotifications.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {notification.user.firstName} {notification.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {notification.user.email}
                        </div>
                      </TableCell>
                      <TableCell>{notification.title}</TableCell>
                      <TableCell>
                        <div className="max-w-[400px] truncate">{notification.message}</div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                          {notification.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          notification.isRead 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(notification.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => confirmDelete(notification.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isDeleteMultiple 
                ? `Delete ${selectedNotifications.length} notifications?` 
                : 'Delete notification?'}
            </DialogTitle>
            <DialogDescription>
              {isDeleteMultiple 
                ? 'This action cannot be undone. The selected notifications will be permanently removed from the system.' 
                : 'This action cannot be undone. The notification will be permanently removed from the system.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteLoading || deleteMultipleLoading}
            >
              {(deleteLoading || deleteMultipleLoading) ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 