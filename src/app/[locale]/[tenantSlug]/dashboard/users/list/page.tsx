'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  SearchIcon,
  MoreHorizontalIcon,
  UserPlusIcon,
  FilterIcon,
  MailIcon,
  CalendarIcon,
  EditIcon
} from 'lucide-react';

export default function UsersListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const mockUsers = [
    { 
      id: 1, 
      name: 'John Smith', 
      email: 'john.smith@company.com', 
      role: 'TenantAdmin', 
      status: 'active',
      lastLogin: '2024-01-15 10:30',
      avatar: '',
      department: 'Administration',
      joinDate: '2023-06-15'
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@company.com', 
      role: 'TenantManager', 
      status: 'active',
      lastLogin: '2024-01-14 16:45',
      avatar: '',
      department: 'Operations',
      joinDate: '2023-08-20'
    },
    { 
      id: 3, 
      name: 'Mike Wilson', 
      email: 'mike.wilson@company.com', 
      role: 'Employee', 
      status: 'inactive',
      lastLogin: '2024-01-10 09:15',
      avatar: '',
      department: 'Sales',
      joinDate: '2023-09-10'
    },
    { 
      id: 4, 
      name: 'Emily Davis', 
      email: 'emily.davis@company.com', 
      role: 'Employee', 
      status: 'active',
      lastLogin: '2024-01-15 14:20',
      avatar: '',
      department: 'Marketing',
      joinDate: '2023-11-05'
    },
    { 
      id: 5, 
      name: 'David Brown', 
      email: 'david.brown@company.com', 
      role: 'Employee', 
      status: 'pending',
      lastLogin: 'Never',
      avatar: '',
      department: 'IT',
      joinDate: '2024-01-12'
    },
  ];

  const getRoleBadge = (role: string) => {
    const variants = {
      TenantAdmin: 'bg-purple-100 text-purple-800',
      TenantManager: 'bg-blue-100 text-blue-800',
      Employee: 'bg-green-100 text-green-800'
    };
    return variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users List</h1>
          <p className="text-gray-600 mt-1">Detailed view of all users in your tenant</p>
        </div>
        <Button>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="TenantAdmin">Tenant Admin</option>
                <option value="TenantManager">Tenant Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Complete list of users with detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <MailIcon className="h-3 w-3 mr-1" />
                          {user.email}
                        </span>
                        <span>•</span>
                        <span>{user.department}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right text-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getRoleBadge(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="text-gray-500">
                        Last login: {user.lastLogin}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Join Date:</span>
                      <div className="font-medium flex items-center mt-1">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {user.joinDate}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <div className="font-medium mt-1">{user.department}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="font-medium mt-1">{user.status}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Actions:</span>
                      <div className="flex space-x-1 mt-1">
                        <Button variant="outline" size="sm">Edit</Button>
                        {user.status === 'inactive' && (
                          <Button variant="outline" size="sm">Activate</Button>
                        )}
                        {user.status === 'pending' && (
                          <Button variant="outline" size="sm">Approve</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 