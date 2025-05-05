import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Path to the JSON file that will store our CMS section data
const dataFilePath = path.join(process.cwd(), 'data', 'cms-sections.json');

// Ensure the data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fsPromises.access(dataDir);
  } catch {
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
}

// GET route to fetch section data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get('sectionId') || 'cms-managed-sections';
    
    await ensureDataDir();
    
    // Check if the file exists, if not create it with an empty object
    try {
      await fsPromises.access(dataFilePath);
    } catch {
      await fsPromises.writeFile(dataFilePath, JSON.stringify({}));
    }
    
    // Read the file
    const rawData = await fsPromises.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(rawData) as Record<string, unknown>;
    
    // Return the section data or an empty array if not found
    const sectionData = data[sectionId] || { components: [] };
    
    return NextResponse.json({ status: 'success', data: sectionData });
  } catch (error) {
    console.error('Error fetching section data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch section data' },
      { status: 500 }
    );
  }
}

// POST route to save section data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId = 'cms-managed-sections', components } = body;
    
    await ensureDataDir();
    
    // Check if the file exists, if not create it with an empty object
    let data: Record<string, unknown> = {};
    try {
      await fsPromises.access(dataFilePath);
      const rawData = await fsPromises.readFile(dataFilePath, 'utf-8');
      data = JSON.parse(rawData);
    } catch {
      // If file doesn't exist, start with an empty object
    }
    
    // Update the section data
    data[sectionId] = {
      components,
      lastUpdated: new Date().toISOString(),
    };
    
    // Write back to the file
    await fsPromises.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ status: 'success', message: 'Section data saved' });
  } catch (error) {
    console.error('Error saving section data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save section data' },
      { status: 500 }
    );
  }
} 