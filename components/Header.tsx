
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button.tsx';
import { useTranslation, languages, Language } from '../i18n/index.ts';
import { ChevronDownIcon } from './icons/ChevronDownIcon.tsx';

type View = 'gatherings' | 'members';

interface HeaderProps {
    onImportClick: () => void;
    onExportClick: () => void;
    currentView: View;
    onNavigate: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ onImportClick, onExportClick, currentView, onNavigate }) => {
    const { t, language, setLanguage } = useTranslation();
    const [isLangMenuOpen, setLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    const navButtonClasses = (view: View) =>
        `px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            currentView === view
            ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-700 dark:text-slate-100'
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
        }`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{t('appName')}</h1>
                        <div className="relative" ref={langMenuRef}>
                            <button onClick={() => setLangMenuOpen(prev => !prev)} className="flex items-center gap-1 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                <span>{languages[language].flag}</span>
                                <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                            </button>
                            {isLangMenuOpen && (
                                <div className="absolute top-full mt-2 ltr:left-0 rtl:right-0 w-40 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 py-1 z-50">
                                    {Object.keys(languages).map((langKey) => (
                                        <button 
                                            key={langKey} 
                                            onClick={() => { setLanguage(langKey as Language); setLangMenuOpen(false); }}
                                            className="w-full text-start flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <span>{languages[langKey as Language].flag}</span>
                                            <span>{languages[langKey as Language].name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="hidden sm:flex flex-1 justify-center items-center px-8">
                         <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
                            <button onClick={() => onNavigate('gatherings')} className={navButtonClasses('gatherings')}>{t('gatherings')}</button>
                            <button onClick={() => onNavigate('members')} className={navButtonClasses('members')}>{t('members')}</button>
                         </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <Button onClick={onImportClick} variant="secondary">{t('import')}</Button>
                        <Button onClick={onExportClick} variant="secondary">{t('export')}</Button>
                    </div>
                </div>
                {/* Mobile navigation */}
                <div className="sm:hidden flex justify-center pb-3">
                    <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
                        <button onClick={() => onNavigate('gatherings')} className={navButtonClasses('gatherings')}>{t('gatherings')}</button>
                        <button onClick={() => onNavigate('members')} className={navButtonClasses('members')}>{t('members')}</button>
                    </div>
                </div>
            </div>
        </header>
    );
};