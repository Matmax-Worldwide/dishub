'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Share2, 
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  categories: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  blog: {
    id: string;
    title: string;
    slug: string;
    description: string;
  };
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt: string;
  readTime?: number;
  author: {
    firstName: string;
    lastName: string;
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const locale = params.locale as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    setLoading(true);
    try {
      const response = await gqlRequest<{ post: BlogPost }>(`
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
            createdAt
            updatedAt
            readTime
            viewCount
            likeCount
            commentCount
            metaTitle
            metaDescription
            tags
            categories
            author {
              id
              firstName
              lastName
              email
              avatar
              bio
            }
            blog {
              id
              title
              slug
              description
            }
          }
        }
      `, { id: postId });

      if (!response.post || response.post.status !== 'PUBLISHED') {
        notFound();
        return;
      }

      setPost(response.post);
      
      // Load related posts
      await loadRelatedPosts(response.post.blog.id, response.post.tags);
      
    } catch (error) {
      console.error('Error loading post:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  }

  async function loadRelatedPosts(blogId: string, tags: string[]) {
    try {
      const response = await gqlRequest<{ posts: RelatedPost[] }>(`
        query GetRelatedPosts($blogId: ID!, $tags: [String!], $excludeId: ID!) {
          posts(
            filter: { 
              blogId: $blogId, 
              status: PUBLISHED,
              tags: $tags
            }
            exclude: $excludeId
            limit: 3
          ) {
            id
            title
            slug
            excerpt
            featuredImage
            publishedAt
            readTime
            author {
              firstName
              lastName
            }
          }
        }
      `, { 
        blogId, 
        tags: tags.slice(0, 3), // Use first 3 tags for related posts
        excludeId: postId 
      });

      setRelatedPosts(response.posts || []);
    } catch (error) {
      console.error('Error loading related posts:', error);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function handleShare() {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href={`/${locale}/blog`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <motion.header 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Blog Info */}
            <div className="mb-4">
              <Link 
                href={`/${locale}/blog/${post.blog.slug}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {post.blog.title}
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author.firstName} {post.author.lastName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              
              {post.readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} min read</span>
                </div>
              )}

              {post.viewCount && (
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount} views</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={isLiked ? 'text-red-600 border-red-600' : ''}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {post.likeCount || 0}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={isBookmarked ? 'text-blue-600 border-blue-600' : ''}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                Save
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {post.commentCount && (
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {post.commentCount} Comments
                </Button>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </motion.header>

          {/* Featured Image */}
          {post.featuredImage && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
          )}

          {/* Article Content */}
          <motion.article 
            className="prose prose-lg max-w-none mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-xl p-8 shadow-sm">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-6 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.article>

          {/* Author Bio */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {post.author.avatar ? (
                      <Image
                        src={post.author.avatar}
                        alt={`${post.author.firstName} ${post.author.lastName}`}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {post.author.firstName} {post.author.lastName}
                    </h3>
                    {post.author.bio && (
                      <p className="text-gray-600 mb-3">{post.author.bio}</p>
                    )}
                    <p className="text-sm text-gray-500">{post.author.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.section 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <Link href={`/${locale}/blog/post/${relatedPost.slug}`}>
                        {relatedPost.featuredImage && (
                          <div className="relative h-48 w-full">
                            <Image
                              src={relatedPost.featuredImage}
                              alt={relatedPost.title}
                              fill
                              className="object-cover rounded-t-lg"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2">
                            {relatedPost.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {relatedPost.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {relatedPost.author.firstName} {relatedPost.author.lastName}
                            </span>
                            {relatedPost.readTime && (
                              <span>{relatedPost.readTime} min read</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
