'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface ConditionalLayoutProps {
    children: ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname();

    // Don't show Header/Footer on dashboard pages and landing page
    const isDashboardPage = pathname?.startsWith('/app') ||
                           pathname?.startsWith('/dashboard') ||
                           pathname?.startsWith('/history') ||
                           pathname?.startsWith('/chat-history') ||
                           pathname?.startsWith('/profile');

    const isLandingPage = pathname === '/';

    if (isDashboardPage || isLandingPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            <main className="flex-grow pt-16">{children}</main>
            <Footer />
        </>
    );
}
