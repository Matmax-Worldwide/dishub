'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { ServiceCategory } from '@/types/calendar';
import CategoryForm from './CategoryForm';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

export default function CategoryManager() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<ServiceCategory> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await graphqlClient.serviceCategories(); 
      setCategories(response || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(`Failed to load categories: ${err.message || 'Unknown error'}`);
      toast.error(`Failed to load categories: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddNew = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (category: ServiceCategory) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsSaving(true);
    try {
      await graphqlClient.deleteServiceCategory({ id: categoryToDelete.id });
      toast.success(`Category "${categoryToDelete.name}" deleted successfully.`);
      fetchCategories(); 
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      toast.error(`Failed to delete category: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleSaveCategory = async (data: Partial<ServiceCategory>) => {
    setIsSaving(true);
    setError(null);
    try {
      let result;
      if (editingCategory?.id) { 
        result = await graphqlClient.updateServiceCategory({ id: editingCategory.id, input: data });
        toast.success(`Category "${result.name}" updated successfully.`);
      } else { 
        result = await graphqlClient.createServiceCategory({ input: data });
        toast.success(`Category "${result.name}" created successfully.`);
      }
      fetchCategories(); 
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      console.error('Failed to save category:', err);
      const errorMsg = `Failed to save category: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getParentCategoryName = (parentId: string | null | undefined): string => {
    if (!parentId) return 'N/A (Top Level)';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : 'Unknown Parent';
  };


  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>{/* Placeholder for potential filters or search */}</div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
        </Button>
      </div>

      {error && !isLoading && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
           <span className="font-medium">Error:</span> {error}
         </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Parent Category</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Display Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading && categories.length > 0 && ( 
                <TableRow>
                    <TableCell colSpan={5} className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground inline-block mr-2" />
                        Refreshing data...
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No service categories found.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">
                  {category.description || 'N/A'}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {getParentCategoryName(category.parentId)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center text-sm text-muted-foreground">
                  <Badge variant="outline">{category.displayOrder}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteConfirmation(category)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialData={editingCategory}
        allCategories={categories} // Pass all categories for parent selector
        isSaving={isSaving}
      />

      {categoryToDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category
                "{categoryToDelete.name}". Associated services might also be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
