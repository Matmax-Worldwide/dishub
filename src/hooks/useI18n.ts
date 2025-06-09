import { useParams } from 'next/navigation';
import { getDictionary, Locale } from '@/app/i18n';

export function useI18n() {
  const params = useParams();
  const locale = params?.locale as Locale || 'en';
  const dictionary = getDictionary(locale);

  const t = (key: string, variables?: Record<string, string | number>) => {
    // Split the key by dots to navigate through the dictionary
    const keys = key.split('.');
    let result: unknown = dictionary;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && result !== null && Object.prototype.hasOwnProperty.call(result, k)) {
        result = (result as Record<string, unknown>)[k];
      } else {
        // Return the key as fallback if translation not found
        return key;
      }
    }
    
    // Ensure we only return strings, not objects
    if (typeof result !== 'string') {
      console.warn(`Translation key "${key}" resolved to non-string value:`, result);
      return key; // Return the key as fallback
    }
    
    let translation = result;
    
    // Handle variable interpolation
    if (variables && typeof translation === 'string') {
      Object.entries(variables).forEach(([key, value]) => {
        translation = translation.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      });
    }
    
    return translation;
  };

  return { t, locale, dictionary };
} 