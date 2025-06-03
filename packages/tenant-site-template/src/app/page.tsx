// packages/tenant-site-template/src/app/page.tsx
import { getPage } from "@/lib/cms";
import PageRenderer from "@/components/PageRenderer";

// This assumes 'home' or a specific slug is designated for the homepage.
// This might need to be configurable or fetched from siteConfig or a default page setting in the CMS.
const HOMEPAGE_SLUG = process.env.HOMEPAGE_SLUG || "home";

export default async function HomePage() {
  let pageData;
  try {
    // For the homepage, we might not want to show unpublished content by default,
    // so preview is explicitly false unless specific logic for homepage preview is added.
    pageData = await getPage(HOMEPAGE_SLUG, false);
  } catch (error) {
    console.error(`Error fetching homepage (slug: ${HOMEPAGE_SLUG}):`, error);
    // Simple error message for the user
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error Loading Homepage</h2>
        <p>We encountered an issue trying to load the homepage. Please try again later.</p>
        {process.env.NODE_ENV === 'development' && <pre>Slug attempted: {HOMEPAGE_SLUG}</pre>}
      </div>
    );
  }

  if (!pageData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Homepage Not Found</h2>
        <p>The page designated as the homepage (slug: "{HOMEPAGE_SLUG}") could not be found.</p>
        <p>Please ensure a page with this slug exists and is published for this tenant.</p>
      </div>
    );
  }

  return <PageRenderer page={pageData} />;
}
