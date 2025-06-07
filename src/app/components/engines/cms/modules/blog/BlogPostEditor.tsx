'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  Save, 
  Eye, 
  EyeOff,
  Image, 
  FileText, 
  Tag, 
  Globe, 
  X,
  Plus,
  Upload,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  User,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';

interface Blog {
  id: string;
  title: string;
  slug: string;
}

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImageId?: string;
  featuredImageMedia?: {
    id: string;
    fileUrl: string;
    altText?: string;
    title?: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  blogId: string;
  authorId: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  categories: string[];
  readTime?: number;
  mediaIds: string[];
}

interface BlogPostEditorProps {
  postId?: string;
  blogId?: string;
  locale?: string;
}

export function BlogPostEditor({ postId, blogId, locale = 'en' }: BlogPostEditorProps) {
  const router = useRouter();
  
  // State management
  const [postData, setPostData] = useState<PostData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT',
    blogId: blogId || '',
    authorId: '',
    metaTitle: '',
    metaDescription: '',
    tags: [],
    categories: [],
    mediaIds: []
  });
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // SEO and content analysis
  const [seoScore, setSeoScore] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  
  // Tag and category management
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load initial datahis field is required
  useEffect(() => {
    loadInitialData();
  }, [postId]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && postData.title && !loading) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [postData, autoSave, loading]);

  // Content analysis
  useEffect(() => {
    analyzeContent();
  }, [postData.content, postData.title, postData.metaDescription]);

  async function loadInitialData() {
    setLoading(true);
    try {
      // Load blogs and authors
      const [blogsResponse, authorsResponse] = await Promise.all([
        gqlRequest<{ blogs: Blog[] }>(`
          query GetBlogs {
            blogs {
              id
              title
              slug
            }
          }
        `),
        gqlRequest<{ users: Author[] }>(`
          query GetAuthors {
            users(filter: { role: "AUTHOR" }) {
              id
              firstName
              lastName
              email
            }
          }
        `)
      ]);

      setBlogs(blogsResponse.blogs || []);
      setAuthors(authorsResponse.users || []);

      // Load existing post data if editing
      if (postId) {
        const postResponse = await gqlRequest<{ post: PostData }>(`
          query GetPost($id: ID!) {
            post(id: $id) {
              id
              title
              slug
              content
              excerpt
              featuredImageId
              featuredImageMedia {
                id
                fileUrl
                altText
                title
              }
              status
              publishedAt
              blogId
              authorId
              metaTitle
              metaDescription
              tags
              categories
              readTime
              mediaIds
            }
          }
        `, { id: postId });

        if (postResponse.post) {
          setPostData(postResponse.post);
        }
      }

      // Load available tags and categories
      await loadTagsAndCategories();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load editor data');
    } finally {
      setLoading(false);
    }
  }

  async function loadTagsAndCategories() {
    try {
      const tagsResponse = await gqlRequest<{ posts: Array<{ tags: string[] }> }>(`
        query GetAllTags {
          posts {
            tags
          }
        }
      `);

      const allTags = Array.from(new Set(
        tagsResponse.posts.flatMap(p => p.tags || [])
      ));

      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error loading tags and categories:', error);
    }
  }

  function analyzeContent() {
    const content = postData.content;
    const title = postData.title;
    const metaDescription = postData.metaDescription;
    
    // Word count
    const words = content.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Estimated read time (average 200 words per minute)
    const estimatedReadTime = Math.ceil(words.length / 200);
    setPostData(prev => ({ ...prev, readTime: estimatedReadTime }));
    
    // Basic SEO score calculation
    let seoPoints = 0;
    if (title.length >= 30 && title.length <= 60) seoPoints += 20;
    if (metaDescription.length >= 120 && metaDescription.length <= 160) seoPoints += 20;
    if (content.length >= 300) seoPoints += 20;
    if (postData.featuredImageMedia) seoPoints += 15;
    if (postData.tags.length >= 3) seoPoints += 15;
    if (content.includes(title.toLowerCase())) seoPoints += 10;
    
    setSeoScore(seoPoints);
    
    // Basic readability score (simplified)
    const avgWordsPerSentence = words.length / (content.split(/[.!?]+/).length || 1);
    const readabilityPoints = Math.max(0, 100 - (avgWordsPerSentence * 2));
    setReadabilityScore(Math.min(100, readabilityPoints));
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  const handleFieldChange = useCallback((field: keyof PostData, value: string | string[] | number | boolean | null | PostData['featuredImageMedia']) => {
    setPostData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from title
      if (field === 'title' && !postId) {
        updated.slug = generateSlug(value as string);
      }
      
      // Auto-generate meta title if not manually set
      if (field === 'title' && !prev.metaTitle) {
        updated.metaTitle = value as string;
      }
      
      return updated;
    });
  }, [postId]);

  const handleAutoSave = useCallback(async () => {
    if (!postData.title || saving) return;
    
    try {
      await handleSave(true);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [postData, saving]);

  async function handleSave(isAutoSave = false) {
    if (!postData.title || !postData.content || !postData.blogId) {
      if (!isAutoSave) {
        toast.error('Please fill in required fields');
      }
      return;
    }

    setSaving(true);
    try {
      const mutation = postId ? 'updatePost' : 'createPost';
      const variables = postId 
        ? { id: postId, input: postData }
        : { input: postData };

      const query = `
        mutation ${mutation}(${postId ? '$id: ID!, ' : ''}$input: ${postId ? 'UpdatePostInput' : 'CreatePostInput'}!) {
          ${mutation}(${postId ? 'id: $id, ' : ''}input: $input) {
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

      const response = await gqlRequest<{ [key: string]: { success: boolean; message: string; post: { id: string } } }>(
        query, 
        variables
      );

      const result = response[mutation];
      
      if (result.success) {
        if (!isAutoSave) {
          toast.success(result.message || 'Post saved successfully');
        }
        
        // If creating a new post, redirect to edit mode
        if (!postId && result.post?.id) {
          router.push(`/${locale}/cms/blog/posts/edit/${result.post.id}`);
        }
      } else {
        throw new Error(result.message || 'Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      if (!isAutoSave) {
        toast.error('Failed to save post');
      }
    } finally {
      setSaving(false);
    }
  }

  function handleAddTag() {
    if (newTag && !postData.tags.includes(newTag)) {
      handleFieldChange('tags', [...postData.tags, newTag]);
      setNewTag('');
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    handleFieldChange('tags', postData.tags.filter(tag => tag !== tagToRemove));
  }

  function handleAddCategory() {
    if (newCategory && !postData.categories.includes(newCategory)) {
      handleFieldChange('categories', [...postData.categories, newCategory]);
      setNewCategory('');
    }
  }

  function handleRemoveCategory(categoryToRemove: string) {
    handleFieldChange('categories', postData.categories.filter(cat => cat !== categoryToRemove));
  }

  function handlePublish() {
    handleFieldChange('status', 'PUBLISHED');
    handleFieldChange('publishedAt', new Date().toISOString());
    handleSave();
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const previewDeviceClasses = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {postId ? 'Edit Post' : 'Create New Post'}
                </h1>
                {lastSaved && (
                  <p className="text-sm text-muted-foreground">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Auto-save toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
                <Label className="text-sm">Auto-save</Label>
              </div>
              
              {/* Preview toggle */}
              <Button
                variant={previewMode ? 'default' : 'outline'}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              
              {/* Save draft */}
              <Button
                variant="outline"
                onClick={() => handleSave()}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              
              {/* Publish */}
              <Button
                onClick={handlePublish}
                disabled={saving || !postData.title || !postData.content}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {postData.status === 'PUBLISHED' ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {previewMode ? (
          /* Preview Mode */
          <div className="space-y-6">
            {/* Preview Device Selector */}
            <div className="flex justify-center gap-2">
              <Button
                variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('tablet')}
              >
                <Tablet className="h-4 w-4 mr-2" />
                Tablet
              </Button>
              <Button
                variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>

            {/* Preview Content */}
            <div className={`${previewDeviceClasses[previewDevice]} bg-white rounded-lg shadow-lg overflow-hidden`}>
              <article className="p-8">
                {postData.featuredImageMedia && (
                  <img
                    src={postData.featuredImageMedia.fileUrl}
                    alt={postData.title}
                    className="w-full h-64 object-cover rounded-lg mb-8"
                  />
                )}
                
                <header className="mb-8">
                  <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
                  {postData.excerpt && (
                    <p className="text-xl text-gray-600 mb-4">{postData.excerpt}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {authors.find(a => a.id === postData.authorId)?.firstName} {authors.find(a => a.id === postData.authorId)?.lastName}
                      </span>
                    </div>
                    {postData.readTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{postData.readTime} min read</span>
                      </div>
                    )}
                  </div>
                </header>
                
                <div className="prose max-w-none">
                  {postData.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
                
                {postData.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="flex flex-wrap gap-2">
                      {postData.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Post Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={postData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="Enter post title..."
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={postData.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder="url-slug"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      URL: /{locale}/blog/post/{postData.slug}
                    </p>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={postData.excerpt}
                      onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                      placeholder="Brief description of the post..."
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={postData.content}
                      onChange={(e) => handleFieldChange('content', e.target.value)}
                      placeholder="Write your post content here..."
                      rows={20}
                      className="font-mono"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>{wordCount} words</span>
                      <span>~{postData.readTime} min read</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      SEO Settings
                    </div>
                    <Badge variant={seoScore >= 80 ? 'default' : seoScore >= 60 ? 'secondary' : 'destructive'}>
                      SEO Score: {seoScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={postData.metaTitle}
                      onChange={(e) => handleFieldChange('metaTitle', e.target.value)}
                      placeholder="SEO title for search engines..."
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {postData.metaTitle.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={postData.metaDescription}
                      onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
                      placeholder="SEO description for search engines..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {postData.metaDescription.length}/160 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Publishing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="blog">Blog *</Label>
                    <Select value={postData.blogId} onValueChange={(value) => handleFieldChange('blogId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blog..." />
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
                    <Label htmlFor="author">Author *</Label>
                    <Select value={postData.authorId} onValueChange={(value) => handleFieldChange('authorId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select author..." />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map(author => (
                          <SelectItem key={author.id} value={author.id}>
                            {author.firstName} {author.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={postData.status} onValueChange={(value) => handleFieldChange('status', value as PostData['status'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Featured Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {postData.featuredImageMedia ? (
                    <div className="space-y-4">
                      <img
                        src={postData.featuredImageMedia.fileUrl}
                        alt="Featured"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFieldChange('featuredImageId', '')}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button size="sm" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {postData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>

                  {availableTags.length > 0 && (
                    <div>
                      <Label className="text-sm">Suggested tags:</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {availableTags.filter(tag => !postData.tags.includes(tag)).slice(0, 10).map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => handleFieldChange('tags', [...postData.tags, tag])}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Add category..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button size="sm" onClick={handleAddCategory}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {postData.categories.map(category => (
                      <Badge key={category} variant="secondary" className="flex items-center gap-1">
                        {category}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveCategory(category)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>SEO Score</span>
                      <span>{seoScore}/100</span>
                    </div>
                    <Progress value={seoScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Readability</span>
                      <span>{readabilityScore}/100</span>
                    </div>
                    <Progress value={readabilityScore} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Word count:</span>
                      <span>{wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Read time:</span>
                      <span>~{postData.readTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Characters:</span>
                      <span>{postData.content.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 