import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation(); // Remove 't' since it's not used
    
    const changeLanguage = (lng: 'en' | 'rw') => {
        i18n.changeLanguage(lng);
        localStorage.setItem('preferred_language', lng);
    };
    
    return (
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    i18n.language === 'en' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
                English
            </button>
            <button
                onClick={() => changeLanguage('rw')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    i18n.language === 'rw' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
                Kinyarwanda
            </button>
        </div>
    );
}