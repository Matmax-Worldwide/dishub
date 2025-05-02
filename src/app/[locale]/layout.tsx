// src/app/[locale]/layout.tsx
import '@/app/globals.css';
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getMessages } from '@/lib/getMessages';
import { Providers } from './providers';

export const metadata = {
  title: 'E-voque',
  description: 'Modern employee management system',
};

const locales = ['en', 'es'];

interface RootLayoutProps {
  children: ReactNode;
  params: { locale: string }; // <--- NO ES PROMESA
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body className="bg-background text-foreground">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}