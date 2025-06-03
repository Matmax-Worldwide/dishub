// src/app/api/graphql/dataloaders/postsByBlogIdLoader.ts
import { PrismaClient } from '@prisma/client'; // Import PrismaClient type
import { Post, User, Blog as PrismaBlog } from '@prisma/client'; // Prisma types

// Define a more specific type for the Post object we intend to return by the loader,
// including selected fields of related entities.
export type EnrichedPost = Post & {
  author?: Partial<User> | null;
  blog?: Partial<PrismaBlog> | null;
  // media?: Media[] | null; // Example: Decided to keep media fetching separate or via Post field resolver for now
  // featuredImageMedia?: Media | null;
};

export const batchPostsByBlogIds = async (blogIds: readonly string[], prismaClient: PrismaClient): Promise<EnrichedPost[][]> => {
  console.log(`postsByBlogIdLoader: Batch loading posts for blog IDs: [${blogIds.join(', ')}]`);

  const posts = await prismaClient.post.findMany({
    where: {
      blogId: { in: blogIds as string[] },
      // status: 'PUBLISHED', // Optional: Uncomment if this loader is only for published posts
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true, // Consider if email should be exposed here or via a separate User field resolver
          profileImageUrl: true,
        },
      },
      blog: { // For context, though posts are fetched by blogId
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      // media: true, // Decided against including all media by default in this loader
      // featuredImageMedia: true,
    },
    orderBy: {
      publishedAt: 'desc', // Default order for posts
    },
  });

  // Group posts by blogId
  const postsByBlogId: Record<string, EnrichedPost[]> = {};
  blogIds.forEach(id => {
    postsByBlogId[id] = []; // Initialize with empty array for each blogId
  });

  posts.forEach(post => {
    // Ensure post.blogId is not null before trying to push.
    // The query `where: { blogId: { in: blogIds as string[] } }` should ensure blogId is present.
    if (post.blogId) {
      postsByBlogId[post.blogId].push(post as EnrichedPost);
    }
  });

  // Return an array of post arrays, in the same order as the input blogIds
  return blogIds.map(id => postsByBlogId[id]);
};
