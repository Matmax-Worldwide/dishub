interface BookingsLayoutProps {
  children: React.ReactNode;
  params:  Promise<{
    locale: string;
  }>;
}

export default function BookingsLayout({ children }: BookingsLayoutProps) {  
  return children;
} 