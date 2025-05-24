import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Delete a blog by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if the blog exists
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { posts: true }
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if the blog has associated posts
    if (blog.posts.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete blog with existing posts. Please delete all posts first.' 
        },
        { status: 400 }
      );
    }

    // Delete the blog
    await prisma.blog.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting the blog' },
      { status: 500 }
    );
  }
}

// Get a single blog by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { posts: true }
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching the blog' },
      { status: 500 }
    );
  }
}

// Update a blog by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { title, description, slug, isActive } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { success: false, message: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if the blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if another blog with the same slug exists (but different ID)
    if (slug !== existingBlog.slug) {
      const slugExists = await prisma.blog.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'A blog with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update the blog
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        description,
        slug,
        isActive: isActive !== undefined ? isActive : existingBlog.isActive
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Blog updated successfully',
      blog: updatedBlog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating the blog' },
      { status: 500 }
    );
  }
} 