'use client';

import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { SearchIcon, UserPlusIcon, FilterIcon } from 'lucide-react';

// User interface
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  createdAt: string;
}

// GraphQL queries
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      firstName
      lastName
      phoneNumber
      role
      createdAt
    }
  }
`;

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Get users
  const { data, loading, error } = useQuery(GET_USERS, {
    client,
    fetchPolicy: 'network-only',
  });
  
  const users = data?.users as User[] || [];
  
  const filteredUsers = users.filter(user => {
    // Apply search filter
    const searchMatch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply role filter
    const roleMatch = !selectedRole || user.role === selectedRole;
    
    return searchMatch && roleMatch;
  });
  
  // Get unique roles for filtering
  const roles = [...new Set(users.map(user => user.role))];
  
  const handleRoleFilter = (role: string | null) => {
    setSelectedRole(role === selectedRole ? null : role);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all users in the system.
        </p>
      </div>
      
      <Tabs defaultValue="all-users">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Manage the users of the application. Filter, search, or select to perform actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap flex items-center">
                      <FilterIcon className="h-4 w-4 mr-1" /> Filter by role:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <Badge 
                          key={role}
                          variant={selectedRole === role ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleRoleFilter(role)}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Users Table */}
                {loading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">Error loading users</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No users found matching the criteria
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.firstName} {user.lastName}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge className={getRoleBadgeColor(user.role)}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline">View</Button>
                                  <Button size="sm" variant="outline">Send Notification</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="flex justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <UserPlusIcon className="h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admins Only</CardTitle>
              <CardDescription>
                View and manage admin users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => user.role === 'ADMIN')
                      .map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Users</CardTitle>
              <CardDescription>
                Users added in the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return new Date(user.createdAt) >= thirtyDaysAgo;
                      })
                      .map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 