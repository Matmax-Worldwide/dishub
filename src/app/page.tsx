// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Detecta el locale actual desde la ruta
    const locale = pathname.split('/')[1] || 'en'; // Default 'en' si no hay locale
    router.replace(`/${locale}`);
  }, [router, pathname]);

  return null;
}