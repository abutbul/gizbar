import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// --- Types and Constants ---

export const languages = {
    he: { name: 'עברית', flag: '🇮🇱' },
    en: { name: 'English', flag: '🇺🇸' },
    ru: { name: 'Русский', flag: '🇷🇺' },
};

export type Language = keyof typeof languages;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: { [key: string]: string | number }) => string;
}

// --- Context Definition ---

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// --- Helper Functions ---

const getInitialLanguage = (): Language => {
    const savedLang = localStorage.getItem('treasurer_lang') as Language;
    if (savedLang && languages[savedLang]) {
        return savedLang;
    }
    // Default to Hebrew if no language preference is saved.
    return 'he';
};

// --- Provider Component ---

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>(getInitialLanguage());
    const [translations, setTranslations] = useState<Record<Language, any> | null>(null);

    useEffect(() => {
        const loadTranslations = async () => {
            try {
                // Fetch all translation files.
                const [heResponse, enResponse, ruResponse] = await Promise.all([
                    fetch('./locales/he.json'),
                    fetch('./locales/en.json'),
                    fetch('./locales/ru.json')
                ]);

                if (!heResponse.ok || !enResponse.ok || !ruResponse.ok) {
                    throw new Error('Failed to fetch translation files');
                }

                const he = await heResponse.json();
                const en = await enResponse.json();
                const ru = await ruResponse.json();
                
                setTranslations({ he, en, ru });
            } catch (error) {
                console.error("Could not load translations:", error);
                // Set empty translations on error to prevent crashing the app
                setTranslations({ he: {}, en: {}, ru: {} });
            }
        };

        loadTranslations();
    }, []); // Empty dependency array ensures this runs only once on mount

    useEffect(() => {
        localStorage.setItem('treasurer_lang', language);
        // Set document direction for RTL support
        if (language === 'he') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }, [language]);

    const t = (key: string, params?: { [key: string]: string | number }): string => {
        if (!translations) {
            return key;
        }
        
        let text = translations[language]?.[key] || translations.en?.[key] || key;
        
        if (params) {
            Object.keys(params).forEach(paramKey => {
                const regex = new RegExp(`{${paramKey}}`, 'g');
                text = text.replace(regex, String(params[paramKey]));
            });
        }
        return text;
    };

    return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

// --- Custom Hook ---

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};