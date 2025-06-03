'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { useEffect, useState } from 'react';
import { Lock, CheckCircle, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import PermissionGuard from '@/components/PermissionGuard';

const GET_USER = gql`
  query GetUser {
    me {
      id
      email
      firstName
      lastName
      role {
        id
        name
        description
      }
    }
  }
`;

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      title
      message
      type
      isRead
      createdAt
      updatedAt
    }
    unreadNotificationsCount
  }
`;

const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!, $input: UpdateNotificationInput!) {
    updateNotification(id: $id, input: $input) {
      id
      isRead
    }
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

// Define a type for notifications
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Welcome banner component for users who just logged in
function WelcomeBanner({ userName }: { userName: string }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg flex items-center max-w-md">
      <CheckCircle className="w-5 h-5 mr-2" />
      <div>
        <p className="font-bold">Login Successful!</p>
        <p>Welcome{userName ? ` back, ${userName}` : ''}! You&apos;ve been successfully authenticated.</p>
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="ml-2 text-green-700 hover:text-green-900"
      >
        ×
      </button>
    </div>
  );
}

// Format date to relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('Invalid date:', dateString);
      return 'Fecha no disponible';
    }
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Si es menos de un minuto, mostrar "ahora mismo"
    if (diffSeconds < 60) {
      return 'ahora mismo';
    } 
    // Si es menos de una hora, mostrar minutos
    else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } 
    // Si es menos de un día, mostrar horas
    else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } 
    // Si es menos de una semana, mostrar días
    else if (diffSeconds < 604800) {
      const days = Math.floor(diffSeconds / 86400);
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } 
    // Si es antiguo, mostrar la fecha completa en formato peruano
    else {
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const anio = date.getFullYear();
      
      return `${dia} de ${mes} de ${anio}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Fecha no disponible';
  }
};

