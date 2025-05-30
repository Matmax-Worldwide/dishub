'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceCategory } from '@/types/calendar'; // Assuming a ServiceCategory type definition
import { toast } from 'sonner';
import { X } from 'lucide-react';

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

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {initialData?.id ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="text-sm text-gray-500">
              {initialData?.id ? 'Update category information' : 'Create a new service category'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            {formError && (
              <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                {formError}
              </div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? 'Saving...' : (initialData?.id ? 'Update Category' : 'Create Category')}
          </Button>
        </div>
      </div>
    </div>
  );
}
