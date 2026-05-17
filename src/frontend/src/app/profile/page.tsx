"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const t = useTranslations(language);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f4dce6]/20 via-[#c8e5b9]/30 via-[#e8d9c9]/30 to-[#d8c5f4]/30 mobile-safe-padding"
      style={
        {
          '--safe-padding-mobile': 'max(env(safe-area-inset-top, 0px), 3rem)',
          '--safe-padding-desktop': '0px'
        } as React.CSSProperties
      }
    >
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6 p-4">
          <BackButton label={t.back} />
        </div>

        <h1 className="text-3xl p-8 font-medium mb-8 text-slate-800">
          {t.dashboardWelcome || 'Profile'}
        </h1>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-4xl text-slate-600">👤</span>
              </div>
              <div>
                <div className="text-2xl font-medium text-foreground mb-1">
                  {user?.name || 'Guest'}
                </div>
                <div className="text-base text-muted-foreground font-normal">
                  {user?.email || ''}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <LanguageSwitcher showFlag={false} />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-8 h-11 font-medium shadow-button hover:shadow-button-hover transition-all"
            >
              {t.profileLogout}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
