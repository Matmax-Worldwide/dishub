// This script migrates existing CMS section data from the file system to the database
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize Prisma client
const prisma = new PrismaClient();

async function migrateCMSData() {
  try {
    console.log('Starting migration of CMS section data...');
    
    // Log available models
    console.log('Available Prisma models:', Object.keys(prisma));
    
    // Path to the JSON data file
    const filePath = path.join(process.cwd(), 'data', 'cms-sections.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('No CMS section data file found at:', filePath);
      return;
    }
    
    // Read the JSON data
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log('Found section data for:', Object.keys(data));
    
    // Process each section
    for (const [sectionId, sectionData] of Object.entries(data)) {
      console.log(`Processing section: ${sectionId}`);
      
      try {
        // Check if section already exists in the database
        const existingSection = await prisma.CMSSection.findUnique({
          where: { sectionId }
        });
        
        if (existingSection) {
          console.log(`Section ${sectionId} already exists in the database, updating...`);
          
          // Update the existing section
          await prisma.CMSSection.update({
            where: { id: existingSection.id },
            data: {
              components: sectionData.components || [],
              lastUpdated: sectionData.lastUpdated ? new Date(sectionData.lastUpdated) : new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`Section ${sectionId} updated successfully`);
        } else {
          console.log(`Section ${sectionId} does not exist in the database, creating...`);
          
          // Create a new section
          await prisma.CMSSection.create({
            data: {
              sectionId,
              components: sectionData.components || [],
              lastUpdated: sectionData.lastUpdated ? new Date(sectionData.lastUpdated) : new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`Section ${sectionId} created successfully`);
        }
      } catch (error) {
        console.error(`Error processing section ${sectionId}:`, error);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCMSData().catch(console.error); 