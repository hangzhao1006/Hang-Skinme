"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/locales/translations';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // 同步从 localStorage 恢复语言设置，避免闪烁
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language | null;
      const validLanguages: Language[] = ['en', 'zh', 'es', 'vi'];
      if (savedLanguage && validLanguages.includes(savedLanguage)) {
        return savedLanguage;
      }
    }
    return 'en';
  });

  // 确保 localStorage 中有语言设置
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('language')) {
      localStorage.setItem('language', language);
    }
  }, []);

  // switch language between 'en' and 'zh'
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'zh' ? 'en' : 'zh';
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // set language directly
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
