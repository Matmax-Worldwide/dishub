'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { gqlRequest } from '@/lib/graphql-client';
import { Post } from '@/types/blog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';

interface PostEditFormProps {
  blogId: string;
  postId: string;
  locale?: string;
}

export function PostEditForm({ blogId, postId, locale = 'en' }: PostEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'DRAFT',
    publishedAt: '',
    metaTitle: '',
    metaDescription: '',
    tags: '',
    categories: ''
  });

  // Load post data
  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    setLoading(true);
    try {
      // Get the post details using GraphQL client
      // First, we need to get the post by ID, not by slug
      const query = `
        query GetPost($id: ID!) {
          post(id: $id) {
            id
            title
            slug
            content
            excerpt
            featuredImage
            status
            publishedAt
            blogId
            authorId
            metaTitle
            metaDescription
            tags
            categories
            readTime
            createdAt
            updatedAt
          }
        }
      `;
      
      const postData = await gqlRequest<{ post: Post | null }>(query, { id: postId });
      
      if (!postData.post) {
        toast.error('Post not found');
        return;
      }
      
      setPost(postData.post);
      
      // Initialize form data
      setFormData({
        title: postData.post.title || '',
        slug: postData.post.slug || '',
        content: postData.post.content || '',
        excerpt: postData.post.excerpt || '',
        featuredImage: postData.post.featuredImage || '',
        status: postData.post.status || 'DRAFT',
        publishedAt: postData.post.publishedAt || '',
        metaTitle: postData.post.metaTitle || '',
        metaDescription: postData.post.metaDescription || '',
        tags: postData.post.tags?.join(', ') || '',
        categories: postData.post.categories?.join(', ') || ''
      });
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('An error occurred while loading the post');
    } finally {
      setLoading(false);
    }
  }

  // Handle title change and auto-generate slug
  const handleTitleChange = (value: string) => {
    // Only auto-generate slug if the slug hasn't been manually edited
    if (formData.slug === post?.slug) {
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
      toast.error('Please enter a post title');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter post content');
      return;
    }

    setSaving(true);
    
    try {
      // Update post using GraphQL mutation
      const updatePostMutation = `
        mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
          updatePost(id: $id, input: $input) {
            success
            message
            post {
              id
              title
              slug
            }
          }
        }
      `;
      
      const result = await gqlRequest<{ 
        updatePost: { 
          success: boolean; 
          message?: string;
          post: Post | null;
        }
      }>(updatePostMutation, { 
        id: post!.id,
        input: {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
          excerpt: formData.excerpt.trim() || null,
          featuredImage: formData.featuredImage.trim() || null,
        status: formData.status,
        publishedAt: formData.status === 'PUBLISHED' && !post?.publishedAt ? new Date().toISOString() : undefined,
          metaTitle: formData.metaTitle.trim() || null,
          metaDescription: formData.metaDescription.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        categories: formData.categories ? formData.categories.split(',').map(cat => cat.trim()) : []
        }
      });

      if (result.updatePost.success) {
        toast.success('Post updated successfully!');
        router.push(`/${locale}/cms/blog/posts/${blogId}`);
      } else {
        toast.error(result.updatePost.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('An error occurred while updating the post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Post Not Found</h2>
            <p className="text-muted-foreground mb-4">The post you&apos;re looking for could not be found.</p>
            <Button onClick={() => router.push(`/${locale}/cms/blog/posts/${blogId}`)}>
              Return to Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push(`/${locale}/cms/blog/posts/${blogId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Post</h1>
            <p className="text-muted-foreground">Update your blog post</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>
                  Edit the main content of your post
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
                    placeholder="Enter post title"
                    required
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content*</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter post content"
                    rows={12}
                    required
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary of the post"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
                <CardDescription>
                  Optimize your post for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Meta Title */}
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO title (defaults to post title if empty)"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="SEO description (defaults to excerpt if empty)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
                <CardDescription>
                  Control how your post is published
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={formData.status === 'PUBLISHED'}
                      onCheckedChange={(checked) => 
                        setFormData({ 
                          ...formData, 
                          status: checked ? 'PUBLISHED' : 'DRAFT' 
                        })
                      }
                    />
                    <Label htmlFor="status">
                      {formData.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.status === 'PUBLISHED' 
                      ? 'This post will be visible to readers'
                      : 'This post will be saved as a draft'
                    }
                  </p>
                </div>

                {/* Publication Info */}
                {post.publishedAt && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Published:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleString()}
                    </p>
                  </div>
                )}

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

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input
                    id="featuredImage"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Comma-separated list of tags
                  </p>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label htmlFor="categories">Categories</Label>
                  <Input
                    id="categories"
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    placeholder="category1, category2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Comma-separated list of categories
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
            >
              {saving ? 'Saving...' : `Save as ${formData.status === 'PUBLISHED' ? 'Published' : 'Draft'}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 