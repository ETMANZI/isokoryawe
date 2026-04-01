import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    
    const changeLanguage = (lng: 'en' | 'rw') => {
        i18n.changeLanguage(lng);
        localStorage.setItem('preferred_language', lng);
    };
    
    // Return a very visible button to test
    return (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <button onClick={() => changeLanguage('en')} className="mr-2">EN</button>
            <button onClick={() => changeLanguage('rw')}>RW</button>
        </div>
    );
}