'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from './LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  dictionary: {
    nav: {
      home: string;
      about: string;
      services: string;
      wellness: string;
      contact: string;
    };
  };
  locale: string;
}

export default function Navbar({ dictionary, locale }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleLoginDropdown = () => {
    setIsLoginDropdownOpen(!isLoginDropdownOpen);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">E-Voque</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href={`/${locale}`}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              {dictionary.nav.home}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              {dictionary.nav.about}
            </Link>
            <Link
              href={`/${locale}/services`}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              {dictionary.nav.services}
            </Link>
            <Link
              href={`/${locale}/wellness`}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              {dictionary.nav.wellness}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              {dictionary.nav.contact}
            </Link>
            <LanguageSwitcher />
            <div className="relative">
              <button
                onClick={toggleLoginDropdown}
                className="btn-primary flex items-center space-x-1"
              >
                <span>Login or Apply here</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {isLoginDropdownOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <Link
                    href={`/${locale}/login`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Apply here
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <LanguageSwitcher />
            <button
              onClick={toggleMenu}
              className="ml-4 text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="px-4 py-2 space-y-1">
              <Link
                href={`/${locale}`}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {dictionary.nav.home}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {dictionary.nav.about}
              </Link>
              <Link
                href={`/${locale}/services`}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {dictionary.nav.services}
              </Link>
              <Link
                href={`/${locale}/wellness`}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {dictionary.nav.wellness}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {dictionary.nav.contact}
              </Link>
              <div className="space-y-2 mt-4">
                <Link
                  href={`/${locale}/login`}
                  className="block px-3 py-2 btn-primary w-full text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="block px-3 py-2 btn-secondary w-full text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Apply here
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 