import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import ConditionalLayout from '@/components/ConditionalLayout';
import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SkinMe - AI Skincare Assistant',
    description: 'AI-powered skincare analysis and product recommendations',
}

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" className="h-full" suppressHydrationWarning>
            <head>
                <link href="assets/logo.svg" rel="shortcut icon" type="image/x-icon"></link>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
            </head>
            <body>
                <ClientProviders>
                    <ConditionalLayout>
                        {children}
                    </ConditionalLayout>
                </ClientProviders>
            </body>
        </html>
    );
}
