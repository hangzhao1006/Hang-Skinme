'use client';

import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';

export default function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const { language } = useLanguage();
    const t = useTranslations(language);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated()) {
            router.push('/app');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            router.push('/app');
        } else {
            setError(result.error || t.loginFailed);
        }

        setLoading(false);
    };

    const handleQuickDemo = () => {
        router.push('/app');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4dce6]/30 via-[#c8e5b9]/25 to-[#e8d9c9]/30 flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md p-8 md:p-10 shadow-xl border-none bg-white/95 backdrop-blur-sm">
                {/* Logo - Clinical Design */}
                <div className="text-center mb-8 md:mb-10">
                    <img src="/assets/logo4.svg" alt="SkinMe Logo" className="w-16 h-16 mx-auto mb-6 flex items-center justify-start" />
                    <h1 className="text-3xl font-medium text-foreground mb-2 justify-center">
                        {t.loginTitle}
                    </h1>
                    <p className="text-muted-foreground text-base font-normal">
                        {t.loginSubtitle}
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-destructive text-sm font-normal">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t.loginEmail}
                        </label>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            className="h-12 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg bg-background"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t.loginPassword}
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            className="h-12 border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg bg-background"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                        {loading ? t.loginLoading : t.loginButton}
                    </Button>

                    {/* Quick Demo - go directly to chat without auth */}
                    <Button
                        type="button"
                        onClick={handleQuickDemo}
                        variant="outline"
                        className="w-full h-12 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 font-medium rounded-full transition-all"
                    >
                        Quick Demo
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-card text-muted-foreground font-normal">{t.loginOr}</span>
                    </div>
                </div>

                {/* Signup Link */}
                <div className="text-center">
                    <p className="text-muted-foreground font-normal">
                        {t.loginNoAccount}{' '}
                        <Link href="/signup" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">
                            {t.loginSignupLink}
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground font-normal transition-colors">
                        {t.loginBackHome}
                    </Link>
                </div>
            </Card>
        </div>
    );
}
