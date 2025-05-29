import { notFound } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { Post } from '@/types/blog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const query = `
      query GetPostBySlug($slug: String!) {
        postBySlug(slug: $slug) {
          id
          title
          slug
          content
          excerpt
          # featuredImage // Field removed
          featuredImageMedia {
            fileUrl
          }
          status
          publishedAt
          metaTitle
          metaDescription
          tags
          categories
          readTime
          createdAt
          updatedAt
          author {
            id
            firstName
            lastName
            profileImageUrl
          }
          blog {
            id
            title
            slug
          }
        }
      }
    `;
    
    const response = await gqlRequest<{ postBySlug: Post | null }>(query, { slug });
    return response.postBySlug;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }
  
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImageMedia?.fileUrl ? [post.featuredImageMedia.fileUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post || post.status !== 'PUBLISHED') {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link 
            href={`/${locale}/blog`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
        
        {/* Article Header */}
        <header className="mb-8">
          {/* Featured Image */}
        {post.featuredImageMedia?.fileUrl && (
            <div className="mb-8">
              <img
              src={post.featuredImageMedia.fileUrl}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.profileImageUrl && (
                  <img
                    src={post.author.profileImageUrl}
                    alt={`${post.author.firstName} ${post.author.lastName}`}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>
                  By {post.author.firstName} {post.author.lastName}
                </span>
              </div>
            )}
            
            {/* Published Date */}
            {post.publishedAt && (
              <span>
                Published {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </span>
            )}
            
            {/* Read Time */}
            {post.readTime && (
              <span>{post.readTime} min read</span>
            )}
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>
        
        {/* Article Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
            />
          </CardContent>
        </Card>
        
        {/* Article Footer */}
        <footer className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Blog Link */}
            {post.blog && (
              <Link
                href={`/${locale}/blog`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                More from {post.blog.title}
              </Link>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
} 