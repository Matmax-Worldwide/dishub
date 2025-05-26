import { gqlRequest } from '@/lib/graphql-client';
import { Post } from '@/types/blog';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getPublishedPosts(): Promise<Post[]> {
  try {
    const query = `
      query GetPublishedPosts {
        posts(filter: { status: "PUBLISHED" }) {
          id
          title
          slug
          excerpt
          featuredImage
          publishedAt
          readTime
          tags
          categories
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
    
    const response = await gqlRequest<{ posts: Post[] }>(query);
    return response.posts || [];
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
}

export const metadata = {
  title: 'Blog',
  description: 'Read our latest articles and insights',
};

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const posts = await getPublishedPosts();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our latest articles, insights, and stories
          </p>
        </header>
        
        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/${locale}/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {/* Featured Image */}
                  {post.featuredImage && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    
                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {/* Author */}
                      {post.author && (
                        <div className="flex items-center gap-2">
                          {post.author.profileImageUrl && (
                            <img
                              src={post.author.profileImageUrl}
                              alt={`${post.author.firstName} ${post.author.lastName}`}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>
                            {post.author.firstName} {post.author.lastName}
                          </span>
                        </div>
                      )}
                      
                      {/* Published Date */}
                      {post.publishedAt && (
                        <span>
                          {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                      
                      {/* Read Time */}
                      {post.readTime && (
                        <span>{post.readTime} min read</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Excerpt */}
                    {post.excerpt && (
                      <CardDescription className="line-clamp-3 mb-4">
                        {post.excerpt}
                      </CardDescription>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">No posts yet</h2>
            <p className="text-muted-foreground">
              Check back soon for new articles and insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 