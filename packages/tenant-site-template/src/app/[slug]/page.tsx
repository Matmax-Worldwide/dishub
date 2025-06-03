// packages/tenant-site-template/src/app/[slug]/page.tsx
import { getPage, getAllPageSlugs } from "@/lib/cms";
import PageRenderer from "@/components/PageRenderer";
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Check for preview mode via searchParams, this is a common Next.js pattern for draft/preview
    const preview = searchParams?.preview === 'true';
    const page = await getPage(params.slug, preview);

    if (!page) {
      return {
        title: "Page Not Found",
        description: "The page you are looking for does not exist.",
      };
    }
    return {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.description,
      // openGraph: {
      //   title: page.metaTitle || page.title,
      //   description: page.metaDescription || page.description,
      //   images: page.featuredImage?.url ? [{ url: page.featuredImage.url }] : [],
      // }
    };
  } catch (error) {
    console.error("Error fetching metadata for page:", params.slug, error);
    return {
      title: "Error",
      description: "Could not load page information."
    };
  }
}

// This function generates static paths at build time.
export async function generateStaticParams() {
  try {
    // Fetch all published page slugs for the current tenant
    const slugs = await getAllPageSlugs();
    return slugs.map((s: { slug: string }) => ({
      slug: s.slug,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams for [slug]:", error);
    // It's important to decide how to handle errors here.
    // Returning an empty array means no pages will be pre-rendered if the API call fails.
    // This might be acceptable if pages are mostly ISR or dynamically rendered.
    return [];
  }
}

export default async function DynamicPage({ params, searchParams }: Props) {
  let pageData;
  const preview = searchParams?.preview === 'true';

  try {
    pageData = await getPage(params.slug, preview);
  } catch (error) {
    console.error(`Error fetching page (slug: ${params.slug}, preview: ${preview}):`, error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error Loading Page</h2>
        <p>We encountered an issue trying to load this page. Please try again later.</p>
        {process.env.NODE_ENV === 'development' && <pre>Slug attempted: {params.slug}, Preview: {String(preview)}</pre>}
      </div>
    );
  }

  if (!pageData) {
    return (
       <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Page Not Found</h2>
        <p>The page you are looking for (slug: "{params.slug}") could not be found.</p>
        {preview && <p>Note: Preview mode is active. Ensure the page exists, even if not published.</p>}
      </div>
    );
  }

  return <PageRenderer page={pageData} />;
}

// Optional: Configure revalidation for ISR (Incremental Static Regeneration)
// export const revalidate = 60; // Revalidate every 60 seconds. Choose a sensible default.
// Consider making this an environment variable if different tenants need different revalidation policies.
const REVALIDATE_SECONDS = parseInt(process.env.REVALIDATE_SECONDS || "300", 10); // Default to 5 minutes
export const revalidate = REVALIDATE_SECONDS;
