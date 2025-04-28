import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Avoid direct access to params by handling it safely
export default async function LocaleLayout({
  children,
}: LayoutProps) {
  return children;
} 