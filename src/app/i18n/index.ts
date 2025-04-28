import enDict from './dictionaries/en.json';
import esDict from './dictionaries/es.json';

export const dictionaries = {
  en: enDict,
  es: esDict,
};

export type Locale = keyof typeof dictionaries;

export const locales = Object.keys(dictionaries) as Locale[];

// Define the Dictionary type structure
export interface Dictionary {
  nav: {
    home: string;
    about: string;
    services: string;
    wellness: string;
    contact: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  about: {
    title: string;
    description: string;
    mission: string;
  };
  services: {
    title: string;
    medical: {
      title: string;
      description: string;
    };
    legal: {
      title: string;
      description: string;
    };
    business: {
      title: string;
      description: string;
    };
    emergency: {
      title: string;
      description: string;
    };
  };
  benefits: {
    title: string;
    quality: string;
    speed: string;
    availability: string;
    languages: string;
    security: string;
    technology: string;
  };
  contact: {
    title: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    form: {
      name: string;
      email: string;
      message: string;
      submit: string;
    };
  };
  footer: {
    rights: string;
    privacy: string;
    terms: string;
  };
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] as Dictionary;
} 