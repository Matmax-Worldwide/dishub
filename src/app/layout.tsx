'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/apollo-client';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

type LayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout(props: LayoutProps) {
  // Detectar el locale de la URL
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  
  return (
    <ApolloProvider client={client}>
      <html lang={locale}>
        <body className={inter.className}>
          <main className="min-h-screen">
            {props.children}
          </main>
        </body>
      </html>
    </ApolloProvider>
  );
} 