'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ServiceCategory } from '@/types/calendar'; // Assuming a ServiceCategory type definition
import { toast } from 'sonner';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ServiceCategory>) => Promise<void>;
  initialData?: Partial<ServiceCategory> | null;
  allCategories?: ServiceCategory[]; // To populate parent selector
  isSaving?: boolean;
}

export default function CategoryForm({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  allCategories = [], 
  isSaving 
}: CategoryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [parentId, setParentId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setDisplayOrder(initialData.displayOrder || 0);
      setParentId(initialData.parentId || null);
    } else {
      // Defaults for new category
      setName('');
      setDescription('');
      setDisplayOrder(0);
      setParentId(null);
    }
    setFormError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Category name is required.');
      toast.error('Category name is required.');
      return;
    }

    const saveData: Partial<ServiceCategory> = {
      name,
      description: description.trim() || null,
      displayOrder: Number(displayOrder),
      parentId: parentId === 'none' || parentId === '' ? null : parentId, // Handle "None" selection
    };
    
    if (initialData?.id) {
        saveData.id = initialData.id;
    }
    
    await onSave(saveData);
  };
  
  // Filter out the current category and its descendants from parent options
  const getParentCategoryOptions = (): ServiceCategory[] => {
    if (!initialData?.id) return allCategories; // No restrictions for new categories

    const descendantIds = new Set<string>();
    const getDescendants = (categoryId: string) => {
        descendantIds.add(categoryId);
        allCategories
            .filter(cat => cat.parentId === categoryId)
            .forEach(child => getDescendants(child.id));
    };
    getDescendants(initialData.id);
    
    return allCategories.filter(cat => !descendantIds.has(cat.id));
  };
  const parentOptions = getParentCategoryOptions();


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Service Category' : 'Create New Service Category'}</DialogTitle>
          <DialogDescription>
            {initialData?.id ? 'Update the details of this category.' : 'Fill in the details for the new category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Haircuts, Massages"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., All types of haircuts and styling"
              rows={3}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first.</p>
          </div>
          <div>
            <Label htmlFor="parentId">Parent Category</Label>
            <Select 
                value={parentId || 'none'} 
                onValueChange={(value) => setParentId(value === 'none' ? null : value)}
                disabled={isSaving}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top-level category)</SelectItem>
                {parentOptions.map(cat => (
                  <SelectItem key={cat.id} value={cat.id} disabled={cat.id === initialData?.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             <p className="text-xs text-muted-foreground mt-1">
                A category cannot be its own parent or a child of its own descendants.
            </p>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData?.id ? 'Saving...' : 'Creating...') : (initialData?.id ? 'Save Changes' : 'Create Category')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
