import { Blog } from '@/types/blog';
import { BlogCard } from './BlogCard';

interface BlogsGridViewProps {
  blogs: Blog[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPosts: (id: string) => void;
}

export function BlogsGridView({ blogs, onEdit, onDelete, onViewPosts }: BlogsGridViewProps) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {blogs.map((blog) => (
        <BlogCard
          key={blog.id}
          blog={blog}
          onEdit={() => onEdit(blog.id)}
          onDelete={() => onDelete(blog.id)}
          onViewPosts={() => onViewPosts(blog.id)}
        />
      ))}
      </div>
    </div>
  );
} 