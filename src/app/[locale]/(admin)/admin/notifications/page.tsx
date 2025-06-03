'use client';

import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BellIcon, CheckIcon, AlertCircleIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useParams } from 'next/navigation';
// Define user type
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
}

// GraphQL queries and mutations
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      firstName
      lastName
      role {
        id
        name
        description
      }
    }
  }
`;

const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      id
      title
      message
      type
      isRead
      createdAt
    }
  }
`;

// Notification types
const notificationTypes = [
  { value: 'SYSTEM', label: 'System Message' },
  { value: 'DOCUMENT', label: 'Document Update' },
  { value: 'TASK', label: 'Task Assignment' },
  { value: 'APPOINTMENT', label: 'Appointment' },
];

export default function AdminNotificationsPage() {
  const { locale } = useParams();
  const [recipientType, setRecipientType] = useState<'all' | 'role' | 'specific'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notificationType, setNotificationType] = useState<string>('SYSTEM');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [showInDashboard, setShowInDashboard] = useState<boolean>(true);
  
  // Get users for selection
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery(GET_USERS, {
    client,
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Failed to fetch users:', error.message);
      setStatusMessage({
        type: 'error',
        text: `Error fetching users: ${error.message}. You might not have admin privileges.`
      });
    }
  });
  
  useEffect(() => {
    // Display error message if users query fails
    if (usersError) {
      setStatusMessage({
        type: 'error',
        text: `Cannot load users list: ${usersError.message}. Make sure you have admin privileges.`
      });
    }
  }, [usersError]);
  
  // Create notification mutation
  const [createNotification, { loading: mutationLoading }] = useMutation(CREATE_NOTIFICATION, {
    client,
    onCompleted: () => {
      setStatusMessage({ 
        type: 'success', 
        text: 'Notification successfully created and sent!' 
      });
      resetForm();
    },
    onError: (error) => {
      setStatusMessage({ 
        type: 'error', 
        text: `Error creating notification: ${error.message}` 
      });
    }
  });

  // Extract unique roles from users
  const uniqueRoles = usersData?.users 
    ? [...new Set((usersData.users as User[]).map(user => user.role.name))]
    : [];
  
  const resetForm = () => {
    setTitle('');
    setMessage('');
    setRecipientType('all');
    setSelectedRole('');
    setSelectedUser('');
    setNotificationType('SYSTEM');
    setIsPreview(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setStatusMessage(null);
      let targetUsers: string[] = [];
      
      // Determine target users based on selection
      if (recipientType === 'all') {
        // For "all users" we'll use a special value the backend will recognize
        await createNotification({
          variables: {
            input: {
              userId: "ALL_USERS", // Special value for all users
              type: notificationType,
              title,
              message,
              relatedItemType: "NOTIFICATION",
            }
          }
        });
        return; // Early return since we already sent the notification
      } else if (recipientType === 'role' && selectedRole) {
        if (!usersData?.users) {
          setStatusMessage({ 
            type: 'error', 
            text: 'Cannot filter users by role as user data is not available. Try sending to all users instead.' 
          });
          return;
        }
        
        // Filter users by role
        targetUsers = (usersData.users as User[])
          .filter(user => user.role.name === selectedRole)
          .map(user => user.id);
          
        if (targetUsers.length === 0) {
          setStatusMessage({ 
            type: 'error', 
            text: `No users found with role ${selectedRole}` 
          });
          return;
        }
      } else if (recipientType === 'specific' && selectedUser) {
        // Specific user
        targetUsers = [selectedUser];
      } else {
        setStatusMessage({ type: 'error', text: 'Please select valid recipients' });
        return;
      }
      
      // For role-based or specific users, process each user individually
      for (const userId of targetUsers) {
        await createNotification({
          variables: {
            input: {
              userId,
              type: notificationType,
              title,
              message,
              relatedItemType: "NOTIFICATION",
            }
          }
        });
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatusMessage({
        type: 'error',
        text: `Error: ${errorMessage}`
      });
    }
  };
  
  const togglePreview = () => setIsPreview(!isPreview);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Notification Management</h1>
        <p className="text-muted-foreground">
          Create and send notifications to users of the platform.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Notification</CardTitle>
              <CardDescription>
                Fill out the form below to create a new notification for users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Notification Content */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="font-medium">Notification Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter notification title"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message" className="font-medium">Notification Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter notification message"
                      className="mt-1 h-32"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type" className="font-medium">Notification Type</Label>
                    <Select 
                      value={notificationType} 
                      onValueChange={setNotificationType}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select notification type" />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="dashboard" 
                      checked={showInDashboard} 
                      onCheckedChange={() => setShowInDashboard(!showInDashboard)} 
                    />
                    <Label htmlFor="dashboard">Show in user dashboard</Label>
                  </div>
                </div>
                
                {/* Recipients */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Select Recipients</h3>
                  
                  <RadioGroup value={recipientType} onValueChange={(value: 'all' | 'role' | 'specific') => setRecipientType(value)} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">All Users</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="role" id="role" />
                      <Label htmlFor="role">Users by Role</Label>
                    </div>
                    
                    {recipientType === 'role' && (
                      <div className="ml-6">
                        <Select 
                          value={selectedRole} 
                          onValueChange={setSelectedRole}
                          disabled={recipientType !== 'role'}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueRoles.map((role: string) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific" id="specific" />
                      <Label htmlFor="specific">Specific User</Label>
                    </div>
                    
                    {recipientType === 'specific' && (
                      <div className="ml-6">
                        <Select 
                          value={selectedUser} 
                          onValueChange={setSelectedUser}
                          disabled={recipientType !== 'specific' || usersLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={usersLoading ? "Loading users..." : "Select user"} />
                          </SelectTrigger>
                          <SelectContent>
                            {usersData?.users ? (usersData.users as User[]).map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.email})
                              </SelectItem>
                            )) : null}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </RadioGroup>
                </div>
                
                {/* Status message */}
                {statusMessage && (
                  <div className={`p-3 rounded-md ${
                    statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="flex">
                      {statusMessage.type === 'success' ? (
                        <CheckIcon className="h-5 w-5 mr-2" />
                      ) : (
                        <AlertCircleIcon className="h-5 w-5 mr-2" />
                      )}
                      <p>{statusMessage.text}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 justify-end">
                  <Button type="button" variant="outline" onClick={togglePreview}>
                    {isPreview ? "Edit Notification" : "Preview"}
                  </Button>
                  <Button type="submit" disabled={mutationLoading}>
                    {mutationLoading ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Preview and Information Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {isPreview ? "Notification Preview" : "Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPreview ? (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <BellIcon className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{title || "Notification Title"}</span>
                  </div>
                  <p className="text-sm text-gray-600">{message || "Notification message will appear here."}</p>
                  <div className="text-xs text-gray-400 pt-2">
                    Just now • {notificationTypes.find(t => t.value === notificationType)?.label || "System"}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm">
                    Use this form to create notifications for users of the platform. You can send notifications to:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>All users at once</li>
                    <li>Users with a specific role</li>
                    <li>An individual user</li>
                  </ul>
                  <p className="text-sm mt-4">
                    Notifications will appear in the user&apos;s notification center and can be marked as read by the recipient.
                  </p>
                  
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = `/${locale}/admin/notifications/manage`} 
                      className="flex items-center gap-2"
                    >
                      <span className="mr-1">Manage All Notifications</span>
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      View and manage all notifications in the system
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-gray-500">
                {isPreview ? 
                  "This is how your notification will appear to users." : 
                  "Sending too many notifications might decrease their effectiveness."}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 