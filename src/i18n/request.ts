import { getRequestConfig } from 'next-intl/server';

// Define los idiomas soportados
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  try {
    // Cargar los mensajes para el locale actual
    const messages = (await import(`../app/i18n/dictionaries/${locale}.json`)).default;
    
    return {
      locale: locale as string,
      messages
    };
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error);
    return {
      locale: locale as string,
      messages: {}
    };
  }
}); 