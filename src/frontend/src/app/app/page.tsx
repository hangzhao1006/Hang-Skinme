'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardContent } from '@/components/DashboardContent';
import { ChatProvider } from '@/contexts/ChatContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';

function AppPageContent() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    return (
        <DashboardLayout>
            <DashboardContent API_BASE_URL={API_BASE_URL} />
        </DashboardLayout>
    );
}

export default function AppPage() {
    const { language } = useLanguage();
    const t = useTranslations(language);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 在语言加载完成前显示加载状态
    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <ChatProvider initialMessage={t.dashboardAIWelcomeMessage}>
            <AppPageContent />
        </ChatProvider>
    );
}
