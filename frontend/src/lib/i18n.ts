import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const savedLanguage = localStorage.getItem('preferred_language') || 'en';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: import.meta.env.DEV
        ? '/locales/{{lng}}/translation.json'
        : '/static/frontend/locales/{{lng}}/translation.json',
    },

    lng: savedLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'rw'],

    // ✅ FIX STARTS HERE
    ns: ['translation'],          // declare namespace
    defaultNS: 'translation',     // set default namespace
    keySeparator: '.',            // allow nested keys like sidebar.quick_actions
    // ✅ FIX ENDS HERE

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