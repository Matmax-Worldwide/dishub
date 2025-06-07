'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { User as UserType } from '@/types/calendar';

interface UserWithRole extends Partial<UserType> {
  role?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

interface UserSearchSelectProps {
  users: UserWithRole[];
  selectedUserId?: string;
  onUserSelect: (user: UserWithRole) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function UserSearchSelect({
  users,
  selectedUserId,
  onUserSelect,
  disabled = false,
  placeholder = "Search for a user..."
}: UserSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  // Find selected user when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const handleUserSelect = (user: UserWithRole) => {
    setSelectedUser(user);
    onUserSelect(user);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    onUserSelect({} as UserWithRole);
    setSearchTerm('');
  };

  const getUserInitials = (user: UserWithRole) => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      {/* Selected User Display */}
      {selectedUser && selectedUser.id ? (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getUserInitials(selectedUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </div>
                  {selectedUser.role?.name && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs mt-1 ${getRoleBadgeColor(selectedUser.role.name)}`}
                    >
                      {selectedUser.role.name}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                disabled={disabled}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Search Input */
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              disabled={disabled}
              className="pl-10 pr-4"
            />
          </div>

          {/* Dropdown Results */}
          {isOpen && !disabled && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-[9999] max-h-64 overflow-hidden shadow-lg border">
              <CardContent className="p-0">
                {filteredUsers.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        {user.role?.name && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRoleBadgeColor(user.role.name)}`}
                          >
                            {user.role.name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchTerm ? 'No users found matching your search.' : 'Start typing to search for users...'}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 