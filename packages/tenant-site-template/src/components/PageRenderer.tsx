// packages/tenant-site-template/src/components/PageRenderer.tsx
// This is a very basic renderer. A real implementation would be more complex,
// likely involving a library of actual React components mapped by type.

// Define types for the props based on your GraphQL schema for PublicPage
interface Media {
  url: string;
  altText?: string | null; // Ensure altText can be null
  fileName?: string | null;
  fileType?: string | null;
}

interface ComponentData {
  id: string;
  type: string; // e.g., 'hero-section', 'text-block', 'image-gallery'
  data: any; // The actual content for the component, structure depends on 'type'
  order: number;
}

interface SectionData {
  id: string;
  sectionId: string; // User-defined ID for the section (e.g., "hero", "about-us")
  backgroundImage?: string | null;
  backgroundType?: string | null;
  gridDesign?: string | null;
  order: number;
  components: ComponentData[];
  media?: Media[] | null; // Media directly associated with the section
}

interface PageData {
  title: string;
  description?: string | null;
  featuredImage?: Media | null;
  sections: SectionData[];
  locale?: string | null;
}

interface PageRendererProps {
  page: PageData;
}

const ComponentDisplay = ({ component }: { component: ComponentData }) => {
  // In a real app, you'd have a mapping from component.type to actual React components
  // For example:
  // switch (component.type) {
  //   case 'hero-banner': return <HeroBanner data={component.data} />;
  //   case 'text-block': return <TextBlock data={component.data} />;
  //   case 'image-gallery': return <ImageGallery data={component.data} />;
  //   default: return <div style={{color: 'red'}}>Unknown component type: {component.type}</div>;
  // }

  return (
    <div style={{
        border: '1px dashed #ccc',
        padding: '1rem',
        margin: '1rem 0',
        backgroundColor: '#f9f9f9'
      }}
      data-component-type={component.type}
      data-component-id={component.id}
    >
      <h3 style={{ marginTop: 0, color: '#333' }}>Component: {component.type} (Order: {component.order})</h3>
      <details>
        <summary style={{ cursor: 'pointer', color: '#555' }}>View Data</summary>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#fff', padding: '0.5rem', border: '1px solid #ddd' }}>
          {JSON.stringify(component.data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

const SectionDisplay = ({ section }: { section: SectionData }) => {
  const sectionStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    padding: '1.5rem',
    margin: '1.5rem 0',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  if (section.backgroundImage) {
    sectionStyle.backgroundImage = `url(${section.backgroundImage})`;
    sectionStyle.backgroundSize = 'cover';
    sectionStyle.backgroundPosition = 'center';
    sectionStyle.color = '#fff'; // Basic contrast for text if background is dark
    sectionStyle.padding = '3rem 1.5rem';
  }

  return (
    <section style={sectionStyle} data-section-id={section.sectionId}>
      <h2 style={{ marginTop: 0, borderBottom: '2px solid var(--primary-color, #007bff)', paddingBottom: '0.5rem' }}>
        Section: {section.sectionId} (Order: {section.order})
      </h2>
      {section.components && section.components.length > 0 ? (
        section.components.sort((a,b) => a.order - b.order).map(component => (
          <ComponentDisplay key={component.id} component={component} />
        ))
      ) : (
        <p>This section has no components.</p>
      )}
      {section.media && section.media.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Section Media:</h4>
          {section.media.map(m => (
            m.url ? <img key={m.id || m.url} src={m.url} alt={m.altText || ''} style={{maxWidth: '100px', marginRight: '10px'}} /> : null
          ))}
        </div>
      )}
    </section>
  );
};

export default function PageRenderer({ page }: PageRendererProps) {
  if (!page) {
    return <div style={{color: 'red', padding: '20px'}}>Error: No page data provided to PageRenderer.</div>;
  }

  return (
    <article>
      <header style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontSize: '2.5em', color: 'var(--primary-color, #007bff)' }}>{page.title}</h1>
        {page.description && <p style={{ color: '#555', fontSize: '1.1em' }}>{page.description}</p>}
      </header>

      {page.featuredImage?.url && (
        <figure style={{ margin: '0 0 2rem 0' }}>
          <img
            src={page.featuredImage.url}
            alt={page.featuredImage.altText || page.title}
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
          />
        </figure>
      )}

      {page.sections && page.sections.length > 0 ? (
        page.sections.sort((a,b) => a.order - b.order).map(section => (
          <SectionDisplay key={section.id} section={section} />
        ))
      ) : (
        <p>This page has no content sections defined.</p>
      )}
    </article>
  );
}
