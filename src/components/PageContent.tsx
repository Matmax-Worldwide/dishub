'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Benefits from './Benefits';
import Contact from './Contact';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Dictionary } from '../app/i18n';

interface PageContentProps {
  locale: string;
  dictionary: Dictionary;
}

export default function PageContent({ locale, dictionary }: PageContentProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  
  // Secciones
  const sections = useMemo(() => [
    { id: 'home', component: <Hero dictionary={dictionary} locale={locale} /> },
    { id: 'benefits', component: <Benefits dictionary={dictionary} locale={locale} /> },
    { id: 'contact', component: <Contact dictionary={dictionary} /> },
  ], [dictionary, locale]);
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      setIsScrolling(true);
      setTimeout(() => setIsScrolling(false), 800);
      
      if (e.deltaY > 0 && activeSection < sections.length - 1) {
        // Scroll down
        setActiveSection(prev => prev + 1);
      } else if (e.deltaY < 0 && activeSection > 0) {
        // Scroll up
        setActiveSection(prev => prev - 1);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;
      
      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && activeSection < sections.length - 1) {
        e.preventDefault();
        setIsScrolling(true);
        setTimeout(() => setIsScrolling(false), 800);
        setActiveSection(prev => prev + 1);
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && activeSection > 0) {
        e.preventDefault();
        setIsScrolling(true);
        setTimeout(() => setIsScrolling(false), 800);
        setActiveSection(prev => prev - 1);
      }
    };
    
    // Función para manejar el desplazamiento táctil
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (Math.abs(diff) < 50) return; // Ignorar deslizamientos pequeños
      
      setIsScrolling(true);
      setTimeout(() => setIsScrolling(false), 800);
      
      if (diff > 0 && activeSection < sections.length - 1) {
        // Deslizar hacia arriba (scroll down)
        setActiveSection(prev => prev + 1);
      } else if (diff < 0 && activeSection > 0) {
        // Deslizar hacia abajo (scroll up)
        setActiveSection(prev => prev - 1);
      }
    };
    
    // Manejar navegación por hash URL
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = sections.findIndex(section => section.id === hash);
        if (index !== -1) {
          setActiveSection(index);
        }
      }
    };
    
    // Eventos
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('hashchange', handleHashChange);
    
    // Comprobar hash inicial
    handleHashChange();
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeSection, isScrolling, sections.length]);
  
  useEffect(() => {
    // Actualizar URL hash al cambiar de sección
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${sections[activeSection].id}`);
    }
  }, [activeSection, sections]);
  
  // Gestionar el scroll a la sección activa cuando cambia
  useEffect(() => {
    if (sectionRefs.current[activeSection]) {
      sectionRefs.current[activeSection]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [activeSection]);
  
  // Variantes para las animaciones de framer-motion
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar fijo en la parte superior */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar dictionary={dictionary} locale={locale} />
      </div>
      
      {/* Indicador de progreso */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center space-y-3">
        {sections.map((section, index) => (
          <button
            key={index}
            onClick={() => setActiveSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === index
                ? 'bg-primary-600 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to ${section.id} section`}
          />
        ))}
      </div>
      
      {/* Contenido principal */}
      <div className="h-screen">
        <AnimatePresence mode="wait">
          <motion.section
            key={activeSection}
            className="h-screen pt-16 overflow-hidden"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            ref={el => sectionRefs.current[activeSection] = el}
          >
            {sections[activeSection].component}
          </motion.section>
        </AnimatePresence>
      </div>
      
      {/* Footer solo visible en la última sección */}
      {activeSection === sections.length - 1 && (
        <div className="fixed bottom-0 left-0 right-0">
          <Footer dictionary={dictionary} locale={locale} />
        </div>
      )}
    </div>
  );
} 