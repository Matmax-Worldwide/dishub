import "@/app/globals.css";
import "@/styles/cms.css";
import "@/styles/media-selector.css";
import { Inter } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
} 