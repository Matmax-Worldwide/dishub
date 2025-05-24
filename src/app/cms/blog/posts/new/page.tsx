'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import graphqlClient from '@/lib/graphql-client';
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Tag input component
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
            {tag} ×
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Type a tag and press Enter"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState<Array<{ id: string; title: string }>>([]);
  
  // Type guard for session user
  const sessionUser = session?.user as { id?: string; email?: string; name?: string; image?: string } | undefined;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    tags: [] as string[],
    categories: [] as string[],
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    publishedAt: '',
    blogId: '',
    // SEO fields
    metaTitle: '',
    metaDescription: '',
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, formData.slug]);

  // Load blogs on mount
  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      const blogsList = await graphqlClient.getBlogs();
      setBlogs(blogsList);
      // Set the first blog as default if available
      if (blogsList.length > 0 && !formData.blogId) {
        setFormData(prev => ({ ...prev, blogId: blogsList[0].id }));
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      toast.error('Failed to load blogs');
    }
  }

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    
    if (!formData.blogId) {
      toast.error('Please select a blog');
      return;
    }

    setLoading(true);
    
    try {
      const postData = {
        ...formData,
        status: asDraft ? 'DRAFT' : formData.status,
        authorId: sessionUser?.id || '',
        publishedAt: formData.status === 'PUBLISHED' && !formData.publishedAt 
          ? new Date().toISOString() 
          : formData.publishedAt || null,
      };

      const result = await graphqlClient.createPost(postData);
      
      if (result.success) {
        toast.success(asDraft ? 'Post saved as draft!' : 'Post created successfully!');
        router.push('/cms/blog/posts');
      } else {
        toast.error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('An error occurred while creating the post');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new window/tab
    const previewData = encodeURIComponent(JSON.stringify(formData));
    window.open(`/preview/post?data=${previewData}`, '_blank');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Post</h1>
            <p className="text-muted-foreground">Write and publish your article</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!formData.title || !formData.content}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading || !formData.title || !formData.content}
          >
            <Globe className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Title, slug, and main content of your post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Title*</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter post title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="post-url-slug"
                    />
                  </div>

                  <div>
                    <Label htmlFor="blog">Blog*</Label>
                    <Select
                      value={formData.blogId}
                      onValueChange={(value) => setFormData({ ...formData, blogId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a blog" />
                      </SelectTrigger>
                      <SelectContent>
                        {blogs.map(blog => (
                          <SelectItem key={blog.id} value={blog.id}>
                            {blog.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief description of your post"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Content*</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your post content here..."
                      rows={15}
                      required
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      You can use Markdown for formatting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Metadata</CardTitle>
                <CardDescription>Tags, categories, and publishing options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input
                    id="featuredImage"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                  />
                </div>
                
                <div>
                  <Label>Categories</Label>
                  <TagInput
                    tags={formData.categories}
                    onChange={(categories) => setFormData({ ...formData, categories })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <Switch
                    id="status"
                    checked={formData.status === 'PUBLISHED'}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, status: checked ? 'PUBLISHED' : 'DRAFT' })
                    }
                  />
                </div>
                
                {formData.status === 'PUBLISHED' && (
                  <div>
                    <Label htmlFor="publishedAt">Publish Date</Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your post for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO optimized title (defaults to post title)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Brief description for search results"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
} 