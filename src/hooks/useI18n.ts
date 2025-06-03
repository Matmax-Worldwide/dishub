import { useParams } from 'next/navigation';
import { getDictionary, Locale } from '@/app/(tools)/i18n';

export function useI18n() {
  const params = useParams();
  const locale = params?.locale as Locale || 'en';
  const dictionary = getDictionary(locale);

  const t = (key: string) => {
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
    
    return result as string;
  };

  return { t, locale, dictionary };
} 