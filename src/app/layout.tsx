import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Providers } from '@/app/[locale]/providers';
import { getMessages } from '@/lib/getMessages';

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ 
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}) {
  const messages = await getMessages(locale);
  
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Providers locale={locale} messages={messages}>
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
} 