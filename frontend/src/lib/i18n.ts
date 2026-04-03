import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import rwTranslation from '../locales/rw/translation.json';

const savedLanguage = localStorage.getItem('preferred_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      rw: {
        translation: rwTranslation,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'rw'],
    interpolation: {
      escapeValue: false,
    },
    debug: import.meta.env.DEV,
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferred_language', lng);
  console.log('🌐 Language changed to:', lng);
});

export default i18n;