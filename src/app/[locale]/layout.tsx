import { Inter } from "next/font/google";
import { Providers } from '@/app/providers';
import { getMessages } from '@/lib/getMessages';

const inter = Inter({ subsets: ["latin"] });

export default async function LocaleLayout({ 
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  
  return (
    <Providers locale={locale} messages={messages}>
      <main className={inter.className + " "}>
        {children}
      </main>
    </Providers>
  );
} 