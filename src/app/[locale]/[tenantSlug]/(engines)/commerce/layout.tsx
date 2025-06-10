interface CommerceLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function CommerceLayout({ children }: CommerceLayoutProps) {
  return children;
} 