'use client';

import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ApolloProvider } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { usePathname } from 'next/navigation';
import { Providers } from './providers';
import { getMessages } from "@/lib/getMessages";

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
            <Providers locale={locale} messages={getMessages(locale)}>
              {props.children}
            </Providers>
          </main>
        </body>
      </html>
    </ApolloProvider>
  );
} 