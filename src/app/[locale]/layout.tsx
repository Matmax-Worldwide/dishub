import '@/app/globals.css';
import { ReactNode } from 'react';
import { Providers } from './providers';
import { notFound } from 'next/navigation';
import { getMessages } from '@/lib/getMessages';

export const metadata = {
  title: 'E-voque',
  description: 'Modern employee management system',
};

// List of supported locales
const locales = ['en', 'es'];

interface RootLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  try {
    // Use Promise.resolve to ensure params is awaited
    const resolvedParams = await Promise.resolve(params);
    const locale = resolvedParams.locale;
    
    // Check if the locale is supported
    if (!locales.includes(locale)) {
      notFound();
    }

    // Get the messages for the locale
    const messages = await getMessages(locale);

    return (
      <html lang={locale}>
        <body>
          <Providers locale={locale} messages={messages}>
            {children}
          </Providers>
        </body>
      </html>
    );
  } catch (error) {
    console.error("Error in RootLayout:", error);
    // Fallback to default locale
    const locale = 'en';
    const messages = await getMessages(locale);
    
    return (
      <html lang={locale}>
        <body>
          <Providers locale={locale} messages={messages}>
            {children}
          </Providers>
        </body>
      </html>
    );
  }
}

// Generate the static params for the locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
} 