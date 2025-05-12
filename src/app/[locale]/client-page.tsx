'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navigation/Navbar';
import Benefits from '../../components/Benefits';
import Footer from '../../components/Footer';
import CopyrightFooter from '../../components/CopyrightFooter';
import { Dictionary } from '../i18n';

interface ClientPageProps {
  locale: string;
  dictionary: Dictionary;
}

export default function ClientPage({ locale, dictionary }: ClientPageProps) {
  const [showCopyright, setShowCopyright] = useState(false);

  // Apply global overflow hidden using useEffect
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Función para detectar cuando el usuario ha scrolleado hasta el final
    const handleScroll = () => {
      // Determinar si hemos llegado cerca del final de la página
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Mostrar el copyright cuando estamos muy cerca del final del documento
      if (documentHeight - scrollPosition < 50) {
        setShowCopyright(true);
      } else {
        setShowCopyright(false);
      }
    };
    
    // Agregar listener de scroll
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <Benefits dictionary={dictionary} locale={locale} />
      
      {/* Footer completo (oculto por defecto) */}
      <div id="main-footer" className="hidden">
        <Footer dictionary={dictionary} locale={locale} />
      </div>
      
      {/* Footer de copyright (más pequeño, solo muestra al final) */}
      <div className={`copyright-footer ${showCopyright ? 'visible' : ''}`}>
        <CopyrightFooter dictionary={dictionary} />
      </div>
    </>
  );
} 