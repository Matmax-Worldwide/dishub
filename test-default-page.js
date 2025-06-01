import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDefaultPage() {
  try {
    console.log('🔍 Checking for existing default pages...');
    
    // Check if there are any default pages
    const defaultPages = await prisma.page.findMany({
      where: { isDefault: true },
      include: {
        sections: true,
        seo: true
      }
    });
    
    console.log(`Found ${defaultPages.length} default pages:`);
    defaultPages.forEach(page => {
      console.log(`- ${page.title} (${page.slug}) - Locale: ${page.locale} - Published: ${page.isPublished}`);
    });
    
    // If no default page exists for 'en' locale, create one
    const enDefaultPage = defaultPages.find(p => p.locale === 'en');
    
    if (!enDefaultPage) {
      console.log('📝 Creating default page for "en" locale...');
      
      const newDefaultPage = await prisma.page.create({
        data: {
          title: 'Welcome to Our Site',
          slug: 'home',
          description: 'This is the default homepage',
          isPublished: true,
          isDefault: true,
          locale: 'en',
          pageType: 'LANDING',
          createdById: 'system',
          metaTitle: 'Welcome to Our Site',
          metaDescription: 'Welcome to our amazing website'
        }
      });
      
      console.log(`✅ Created default page: ${newDefaultPage.title} (ID: ${newDefaultPage.id})`);
      
      // Create a basic section for the page
      const section = await prisma.cMSSection.create({
        data: {
          sectionId: `home-main-${Date.now()}`,
          name: 'Main Content',
          description: 'Main content section for homepage',
          pageId: newDefaultPage.id
        }
      });
      
      console.log(`✅ Created section: ${section.name} (ID: ${section.id})`);
      
    } else {
      console.log(`✅ Default page already exists: ${enDefaultPage.title}`);
    }
    
    // Test the GraphQL resolver
    console.log('\n🧪 Testing getDefaultPage resolver...');
    
    const testPage = await prisma.page.findFirst({
      where: { 
        isDefault: true,
        locale: 'en',
        isPublished: true
      },
      include: {
        sections: true,
        seo: true
      }
    });
    
    if (testPage) {
      console.log(`✅ Default page found: ${testPage.title}`);
      console.log(`   - Slug: ${testPage.slug}`);
      console.log(`   - Locale: ${testPage.locale}`);
      console.log(`   - Published: ${testPage.isPublished}`);
      console.log(`   - Sections: ${testPage.sections.length}`);
    } else {
      console.log('❌ No default page found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDefaultPage(); 