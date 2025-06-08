'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';

export default function CTASection() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();


  const handleAuthAction = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role and tenant
      if (user.role === 'SuperAdmin') {
        router.push(`/${params.locale}/super-admin/dashboard`);
      } else if (user.tenantSlug) {
        router.push(`/${params.locale}/${user.tenantSlug}/dashboard`);
      } else {
        router.push(`/${params.locale}/dashboard`);
      }
    }
  };

  return (
    <section className="relative py-20 px-6 pointer-events-auto">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-bold mb-6">
          {t('dishub.cta.readyTo')}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent ml-3">
            {t('dishub.cta.disrupt')}
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          {t('dishub.cta.subtitle')}
        </p>
        {isAuthenticated && user ? (
          <button 
            onClick={handleAuthAction} 
            className="group px-12 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center mx-auto cursor-pointer pointer-events-auto relative z-50"
          >
            {t('dishub.cta.accessDashboard')}
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        ) : (
          <div className="flex justify-center">
            <Link href={`/${params.locale}/get-started`}>
              <button className="group px-12 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer pointer-events-auto relative z-50">
                {t('dishub.cta.launchFuture')}
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
} 