import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Create a new blog
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, slug, isActive = true } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { success: false, message: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if blog with the same slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug }
    });

    if (existingBlog) {
      return NextResponse.json(
        { success: false, message: 'A blog with this slug already exists' },
        { status: 400 }
      );
    }

    // Create the blog
    const blog = await prisma.blog.create({
      data: {
        title,
        description,
        slug,
        isActive
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the blog' },
      { status: 500 }
    );
  }
}

// Get all blogs
export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching blogs' },
      { status: 500 }
    );
  }
} 