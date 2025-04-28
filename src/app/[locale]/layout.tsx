type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

// Avoid direct access to params by handling it safely
export default function LocaleLayout({ children }: LayoutProps) {
  return children;
} 