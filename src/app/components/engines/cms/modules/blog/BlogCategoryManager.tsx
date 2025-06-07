'use client';

import React, { useState, useEffect } from 'react';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Folder,
  Search,
  MoreHorizontal,
  Save,
  Hash
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/app/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
  createdAt: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
  createdAt: string;
}

interface BlogCategoryManagerProps {
  blogId?: string;
  locale?: string;
}

export function BlogCategoryManager({ blogId }: BlogCategoryManagerProps) {
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  
  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'tag'; item: Category | BlogTag } | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [tagForm, setTagForm] = useState({
    name: '',
    description: '',
    color: '#10B981'
  });

  // Load data
  useEffect(() => {
    loadCategories();
    loadTags();
  }, [blogId]);

  async function loadCategories() {
    try {
      const query = `
        query GetCategories($blogId: ID) {
          categories(blogId: $blogId) {
            id
            name
            slug
            description
            color
            postCount
            createdAt
          }
        }
      `;

      const response = await gqlRequest<{ categories: Category[] }>(query, { blogId });
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  }

  async function loadTags() {
    try {
      const query = `
        query GetTags($blogId: ID) {
          tags(blogId: $blogId) {
            id
            name
            slug
            description
            color
            postCount
            createdAt
          }
        }
      `;

      const response = await gqlRequest<{ tags: BlogTag[] }>(query, { blogId });
      setTags(response.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function handleSaveCategory() {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const mutation = editingCategory ? 'updateCategory' : 'createCategory';
      const variables = editingCategory 
        ? { 
            id: editingCategory.id, 
            input: {
              ...categoryForm,
              slug: generateSlug(categoryForm.name),
              blogId
            }
          }
        : { 
            input: {
              ...categoryForm,
              slug: generateSlug(categoryForm.name),
              blogId
            }
          };

      const query = `
        mutation ${mutation}(${editingCategory ? '$id: ID!, ' : ''}$input: ${editingCategory ? 'UpdateCategoryInput' : 'CreateCategoryInput'}!) {
          ${mutation}(${editingCategory ? 'id: $id, ' : ''}input: $input) {
            success
            message
            category {
              id
              name
              slug
            }
          }
        }
      `;

      const response = await gqlRequest<{ [key: string]: { success: boolean; message: string } }>(
        query, 
        variables
      );

      const result = response[mutation];
      
      if (result.success) {
        toast.success(result.message || `Category ${editingCategory ? 'updated' : 'created'} successfully`);
        setCategoryDialogOpen(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', color: '#3B82F6' });
        loadCategories();
      } else {
        throw new Error(result.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  }

  async function handleSaveTag() {
    if (!tagForm.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const mutation = editingTag ? 'updateTag' : 'createTag';
      const variables = editingTag 
        ? { 
            id: editingTag.id, 
            input: {
              ...tagForm,
              slug: generateSlug(tagForm.name),
              blogId
            }
          }
        : { 
            input: {
              ...tagForm,
              slug: generateSlug(tagForm.name),
              blogId
            }
          };

      const query = `
        mutation ${mutation}(${editingTag ? '$id: ID!, ' : ''}$input: ${editingTag ? 'UpdateTagInput' : 'CreateTagInput'}!) {
          ${mutation}(${editingTag ? 'id: $id, ' : ''}input: $input) {
            success
            message
            tag {
              id
              name
              slug
            }
          }
        }
      `;

      const response = await gqlRequest<{ [key: string]: { success: boolean; message: string } }>(
        query, 
        variables
      );

      const result = response[mutation];
      
      if (result.success) {
        toast.success(result.message || `Tag ${editingTag ? 'updated' : 'created'} successfully`);
        setTagDialogOpen(false);
        setEditingTag(null);
        setTagForm({ name: '', description: '', color: '#10B981' });
        loadTags();
      } else {
        throw new Error(result.message || 'Failed to save tag');
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error('Failed to save tag');
    }
  }

  async function handleDelete() {
    if (!itemToDelete) return;

    try {
      const { type, item } = itemToDelete;
      const mutation = type === 'category' ? 'deleteCategory' : 'deleteTag';
      
      const query = `
        mutation ${mutation}($id: ID!) {
          ${mutation}(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ [key: string]: { success: boolean; message: string } }>(
        query, 
        { id: item.id }
      );

      const result = response[mutation];
      
      if (result.success) {
        toast.success(result.message || `${type} deleted successfully`);
        if (type === 'category') {
          loadCategories();
        } else {
          loadTags();
        }
      } else {
        throw new Error(result.message || `Failed to delete ${type}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
    setCategoryDialogOpen(true);
  }

  function openEditTag(tag: BlogTag) {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#10B981'
    });
    setTagDialogOpen(true);
  }

  function openDeleteDialog(type: 'category' | 'tag', item: Category | BlogTag) {
    setItemToDelete({ type, item });
    setDeleteDialogOpen(true);
  }

  // Filter items based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Categories & Tags</h1>
          <p className="text-muted-foreground mt-2">
            Organize your blog content with categories and tags
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Categories ({filteredCategories.length})
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Tags ({filteredTags.length})
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button onClick={() => setCategoryDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No categories found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Create your first category to organize your posts'}
                  </p>
                  <Button onClick={() => setCategoryDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredCategories.map(category => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{category.postCount} posts</span>
                            <span>Created {formatDate(category.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditCategory(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog('category', category)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tags</h2>
            <Button onClick={() => setTagDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredTags.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tags found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Create your first tag to label your posts'}
                  </p>
                  <Button onClick={() => setTagDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tag
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTags.map(tag => (
                <Card key={tag.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="secondary" 
                          className="text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          #{tag.name}
                        </Badge>
                        <div>
                          {tag.description && (
                            <p className="text-sm text-muted-foreground">
                              {tag.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{tag.postCount} posts</span>
                            <span>Created {formatDate(tag.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTag(tag)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog('tag', tag)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              Categories help organize your blog posts into broad topics.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Name *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name..."
              />
            </div>
            
            <div>
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="categoryColor">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="categoryColor"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              <Save className="h-4 w-4 mr-2" />
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </DialogTitle>
            <DialogDescription>
              Tags are keywords that describe specific aspects of your posts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tagName">Name *</Label>
              <Input
                id="tagName"
                value={tagForm.name}
                onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tag name..."
              />
            </div>
            
            <div>
              <Label htmlFor="tagDescription">Description</Label>
              <Textarea
                id="tagDescription"
                value={tagForm.description}
                onChange={(e) => setTagForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="tagColor">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="tagColor"
                  value={tagForm.color}
                  onChange={(e) => setTagForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={tagForm.color}
                  onChange={(e) => setTagForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTag}>
              <Save className="h-4 w-4 mr-2" />
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
              {itemToDelete?.item && 'postCount' in itemToDelete.item && itemToDelete.item.postCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: This {itemToDelete.type} is used by {itemToDelete.item.postCount} post(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 