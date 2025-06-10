interface LegalLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function LegalLayout({ children }: LegalLayoutProps) {  
  return children;
} 