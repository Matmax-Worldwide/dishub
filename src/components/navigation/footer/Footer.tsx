'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Zap, Github, Twitter, Linkedin, Mail, Globe, Shield, Rocket, Users, Building, Code, Heart } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import InterstellarTechSVG from '@/components/animations/InterstellarTechSVG';

// Define the MenuItem interface
interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
  order: number;
  children?: MenuItem[];
  page?: { id: string; title: string; slug: string };
}

// Define the Menu interface
interface Menu {
  id: string;
  name: string;
  location: string | null;
  items: MenuItem[];
  headerStyle?: {
    id: string;
    transparency?: number;
    headerSize?: string;
    menuAlignment?: string;
    menuButtonStyle?: string;
    mobileMenuStyle?: string;
    mobileMenuPosition?: string;
    transparentHeader?: boolean;
    borderBottom?: boolean;
    advancedOptions?: Record<string, unknown>;
  } | null;
}

interface FooterProps {
  menu: Menu;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  copyright?: string;
  className?: string;
  locale?: string;
}

const Footer: React.FC<FooterProps> = ({
  title = 'DISHUB',
  subtitle,
  copyright,
  className = '',
  locale: propLocale
}) => {
  const params = useParams();
  const locale = propLocale || params.locale as string || 'en';
  const currentYear = new Date().getFullYear();
  const { t } = useI18n();

  // Define comprehensive navigation structure for non-registered users
  const footerSections = [
    {
      title: t('footer.platform.title'),
      icon: Rocket,
      links: [
        { title: t('footer.platform.features'), href: `/${locale}#features` },
        { title: t('footer.platform.pricing'), href: `/${locale}/pricing` },
        { title: t('footer.platform.demo'), href: `/${locale}/demo` },
        { title: t('footer.platform.getStarted'), href: `/${locale}/login` },
        { title: t('footer.platform.documentation'), href: `/${locale}/docs` }
      ]
    },
    {
      title: t('footer.solutions.title'),
      icon: Building,
      links: [
        { title: t('footer.solutions.ecommerce'), href: `/${locale}/solutions/ecommerce` },
        { title: t('footer.solutions.cms'), href: `/${locale}/solutions/cms` },
        { title: t('footer.solutions.crm'), href: `/${locale}/solutions/crm` },
        { title: t('footer.solutions.analytics'), href: `/${locale}/solutions/analytics` },
        { title: t('footer.solutions.ai'), href: `/${locale}/solutions/ai` }
      ]
    },
    {
      title: t('footer.developers.title'),
      icon: Code,
      links: [
        { title: t('footer.developers.api'), href: `/${locale}/developers/api` },
        { title: t('footer.developers.sdk'), href: `/${locale}/developers/sdk` },
        { title: t('footer.developers.webhooks'), href: `/${locale}/developers/webhooks` },
        { title: t('footer.developers.github'), href: 'https://github.com/dishub', external: true },
        { title: t('footer.developers.community'), href: `/${locale}/community` }
      ]
    },
    {
      title: t('footer.company.title'),
      icon: Users,
      links: [
        { title: t('footer.company.about'), href: `/${locale}/about` },
        { title: t('footer.company.careers'), href: `/${locale}/careers` },
        { title: t('footer.company.blog'), href: `/${locale}/blog` },
        { title: t('footer.company.press'), href: `/${locale}/press` },
        { title: t('footer.company.contact'), href: `/${locale}/contact` }
      ]
    },
    {
      title: t('footer.resources.title'),
      icon: Globe,
      links: [
        { title: t('footer.resources.help'), href: `/${locale}/help` },
        { title: t('footer.resources.tutorials'), href: `/${locale}/tutorials` },
        { title: t('footer.resources.webinars'), href: `/${locale}/webinars` },
        { title: t('footer.resources.status'), href: 'https://status.dishub.city', external: true },
        { title: t('footer.resources.changelog'), href: `/${locale}/changelog` }
      ]
    }
  ];

  const legalLinks = [
    { title: t('footer.legal.privacy'), href: `/${locale}/privacy` },
    { title: t('footer.legal.terms'), href: `/${locale}/terms` },
    { title: t('footer.legal.cookies'), href: `/${locale}/cookies` },
    { title: t('footer.legal.gdpr'), href: `/${locale}/gdpr` },
    { title: t('footer.legal.security'), href: `/${locale}/security` }
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/dishub', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/dishub', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/dishub', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:hello@dishub.city', label: 'Email' }
  ];

  return (
    <footer className={`relative text-white py-16 overflow-hidden ${className}`}>
      {/* Interstellar Tech Background - matching CTASection */}
      <div className="svg-background absolute inset-0">
        <InterstellarTechSVG />
      </div>
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px]"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {title}
              </span>
            </Link>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              {subtitle || t('footer.brand.description')}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {footerSections.map((section, index) => (
              <div key={index}>
                <div className="flex items-center mb-4">
                  <section.icon className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="font-semibold text-white">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : '_self'}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-gray-400 hover:text-purple-400 transition-colors duration-300 text-sm flex items-center"
                      >
                        {link.title}
                        {link.external && (
                          <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Shield className="w-5 h-5 text-purple-400 mr-2" />
                {t('footer.newsletter.title')}
              </h3>
              <p className="text-gray-400">
                {t('footer.newsletter.description')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                {t('footer.newsletter.subscribe')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="flex items-center text-gray-400 text-sm">
              <span>© {currentYear} {copyright || title}. {t('footer.copyright')}</span>
              <Heart className="w-4 h-4 text-red-500 mx-2" />
              <span>{t('footer.madeWith')}</span>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-end space-x-6">
              {legalLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-400 hover:text-purple-400 transition-colors duration-300 text-sm"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-900/20 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">
              {t('footer.status.operational')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 