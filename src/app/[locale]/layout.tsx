import React from 'react';

// Avoid direct access to params by handling it safely
export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return children;
} 