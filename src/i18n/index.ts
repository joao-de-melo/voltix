import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enCustomers from './locales/en/customers.json';
import enProducts from './locales/en/products.json';
import enQuotes from './locales/en/quotes.json';
import enSettings from './locales/en/settings.json';
import enValidation from './locales/en/validation.json';

// Portuguese translations
import ptCommon from './locales/pt/common.json';
import ptAuth from './locales/pt/auth.json';
import ptCustomers from './locales/pt/customers.json';
import ptProducts from './locales/pt/products.json';
import ptQuotes from './locales/pt/quotes.json';
import ptSettings from './locales/pt/settings.json';
import ptValidation from './locales/pt/validation.json';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    customers: enCustomers,
    products: enProducts,
    quotes: enQuotes,
    settings: enSettings,
    validation: enValidation,
  },
  pt: {
    common: ptCommon,
    auth: ptAuth,
    customers: ptCustomers,
    products: ptProducts,
    quotes: ptQuotes,
    settings: ptSettings,
    validation: ptValidation,
  },
};

export const supportedLanguages = ['en', 'pt'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    defaultNS: 'common',
    ns: ['common', 'auth', 'customers', 'products', 'quotes', 'settings', 'validation'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'voltix-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
