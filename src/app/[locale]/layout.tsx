import { Inter } from "next/font/google";
import { getMessages } from '@/lib/getMessages';
import { LocaleProviders } from '@/app/locale-providers';

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
    <LocaleProviders locale={locale} messages={messages}>
      <main className={inter.className + " "}>
        {children}
      </main>
    </LocaleProviders>
  );
} 