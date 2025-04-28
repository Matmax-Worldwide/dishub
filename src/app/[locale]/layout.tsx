'use client';

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

// Avoid direct access to params by handling it safely
export default function LocaleLayout(props: LayoutProps) {
  return props.children;
} 