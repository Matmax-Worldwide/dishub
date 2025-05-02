import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getMessages } from '@/lib/getMessages';
import { Providers } from './providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'E-voque',
  description: 'Modern employee management system',
};

// Idiomas soportados
const locales = ['en', 'es'];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Usa directamente el tipo esperado por Next
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

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