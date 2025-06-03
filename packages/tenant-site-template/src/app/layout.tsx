// packages/tenant-site-template/src/app/layout.tsx
import type { Metadata } from "next";
// import "./globals.css"; // Assuming a basic globals.css - create this file if needed
import { getSiteConfig, getMenu } from "@/lib/cms";

// Basic Navbar component (example)
const Navbar = ({ menu }: { menu: any }) => {
  if (!menu || !menu.items || menu.items.length === 0) {
    console.log("Navbar: No menu or items to display.");
    return null;
  }
  return (
    <nav style={{ backgroundColor: '#f0f0f0', padding: '1rem', marginBottom: '1rem', borderBottom: '1px solid #ddd' }}>
      <ul style={{ listStyle: 'none', display: 'flex', justifyContent: 'center', gap: '2rem', margin: 0, padding: 0 }}>
        {menu.items.map((item: any) => (
          <li key={item.id}>
            <a href={item.url || '#'} target={item.target || '_self'} style={{ textDecoration: 'none', color: 'inherit' }}>
              {item.title}
            </a>
            {item.children && item.children.length > 0 && (
              <ul style={{ listStyle: 'none', paddingLeft: '1rem', display: 'none' /* Basic: no dropdown */ }}>
                {item.children.map((childItem: any) => (
                  <li key={childItem.id}>
                    <a href={childItem.url || '#'} target={childItem.target || '_self'} style={{ textDecoration: 'none', color: 'inherit' }}>
                      -- {childItem.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteConfig = await getSiteConfig();
    return {
      title: siteConfig?.siteName || "Tenant Site",
      description: siteConfig?.description || "Welcome to our site!",
      icons: siteConfig?.faviconUrl ? { icon: siteConfig.faviconUrl } : undefined,
    };
  } catch (error) {
    console.error("Error fetching site config for metadata:", error);
    return {
      title: "Tenant Site",
      description: "Welcome to our site!",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteConfig: any = {}; // Initialize with empty object
  let mainMenu: any = null; // Initialize with null

  try {
    siteConfig = await getSiteConfig();
    // Assuming "PRIMARY_NAVIGATION" is a common location string for main menus.
    // This should match what's configured in the CMS for the tenant.
    mainMenu = await getMenu("PRIMARY_NAVIGATION");
  } catch (error) {
    // Log error but don't let it crash the entire site layout
    console.error("Error fetching initial layout data (siteConfig or mainMenu):", error);
    // Site can still render with defaults or empty data
  }

  return (
    <html lang={siteConfig?.defaultLocale || "en"}>
      <head>
        {/* Basic CSS reset and font can go in globals.css */}
        {/* <link rel="stylesheet" href="/globals.css" /> */}
        <title>{siteConfig?.siteName || "Tenant Site"}</title>
        {siteConfig?.primaryColor && <style>{`:root { --primary-color: ${siteConfig.primaryColor}; }`}</style>}
        {siteConfig?.faviconUrl && <link rel="icon" href={siteConfig.faviconUrl} sizes="any" />}
      </head>
      <body style={{ margin: 0, fontFamily: 'sans-serif', lineHeight: 1.6 }}>
        <header style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
          {siteConfig?.logoUrl ? (
            <img src={siteConfig.logoUrl} alt={`${siteConfig.siteName || 'Site'} Logo`} style={{ maxHeight: '50px', display: 'inline-block' }} />
          ) : (
            <h1>{siteConfig?.siteName || "My Tenant Site"}</h1>
          )}
          <Navbar menu={mainMenu} />
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
        <footer style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #eee', marginTop: '2rem' }}>
          <p>© {new Date().getFullYear()} {siteConfig?.siteName || "My Tenant Site"}. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
