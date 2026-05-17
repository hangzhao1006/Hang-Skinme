'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe2 } from 'lucide-react';
import { useTranslations } from '@/locales/translations';

interface LanguageSwitcherProps {
  showFlag?: boolean;
  alignStart?: boolean; // if true, align content to the left (e.g., sidebar mobile)
}

const LanguageSwitcher = ({ showFlag = true, alignStart = false }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations(language);

  const languages = ['zh', 'en', 'es', 'vi'] as const;
  const labels: Record<(typeof languages)[number], string> = {
    zh: '中',
    en: 'EN',
    es: 'ES',
    vi: 'VI'
  };

  const displayLabel = alignStart ? (t.sidebarLanguage || t.languageSwitcherTitle) : labels[language];
  const flags: Record<(typeof languages)[number], string> = {
    zh: '🇨🇳',
    en: '🇺🇸',
    es: '🇪🇸',
    vi: '🇻🇳'
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div
      className={`relative flex flex-col ${alignStart ? 'items-start' : 'items-center'}`}
      ref={containerRef}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`p-0 rounded-full bg-transparent hover:bg-white/60 transition-all duration-150 ease-out flex items-center gap-4 text-slate-800 ${
          alignStart ? 'justify-start' : 'justify-center'
        }`}
        title="Change language"
        type="button"
        aria-expanded={open}
      >
        <Globe2 className="w-5 h-5 text-slate-700" aria-hidden />
        <span className="text-sm text-foreground font-medium md:hidden">{displayLabel}</span>
      </button>

      <ul
        aria-hidden={!open}
        className={`absolute min-w-[5rem] max-w-[6rem] rounded-xl border border-slate-200/70 bg-white/85 backdrop-blur-md shadow-lg overflow-hidden z-30 transform transition-all duration-200 ease-out origin-top ${
          open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
        }`}
        style={{ left: '50%', top: 'calc(100% + 10px)', transform: 'translateX(-50%)' }}
      >
        {languages.map((lang) => (
          <li key={lang}>
            <button
              type="button"
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors duration-150 ease-out hover:bg-white/70 ${
                lang === language ? 'bg-white/70 font-medium' : 'text-slate-700'
              }`}
            >
              {showFlag && (
                <span className="text-lg" aria-hidden>
                  {flags[lang]}
                </span>
              )}
              <span>{labels[lang]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageSwitcher;
