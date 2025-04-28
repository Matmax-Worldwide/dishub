'use client';

import { Inter } from "next/font/google";
import "../globals.css";
import { ApolloProvider } from '@apollo/client';
import { client } from '../lib/apollo-client';

const inter = Inter({ subsets: ["latin"] });

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

// Avoid direct access to params by handling it safely
export default function RootLayout(props: LayoutProps) {
  // We don't directly reference params.locale in JSX to avoid Next.js error
  
  return (
    <ApolloProvider client={client}>
      <html>
        <body className={inter.className}>
          <main className="min-h-screen">
            {props.children}
          </main>
        </body>
      </html>
    </ApolloProvider>
  );
} 