export default function DashboardPage() {
  const { locale } = useParams();
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    error?: string;
    graphQLErrors?: string[];
    networkError?: string;
    stack?: string;
  } | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_USER, {
    client,
    onError: (error) => {
      console.error('GraphQL Error:', error);
      console.error('Error details:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
      
      // Show debug info to help troubleshoot
      setDebugInfo({
        error: error.message,
        graphQLErrors: error.graphQLErrors?.map(e => e.message),
        networkError: error.networkError?.message,
        stack: error.stack
      });
      
      // If the error is related to an invalid token, clear the token and redirect to login
      if (error.message.includes('Invalid token') || error.message.includes('Not authenticated')) {
        console.log('Authentication error detected, redirecting to login');
        handleLogout();
      }
    },
    onCompleted: (data) => {
      console.log('User query completed successfully');
      console.log('User data:', data?.me);
      
      // If we have valid user data, we're logged in
      if (data?.me) {
        console.log('User is logged in:', data.me.email, 'with role:', data.me.role?.name);
        setDebugInfo(null); // Clear debug info
      }
    },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const { 
    data: notificationsData, 
    loading: notificationsLoading,
    refetch: refetchNotifications
  } = useQuery(GET_NOTIFICATIONS, {
    client,
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Notifications error:', error);
    },
    onCompleted: (data) => {
      // Auto-show notifications panel if there are unread notifications
      if (data?.unreadNotificationsCount > 0) {
        setShowNotifications(true);
      }
      
      // Debug: Log the complete notification data
      if (data?.notifications?.length > 0) {
        console.log('Sample notification data:', JSON.stringify(data.notifications[0]));
        console.log('Notification createdAt type:', typeof data.notifications[0].createdAt);
        console.log('Notification createdAt value:', data.notifications[0].createdAt);
      }
    }
  });

  const [markAsRead] = useMutation(MARK_NOTIFICATION_READ, {
    client,
    onCompleted: () => {
      refetchNotifications();
    }
  });

  const [markAllAsRead] = useMutation(MARK_ALL_READ, {
    client,
    onCompleted: () => {
      refetchNotifications();
    }
  });

  const handleLogout = async () => {
    try {
      setIsLoggedOut(true);
      console.log('Logging out user - clearing session token');
      document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = `/${locale}/login`;
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Check for cookie on component mount and when needed
  useEffect(() => {
    const checkLoginStatus = () => {
      const cookies = document.cookie;
      const hasToken = cookies.includes('session-token=');
      console.log('Session token present in cookies:', hasToken);
      console.log('All cookies:', cookies);
      
      if (!hasToken && !isLoggedOut) {
        console.log('No session token detected, redirecting to login');
        window.location.href = `/${locale}/login`;
      }
      
      // If the token exists but we got an error, let's retry the query once
      if (hasToken && error && !isLoggedOut) {
        console.log('Token exists but query failed, retrying...');
        setTimeout(() => refetch(), 1000);
      }
    };
    
    checkLoginStatus();
  }, [locale, error, isLoggedOut, refetch]);

  useEffect(() => {
    console.log('Query status:', {
      loading,
      error: error?.message,
      data: data?.me,
    });
    
    // If we have an authentication error, redirect to login
    if (error && (error.message.includes('Invalid token') || error.message.includes('Not authenticated'))) {
      handleLogout();
    }
  }, [loading, error, data, handleLogout]);

  // Check if the user just logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasJustLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
      if (wasJustLoggedIn) {
        console.log('User just logged in, showing welcome message');
        setJustLoggedIn(true);
        // Remove the flag from sessionStorage
        sessionStorage.removeItem('justLoggedIn');
      }
    }
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead({
      variables: {
        id,
        input: { isRead: true }
      }
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard Error:', error);
    
    // Display debug info instead of redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl text-xl text-red-600">
          <h1 className="text-2xl mb-4">Error loading user data</h1>
          <p className="mb-2">{error.message}</p>
          
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
              <h2 className="text-lg mb-2">Debug Information:</h2>
              <pre className="overflow-auto max-h-80">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              <p className="mt-4 text-gray-700">
                Please try logging in again or contact support with this information.
              </p>
            </div>
          )}
          
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Login
            </button>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const user = data?.me;
  console.log('Rendering dashboard with user data:', user);
  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notifications.filter((notification: Notification) => !notification.isRead);
  const unreadCount = notificationsData?.unreadNotificationsCount || 0;

  return (
    <PermissionGuard 
      permission="dashboard:view" 
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h1>
            <p className="text-gray-600 mb-6">
              No tiene permisos para acceder a esta sección del dashboard. 
              Por favor contacte al administrador si cree que esto es un error.
            </p>
            <button
              onClick={() => window.location.href = `/${locale}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      }
    >
      <div className="container mx-auto p-4 relative">
        {justLoggedIn && data?.me && (
          <WelcomeBanner userName={data.me.firstName || data.me.email.split('@')[0]} />
        )}
        
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-6 sm:pt-10 md:pt-12">
          <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl px-2 sm:px-4 md:px-6">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 md:p-8">
              {user && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Beneficios E-Voque</h2>
                    
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notificaciones
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Notifications Panel */}
                  {showNotifications && (
                    <div className="mb-6 border rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center bg-gray-50 p-3 border-b">
                        <h3 className="font-medium">Notificaciones</h3>
                        <div className="flex space-x-3">
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Marcar todas como leídas
                          </button>
                          <button 
                            onClick={() => window.location.href = `/${locale}/dashboard/notifications`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Ver todas
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-auto max-h-96">
                        {notificationsLoading ? (
                          <div className="p-4 text-center text-gray-500">Cargando notificaciones...</div>
                        ) : unreadNotifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">No tienes notificaciones sin leer</div>
                        ) : (
                          <ul className="divide-y">
                            {unreadNotifications.map((notification: Notification) => (
                              <li 
                                key={notification.id} 
                                className="p-3 hover:bg-gray-50 transition bg-blue-50"
                              >
                                <div className="flex justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-blue-700">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatRelativeTime(notification.createdAt)}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                                  >
                                    Marcar como leída
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mb-8 justify-center flex-wrap">
                    {/* Beneficios E-Voque */}
                    <button
                      className={`relative overflow-hidden flex flex-col items-center justify-end w-60 h-20 rounded-lg bg-contain bg-center transition-all duration-300 ${
                        selectedBenefit === 'benefits' 
                          ? 'ring-4 ring-blue-500' 
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundImage: "url('/images/evoque-benefits.png')",
                      }}
                      onClick={() => setSelectedBenefit(selectedBenefit === 'benefits' ? null : 'benefits')}
                    >
                      <div className="absolute inset-0 bg-black/30" />
                      <span className="relative text-xs font-semibold text-white mb-2 px-2 py-1 rounded-full bg-black/50">
                        Beneficios
                      </span>
                    </button>

                    {/* Wellness */}
                    <button
                      className="relative overflow-hidden flex flex-col items-center justify-end w-48 h-20 rounded-lg bg-green-200 opacity-50 cursor-not-allowed"
                      style={{
                        backgroundImage: "url('/images/wellness-benefits.png')",
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                      }}
                      disabled
                    >
                      <div className="absolute inset-0 bg-black/30 z-10" />
                      <Lock className="absolute top-2 right-2 z-20 text-white opacity-90" size={20} />
                      <span className="relative z-20 text-xs font-semibold text-white mb-2 px-2 py-1 rounded-full bg-black/50">
                        Wellness (Bloqueado)
                      </span>
                    </button>

                    {/* Círculo Extra (Próximamente) */}
                    <div className="flex flex-col items-center justify-center w-40 h-20 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                      <span className="text-xs font-medium text-center">Próximamente</span>
                    </div>
                  </div>
                  
                  {/* Iframe container */}
                  {selectedBenefit && (
                    <div className="mt-6 w-full">
                      <div className="bg-gray-50 p-3 mb-3 flex justify-between items-center rounded-t-lg border border-gray-200">
                        <a
                          href={selectedBenefit === 'benefits' ? 'https://pe.e-voquebenefit.com/' : 'https://wellness.e-voque.com/'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-medium text-blue-600 hover:underline"
                        >
                          {selectedBenefit === 'benefits' ? 'E-Voque Beneficios' : 'E-Voque Wellness'}
                        </a>
                        <button 
                          onClick={() => setSelectedBenefit(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="text-center p-8 bg-white border border-gray-200 rounded-b-lg">
                        <p className="text-gray-600 text-lg">
                          Abre la plataforma en una nueva pestaña:
                        </p>
                        <a
                          href={selectedBenefit === 'benefits' ? 'https://pe.e-voquebenefit.com/' : 'https://wellness.e-voque.com/'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          Ir a {selectedBenefit === 'benefits' ? 'E-Voque Beneficios' : 'E-Voque Wellness'}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Brand Carousel */}
                  <div className="mt-8 mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Marcas Asociadas</h3>
                    <div className="relative overflow-hidden">
                      <div className="brand-carousel flex animate-scroll">
                        {/* First set of brands */}
                        <div className="flex space-x-8 items-center mr-16">
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/Logo_Ripley.svg" alt="Ripley" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/Logotipo_Sodimac.svg.webp" alt="Sodimac" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/plaza-vea-png-1.webp" alt="Plaza Vea" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/b2.png" alt="Be balance Gimnasio" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/tottus.png" alt="Tottus" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/evoque.png" alt="Evoque" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                        </div>
                        {/* Duplicate set for continuous scrolling */}
                        <div className="flex space-x-8 items-center mr-16">
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/Logo_Ripley.svg" alt="Ripley" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/Logotipo_Sodimac.svg.webp" alt="Sodimac" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/plaza-vea-png-1.webp" alt="Plaza Vea" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/tottus.png" alt="Tottus" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                          <div className="brand-item w-32 h-20 flex items-center justify-center">
                            <Image src="/images/evoque.png" alt="Evoque" className="max-h-14 max-w-full" width={100} height={100} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <style jsx>{`
                    @keyframes scroll {
                      0% {
                        transform: translateX(0);
                      }
                      100% {
                        transform: translateX(-50%);
                      }
                    }
                    .animate-scroll {
                      animation: scroll 20s linear infinite;
                    }
                  `}</style>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
} 