'use client';

import React from 'react';

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* This is a nested layout inside the admin layout */}
      {children}
    </div>
  );
} 