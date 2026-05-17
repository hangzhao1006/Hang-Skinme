'use client'

import { useState, CSSProperties } from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Menu, X, User, LogIn, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

export default function Header() {
    // Component States
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();
    const { language } = useLanguage();
    const t = useTranslations(language);
    const { user, isAuthenticated, logout } = useAuth();
    const isChatHistoryPage = pathname?.startsWith('/chat-history');

    const handleLogout = (): void => {
        logout();
        router.push('/');
        setIsMenuOpen(false);
    };

    // Add your navigation items here
    const navItems: NavItem[] = [];

    // UI View
    return (
        <>
            <header
              className={`header-wrapper mobile-safe-padding ${isChatHistoryPage ? 'hidden md:block' : ''}`}
              style={
                {
                  '--safe-padding-mobile': 'max(env(safe-area-inset-top, 0px), 3.5rem)',
                  '--safe-padding-desktop': '0px'
                } as CSSProperties
              }
            >
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Image
                                src="/assets/logo.svg"
                                alt="SkinMe logo"
                                width={32}
                                height={32}
                                priority
                            />
                        </div>
                        <Link href="/" className="font-medium text-slate-900">
                            SkinMe AI
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated() ? (
                            <>
                                <Link href="/app" className="hidden md:block">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{user?.name || user?.email}</span>
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hidden md:flex gap-2"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>{t.logOut}</span>
                                </Button>
                            </>
                        ) : null}
                        <LanguageSwitcher />
                        <button
                            className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu translate-y-0">
                        <nav className="px-4 py-2 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all ${pathname === item.path ? 'bg-accent text-foreground font-medium' : ''
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {/* Auth buttons for mobile */}
                            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                                {isAuthenticated() ? (
                                    <>
                                        <Link
                                            href="/app"
                                            className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <User className="h-5 w-5" />
                                            <span>{user?.name || user?.email}</span>
                                        </Link>
                                        <button
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="h-5 w-5" />
                                            <span>Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] shadow-lg hover:shadow-xl transition-all font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <LogIn className="h-5 w-5" />
                                        <span>Login</span>
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>
            {isMenuOpen && <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />}
        </>
    );
}
