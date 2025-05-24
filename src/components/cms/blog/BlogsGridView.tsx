import { Blog } from '@/types/blog';
import { BlogCard } from './BlogCard';

export interface BlogsGridViewProps {
  blogs: Blog[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPosts: (id: string) => void;
}

export function BlogsGridView({ blogs, onEdit, onDelete, onViewPosts }: BlogsGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {blogs.map(blog => (
        <BlogCard
          key={blog.id}
          blog={blog}
          onEdit={() => onEdit(blog.id)}
          onDelete={() => onDelete(blog.id)}
          onViewPosts={() => onViewPosts(blog.id)}
        />
      ))}
    </div>
  );
} 