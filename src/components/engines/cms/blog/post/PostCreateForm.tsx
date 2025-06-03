'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MediaLibrary } from '@/components/engines/cms/media/MediaLibrary';
import { MediaItem } from '@/components/engines/cms/media/types';
import { 
  Save, 
  Eye, 
  Image, 
  FileText, 
  Calendar, 
  Tag, 
  Globe, 
  X,
  Plus,
  Upload,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Blog {
  id: string;
  title: string;
  slug: string;
}

interface PostCreateFormProps {
  blogId?: string;
}

export default function PostCreateForm({ blogId }: PostCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [featuredImage, setFeaturedImage] = useState<MediaItem | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaSelectionMode, setMediaSelectionMode] = useState<'featured' | 'content'>('content');
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT' as const,
    publishedAt: '',
    blogId: blogId || '',
    metaTitle: '',
    metaDescription: '',
    tags: [] as string[],
    categories: [] as string[],
    readTime: 0
  });

  // Load blogs on component mount
  useEffect(() => {
    loadBlogs();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, formData.slug]);

  // Auto-generate meta title from title
  useEffect(() => {
    if (formData.title && !formData.metaTitle) {
      setFormData(prev => ({ ...prev, metaTitle: formData.title }));
    }
  }, [formData.title, formData.metaTitle]);

  // Calculate read time based on content
  useEffect(() => {
    const wordsPerMinute = 200;
    const wordCount = formData.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    setFormData(prev => ({ ...prev, readTime }));
  }, [formData.content]);

  const loadBlogs = async () => {
    try {
      const query = `
        query GetBlogs {
          blogs {
            id
            title
            slug
          }
        }
      `;
      const response = await gqlRequest<{ blogs: Blog[] }>(query);
      setBlogs(response.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
      toast.error('Failed to load blogs');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMediaSelect = (media: MediaItem) => {
    if (mediaSelectionMode === 'featured') {
      setFeaturedImage(media);
      setShowMediaLibrary(false);
      toast.success('Featured image selected');
    } else {
      if (!selectedMedia.find(m => m.id === media.id)) {
        setSelectedMedia(prev => [...prev, media]);
        toast.success('Media added to post');
      }
      setShowMediaLibrary(false);
    }
  };

  const removeMedia = (mediaId: string) => {
    setSelectedMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()]
      }));
      setCategoryInput('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.blogId) {
      toast.error('Please select a blog');
      return;
    }

    setIsLoading(true);

    try {
      // Get current user for authorId
      const userQuery = `
        query Me {
          me {
            id
          }
        }
      `;
      const userResponse = await gqlRequest<{ me: { id: string } }>(userQuery);
      
      if (!userResponse.me?.id) {
        toast.error('Authentication required');
      return;
    }

      const mutation = `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
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

      const input = {
        ...formData,
        status,
        authorId: userResponse.me.id,
        publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
        featuredImageId: featuredImage?.id || null,
        mediaIds: selectedMedia.map(m => m.id)
      };

      const response = await gqlRequest<{
        createPost: {
          success: boolean;
          message: string;
          post: { id: string; title: string; slug: string };
        };
      }>(mutation, { input });

      if (response.createPost.success) {
        toast.success(response.createPost.message);
        router.push(`/cms/blog/posts`);
      } else {
        toast.error(response.createPost.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new tab
    const previewData = {
      ...formData,
      featuredImage: featuredImage?.fileUrl,
      media: selectedMedia
    };
    
    // Store preview data in sessionStorage
    sessionStorage.setItem('postPreview', JSON.stringify(previewData));
    window.open('/cms/blog/preview', '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Post</h1>
          <p className="text-muted-foreground">Write and publish a new blog post</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!formData.title}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('DRAFT')} 
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSubmit('PUBLISHED')} 
            disabled={isLoading}
          >
            <Globe className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Post Content
              </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter post title..."
                  className="text-lg"
                  />
                </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="post-url-slug"
                  />
                </div>

              <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Brief description of the post..."
                    rows={3}
                  />
                </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your post content here..."
                  rows={15}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Estimated read time: {formData.readTime} minute{formData.readTime !== 1 ? 's' : ''}
                </p>
              </div>
              </CardContent>
            </Card>

          {/* Media Section */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Media
              </CardTitle>
                <CardDescription>
                Add images, videos, and other media to your post
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* Featured Image */}
              <div>
                <Label>Featured Image</Label>
                {featuredImage ? (
                  <div className="relative">
                    <img
                      src={featuredImage.fileUrl}
                      alt={featuredImage.altText || featuredImage.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setFeaturedImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={() => {
                      setMediaSelectionMode('featured');
                      setShowMediaLibrary(true);
                    }}
                  >
                    <Upload className="h-6 w-6 mr-2" />
                    Select Featured Image
                  </Button>
                )}
              </div>

              {/* Content Media */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Content Media</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMediaSelectionMode('content');
                      setShowMediaLibrary(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Media
                  </Button>
                </div>

                {selectedMedia.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedMedia.map((media) => (
                      <div key={media.id} className="relative group">
                        {media.fileType.startsWith('image/') ? (
                          <img
                            src={media.fileUrl}
                            alt={media.altText || media.title}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMedia(media.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-center mt-1 truncate">
                          {media.title}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No media added yet
                  </p>
                )}
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Publish Settings
              </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="blog">Blog *</Label>
                <Select value={formData.blogId} onValueChange={(value) => handleInputChange('blogId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a blog" />
                  </SelectTrigger>
                  <SelectContent>
                    {blogs.map((blog) => (
                      <SelectItem key={blog.id} value={blog.id}>
                        {blog.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>

              <div>
                <Label htmlFor="publishedAt">Publish Date</Label>
                  <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => handleInputChange('publishedAt', e.target.value)}
                  />
                </div>
            </CardContent>
          </Card>

          {/* Tags & Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags & Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                </div>

                {/* Categories */}
              <div>
                <Label>Categories</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    placeholder="Add category..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  />
                  <Button size="sm" onClick={addCategory}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.categories.map((category) => (
                    <Badge key={category} variant="outline" className="cursor-pointer" onClick={() => removeCategory(category)}>
                      {category} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="SEO title..."
                />
                </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="SEO description..."
                  rows={3}
                />
              </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Select {mediaSelectionMode === 'featured' ? 'Featured Image' : 'Media'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMediaLibrary(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MediaLibrary
                onSelect={handleMediaSelect}
                isSelectionMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 