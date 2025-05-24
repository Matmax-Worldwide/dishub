'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { Blog } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface BlogEditPageContentProps {
  blogId: string;
  locale?: string;
}

export function BlogEditPageContent({ blogId, locale = 'en' }: BlogEditPageContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    isActive: true
  });

  // Load blog data
  useEffect(() => {
    loadBlog();
  }, [blogId]);

  async function loadBlog() {
    setLoading(true);
    try {
      // Get the blog details using the REST API
      const response = await fetch(`/api/blogs/${blogId}`);
      const blogData = await response.json();
      
      // If there's an error or blog not found
      if (!response.ok) {
        toast.error(blogData.message || 'Failed to load blog');
        return;
      }
      
      setBlog(blogData);
      
      // Initialize form data
      setFormData({
        title: blogData.title || '',
        description: blogData.description || '',
        slug: blogData.slug || '',
        isActive: blogData.isActive ?? true
      });
    } catch (error) {
      console.error('Error loading blog:', error);
      toast.error('An error occurred while loading the blog');
    } finally {
      setLoading(false);
    }
  }

  // Handle title change and auto-generate slug
  const handleTitleChange = (value: string) => {
    // Only auto-generate slug if the slug hasn't been manually edited
    if (formData.slug === blog?.slug) {
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        title: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a blog title');
      return;
    }

    setSaving(true);
    
    try {
      // Update blog using GraphQL client (preferred in your request)
      const result = await graphqlClient.updateBlog(blogId, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        slug: formData.slug.trim(),
        isActive: formData.isActive
      });

      if (result.success) {
        toast.success('Blog updated successfully!');
        // Navigate back, considering locale path
        router.push(`/${locale}/cms/blog`);
      } else {
        toast.error(result.message || 'Failed to update blog');
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      
      // Fallback to REST API if GraphQL fails
      try {
        const response = await fetch(`/api/blogs/${blogId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            slug: formData.slug.trim(),
            isActive: formData.isActive
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Blog updated successfully!');
          router.push(`/${locale}/cms/blog`);
        } else {
          toast.error(result.message || 'Failed to update blog');
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        toast.error('Failed to update blog. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-10 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Blog Not Found</h2>
            <p className="text-muted-foreground mb-4">The blog you&apos;re looking for could not be found.</p>
            <Button onClick={() => router.push(`/${locale}/cms/blog`)}>
              Return to Blogs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push(`/${locale}/cms/blog`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Blog</h1>
            <p className="text-muted-foreground">Update your blog settings</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Blog Details</CardTitle>
            <CardDescription>
              Modify the information for your blog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter blog title"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-friendly-slug"
              />
              <p className="text-sm text-muted-foreground">
                The URL-friendly version of the title
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter blog description"
                rows={4}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Whether this blog is active and visible
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={saving || !formData.title.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 