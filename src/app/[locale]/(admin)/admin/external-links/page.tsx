"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import {
  Card,
  CardContent,
  CardDescription,  
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";

// GraphQL queries
const GET_EXTERNAL_LINKS = gql`
  query GetExternalLinks {
    externalLinks {
      id
      name
      url
      icon
      description
      isActive
      order
      accessType
      allowedRoles
      allowedUsers
      deniedUsers
      createdAt
      updatedAt
    }
  }
`;

const DELETE_EXTERNAL_LINK = gql`
  mutation DeleteExternalLink($id: ID!) {
    deleteExternalLink(id: $id)
  }
`;

// Define interface for external link
interface ExternalLinkType {
  id: string;
  name: string;
  url: string;
  icon: string;
  description?: string;
  isActive: boolean;
  order: number;
  accessType: 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED';
  allowedRoles: string[];
  allowedUsers: string[];
  deniedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

// Helper function to check the authentication token
function checkAuthToken() {
  if (typeof window !== 'undefined') {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('session-token='))
      ?.split('=')[1];
      
    const token = cookieValue && cookieValue.trim();
    console.log('Auth token check:', token ? `Found (${token.substring(0, 10)}...)` : 'Not found');
    return token ? true : false;
  }
  return false;
}

export default function ExternalLinksPage() {
  const { locale } = useParams();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ExternalLinkType | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const hasAuthToken = checkAuthToken();
    console.log('Component mounted, authentication token present:', hasAuthToken);
  }, []);

  // GraphQL hooks
  const { data, loading, refetch } = useQuery(GET_EXTERNAL_LINKS, {
    client,
    fetchPolicy: 'network-only',
  });

  // Refresh data when dialogs close
  useEffect(() => {
    if (!isDeleteDialogOpen) {
      console.log('Refreshing external links data');
      refetch();
    }
  }, [isDeleteDialogOpen, refetch]);

  const [deleteExternalLink, { loading: deleteLoading }] = useMutation(DELETE_EXTERNAL_LINK, {
    client,
    fetchPolicy: 'no-cache', // Ensure no caching
    context: {
      headers: {
        // Include token in header for authentication
        authorization: typeof window !== 'undefined' 
          ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]}` 
          : '',
      },
    },
    onCompleted: (data) => {
      console.log('Delete response:', JSON.stringify(data));
      
      if (data?.deleteExternalLink) {
        console.log('External link deleted successfully:', data.deleteExternalLink);
        refetch();
        setIsDeleteDialogOpen(false);
        toast.success("External link deleted successfully");
      } else {
        console.error("Failed to delete external link - received null response");
        toast.error("Server returned null - check server logs");
      }
    },
    onError: (error) => {
      // Enhanced error logging
      console.error('GraphQL error deleting external link:', error);
      console.error('Network error details:', error.networkError);
      console.error('GraphQL error details:', error.graphQLErrors);
      
      // More helpful error message
      let errorMessage = "Failed to delete external link";
      if (error.graphQLErrors?.length > 0) {
        errorMessage = `Error: ${error.graphQLErrors[0].message}`;
      } else if (error.networkError) {
        errorMessage = "Network error: Check your connection and try again";
      }
      
      toast.error(errorMessage);
    },
  });

  const handleDelete = (link: ExternalLinkType) => {
    setSelectedLink(link);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedLink) return;
    
    deleteExternalLink({
      variables: {
        id: selectedLink.id
      }
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">External Links Management</h1>
        <Button className="flex items-center gap-2" asChild>
          <Link href={`/${locale}/admin/external-links/create`}>
            <Plus className="h-4 w-4" />
            Add External Link
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>External Links</CardTitle>
          <CardDescription>
            Manage links displayed in the dashboard sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.externalLinks?.length > 0 ? (
                  data.externalLinks.map((link: ExternalLinkType) => (
                    <TableRow key={link.id}>
                      <TableCell>{link.order}</TableCell>
                      <TableCell className="font-medium">{link.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {link.url}
                        </a>
                      </TableCell>
                      <TableCell>{link.icon}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${link.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            asChild
                          >
                            <Link href={`/${locale}/admin/external-links/edit/${link.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleDelete(link)}
                            disabled={deleteLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No external links found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the external link &ldquo;{selectedLink?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 