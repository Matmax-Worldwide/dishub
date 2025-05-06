/**
 * This script ensures that a section with ID cms-managed-sections exists in the database.
 * Run it with: npx ts-node -r tsconfig-paths/register src/scripts/ensure-section.ts
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
    console.log('Data directory exists:', dataDir);
  } catch {
    console.log('Creating data directory:', dataDir);
    await fs.mkdir(dataDir, { recursive: true });
  }
  return dataDir;
}

async function main() {
  console.log('Ensuring section exists: cms-managed-sections');
  
  try {
    // Check if section exists in database
    const existingSection = await prisma.cMSSection.findUnique({
      where: { sectionId: 'cms-managed-sections' },
    });
    
    if (existingSection) {
      console.log('Section already exists in database:', existingSection.id);
      console.log('Created at:', existingSection.createdAt);
      console.log('Last updated:', existingSection.lastUpdated);
      
      // Get the component count
      const components = existingSection.components as any[];
      console.log('Number of components:', components?.length || 0);
      
      if (!components || components.length === 0) {
        // Add some default components if none exist
        console.log('Section has no components. Adding default components...');
        
        const defaultComponents = [
          {
            id: `header-${Date.now()}`,
            type: 'Header',
            data: {
              title: 'Welcome to Evoque',
              subtitle: 'Explore our platform and discover what we have to offer'
            }
          },
          {
            id: `text-${Date.now()}`,
            type: 'Text',
            data: {
              title: 'About Us',
              content: 'We are a platform dedicated to providing the best services for our users.'
            }
          }
        ];
        
        await prisma.cMSSection.update({
          where: { id: existingSection.id },
          data: {
            components: defaultComponents,
            lastUpdated: new Date()
          }
        });
        
        console.log('Default components added successfully!');
      }
    } else {
      console.log('Section does not exist. Creating it...');
      
      // Create the section with default components
      const defaultComponents = [
        {
          id: `header-${Date.now()}`,
          type: 'Header',
          data: {
            title: 'Welcome to Evoque',
            subtitle: 'Explore our platform and discover what we have to offer'
          }
        },
        {
          id: `text-${Date.now()}`,
          type: 'Text',
          data: {
            title: 'About Us',
            content: 'We are a platform dedicated to providing the best services for our users.'
          }
        }
      ];
      
      const newSection = await prisma.cMSSection.create({
        data: {
          id: 'cms-managed-sections',
          sectionId: 'cms-managed-sections',
          components: defaultComponents,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('Section created successfully!', newSection.id);
    }
    
    // Also ensure data exists in the file system
    const dataDir = await ensureDataDir();
    const filePath = path.join(dataDir, 'cms-sections.json');
    
    let data: Record<string, unknown> = {};
    
    try {
      const rawData = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(rawData);
    } catch {
      console.log('Data file does not exist or is empty. Creating it...');
    }
    
    if (!data['cms-managed-sections']) {
      console.log('Adding section data to file system...');
      
      // Get the latest data from the database
      const latestData = await prisma.cMSSection.findUnique({
        where: { sectionId: 'cms-managed-sections' },
      });
      
      if (latestData) {
        data['cms-managed-sections'] = {
          components: latestData.components,
          lastUpdated: latestData.lastUpdated.toISOString(),
        };
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log('Section data added to file system successfully!');
      }
    } else {
      console.log('Section data already exists in file system');
    }
    
    console.log('All done! Section should now be accessible.');
    
  } catch (error) {
    console.error('Error ensuring section exists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 