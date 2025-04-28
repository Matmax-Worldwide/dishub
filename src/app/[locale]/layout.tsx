import React from 'react';

export interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

// Avoid direct access to params by handling it safely
export default async function LocaleLayout({
  children,
}: LocaleLayoutProps) {
  return children;
} 