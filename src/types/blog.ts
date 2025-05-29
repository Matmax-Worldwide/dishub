export interface Blog {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  posts?: Post[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  blogId: string;
  authorId: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  categories?: string[];
  readTime?: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string;
  };
  blog?: {
    id: string;
    title: string;
    slug: string;
  };
} 