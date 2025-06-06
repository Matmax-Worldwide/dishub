'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Shield, Cpu, Blocks, Globe, Zap, Lock, Database, Rocket, ArrowRight, Key, Hash, FileText, Users, Activity, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function DishubLanding() {
  const { t } = useI18n();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('dishub.features.privacyFirst.title'),
      desc: t('dishub.features.privacyFirst.desc')
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: t('dishub.features.aiPowered.title'),
      desc: t('dishub.features.aiPowered.desc')
    },
    {
      icon: <Blocks className="w-8 h-8" />,
      title: t('dishub.features.blockchainReady.title'),
      desc: t('dishub.features.blockchainReady.desc')
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: t('dishub.features.globalScale.title'),
      desc: t('dishub.features.globalScale.desc')
    }
  ];

  const privacyFeatures = [
    {
      title: t('dishub.privacy.gdprCompliant.title'),
      desc: t('dishub.privacy.gdprCompliant.desc'),
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: t('dishub.privacy.zeroKnowledge.title'),
      desc: t('dishub.privacy.zeroKnowledge.desc'),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: t('dishub.privacy.dataSovereignty.title'),
      desc: t('dishub.privacy.dataSovereignty.desc'),
      gradient: "from-pink-500 to-red-500"
    },
    {
      title: t('dishub.privacy.federatedSystem.title'),
      desc: t('dishub.privacy.federatedSystem.desc'),
      gradient: "from-cyan-500 to-blue-500"
    }
  ];

  // Blockchain Database Tables with animations
  const blockchainTables = [
    {
      name: t('dishub.privacy.blockchain.userTable'),
      icon: <Users className="w-5 h-5" />,
      status: 'active',
      records: Math.floor(Math.random() * 10000) + 1000,
      hash: 'a7b2c...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.transactionTable'),
      icon: <Activity className="w-5 h-5" />,
      status: 'syncing',
      records: Math.floor(Math.random() * 50000) + 5000,
      hash: 'e4f8d...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.encryptionTable'),
      icon: <Key className="w-5 h-5" />,
      status: 'secured',
      records: Math.floor(Math.random() * 1000) + 100,
      hash: 'k9m3p...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.auditTable'),
      icon: <FileText className="w-5 h-5" />,
      status: 'active',
      records: Math.floor(Math.random() * 25000) + 2500,
      hash: 'q2w5r...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.permissionTable'),
      icon: <Shield className="w-5 h-5" />,
      status: 'protected',
      records: Math.floor(Math.random() * 5000) + 500,
      hash: 't8y6u...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.sessionTable'),
      icon: <Server className="w-5 h-5" />,
      status: 'monitoring',
      records: Math.floor(Math.random() * 2000) + 200,
      hash: 'n4b7v...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.backupTable'),
      icon: <Hash className="w-5 h-5" />,
      status: 'backup',
      records: Math.floor(Math.random() * 15000) + 1500,
      hash: 's1d9f...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.validationTable'),
      icon: <CheckCircle className="w-5 h-5" />,
      status: 'validating',
      records: Math.floor(Math.random() * 8000) + 800,
      hash: 'x3z6c...',
      encrypted: true
    },
    {
      name: t('dishub.privacy.blockchain.masterKey'),
      icon: <AlertTriangle className="w-5 h-5" />,
      status: 'critical',
      records: 1,
      hash: '***encrypted***',
      encrypted: true
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
          <div 
            className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-pulse"
            style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.1}px)` }} 
          />
          <div 
            className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600 rounded-full filter blur-3xl opacity-20 animate-pulse"
            style={{ transform: `translate(-${scrollY * 0.1}px, -${scrollY * 0.1}px)` }} 
          />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t('dishub.nav.brand')}
              </span>
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
              {t('dishub.nav.getStarted')}
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 
              className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
              style={{ transform: `translateY(${scrollY * -0.2}px)` }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                {t('dishub.hero.disruption')}
              </span>
              <br />
              <span className="text-white">{t('dishub.hero.isInnovation')}</span>
            </h1>
            <p 
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
              style={{ transform: `translateY(${scrollY * -0.15}px)` }}
            >
              {t('dishub.hero.subtitle')}
            </p>
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              style={{ transform: `translateY(${scrollY * -0.1}px)` }}
            >
              <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center">
                {t('dishub.hero.startDisrupting')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/10 backdrop-blur-xl transition-all duration-300">
                {t('dishub.hero.learnMore')}
              </button>
            </div>
          </div>
          <ChevronDown className="absolute bottom-10 w-8 h-8 animate-bounce" />
        </section>

        {/* Features Grid */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t('dishub.features.nativeByDesign')}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="group relative p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                  style={{
                    transform: `translateY(${Math.sin(scrollY * 0.001 + i) * 10}px)`,
                    transition: 'transform 0.3s ease-out'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy & Compliance Section */}
        <section className="relative z-10 py-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('dishub.privacy.title')}
              </span>
            </h2>
            <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto">
              {t('dishub.privacy.subtitle')}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {privacyFeatures.map((feature, i) => (
                <div key={i} className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`} />
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 h-full hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg mb-4 flex items-center justify-center`}>
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Zero Knowledge Architecture Visual */}
            <div className="mt-20 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-3xl filter blur-3xl" />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500">
                <h3 className="text-3xl font-bold mb-6 text-center">
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    {t('dishub.privacy.architecture.title')}
                  </span>
                </h3>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Database className="w-10 h-10 text-purple-400" />
                    </div>
                    <h4 className="font-bold mb-2">{t('dishub.privacy.architecture.encryptedAtRest.title')}</h4>
                    <p className="text-sm text-gray-400">{t('dishub.privacy.architecture.encryptedAtRest.desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                      <Shield className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h4 className="font-bold mb-2">{t('dishub.privacy.architecture.zeroAccess.title')}</h4>
                    <p className="text-sm text-gray-400">{t('dishub.privacy.architecture.zeroAccess.desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center border border-pink-500/30">
                      <Lock className="w-10 h-10 text-pink-400" />
                    </div>
                    <h4 className="font-bold mb-2">{t('dishub.privacy.architecture.clientSideKeys.title')}</h4>
                    <p className="text-sm text-gray-400">{t('dishub.privacy.architecture.clientSideKeys.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {t('dishub.technology.title')}
                  </span>
                  <br />
                  {t('dishub.technology.subtitle')}
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  {t('dishub.technology.description')}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Lock className="w-6 h-6 text-purple-400" />
                    <span>{t('dishub.technology.endToEnd')}</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Database className="w-6 h-6 text-cyan-400" />
                    <span>{t('dishub.technology.decentralized')}</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Rocket className="w-6 h-6 text-pink-400" />
                    <span>{t('dishub.technology.aiInsights')}</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl filter blur-3xl opacity-30 animate-pulse" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {blockchainTables.map((table, i) => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'active': return 'from-green-500/20 to-green-600/20 border-green-500/30';
                          case 'syncing': return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
                          case 'secured': return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
                          case 'protected': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
                          case 'monitoring': return 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30';
                          case 'backup': return 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30';
                          case 'validating': return 'from-teal-500/20 to-teal-600/20 border-teal-500/30';
                          case 'critical': return 'from-red-500/20 to-red-600/20 border-red-500/30';
                          default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
                        }
                      };

                      return (
                        <div 
                          key={i}
                          className={`
                            relative h-20 bg-gradient-to-br ${getStatusColor(table.status)} 
                            rounded-lg border backdrop-blur-sm
                            hover:scale-105 transition-all duration-300 cursor-pointer
                            group overflow-hidden
                          `}
                          style={{ 
                            animationDelay: `${i * 0.1}s`,
                            animation: `pulse 2s ease-in-out infinite`
                          }}
                        >
                          {/* Blockchain pattern overlay */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="grid grid-cols-4 h-full">
                              {[...Array(16)].map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className="border border-white/20"
                                  style={{
                                    animation: `pulse ${2 + (idx * 0.1)}s ease-in-out infinite`
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          
                          {/* Table content */}
                          <div className="relative z-10 p-3 h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {table.icon}
                                <span className="text-xs font-medium text-white truncate">
                                  {table.name}
                                </span>
                              </div>
                              {table.encrypted && (
                                <Lock className="w-3 h-3 text-green-400" />
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-300">
                              <div className="flex justify-between">
                                <span>Records:</span>
                                <span className="font-mono">{table.records.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Hash:</span>
                                <span className="font-mono text-green-400">{table.hash}</span>
                              </div>
                            </div>
                          </div>

                          {/* Hover tooltip */}
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            Status: {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-4 bg-white/20 rounded-full mb-2" />
                  <div className="h-4 bg-white/10 rounded-full w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Federated Architecture Section */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('dishub.federated.title')}
              </span>
            </h2>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  {/* Animated Network Visualization */}
                  <div className="relative h-96">
                    {/* Central Node */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full animate-pulse flex items-center justify-center">
                        <Globe className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    {/* Orbiting Nodes */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-16 h-16 animate-orbit"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(120px) rotate(-${angle}deg)`,
                          animationDelay: `${i * 0.5}s`
                        }}
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-80 flex items-center justify-center">
                          <Database className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-3xl font-bold mb-6">{t('dishub.federated.trustNetwork')}</h3>
                <p className="text-xl text-gray-300 mb-8">
                  {t('dishub.federated.description')}
                </p>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Blocks className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{t('dishub.federated.multiRegion.title')}</h4>
                      <p className="text-gray-400">{t('dishub.federated.multiRegion.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{t('dishub.federated.sovereignZones.title')}</h4>
                      <p className="text-gray-400">{t('dishub.federated.sovereignZones.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{t('dishub.federated.edgeComputing.title')}</h4>
                      <p className="text-gray-400">{t('dishub.federated.edgeComputing.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 py-20 px-6">
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
            <button className="group px-12 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center mx-auto">
              {t('dishub.cta.launchFuture')}
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 py-8 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">{t('dishub.nav.brand')}</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('dishub.footer.copyright')}
            </p>
          </div>
        </footer>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes orbit {
          from { 
            transform: translate(-50%, -50%) rotate(0deg) translateX(120px) rotate(0deg); 
          }
          to { 
            transform: translate(-50%, -50%) rotate(360deg) translateX(120px) rotate(-360deg); 
          }
        }
        .animate-orbit {
          animation: orbit 20s linear infinite;
        }
      `}</style>
    </>
  );
} 