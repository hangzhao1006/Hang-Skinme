'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';

export default function SignupPage() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const { signup, isAuthenticated } = useAuth();
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

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            setError(t.signupErrorFields);
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError(t.signupErrorPassword);
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError(t.signupErrorPasswordLength);
            setLoading(false);
            return;
        }

        const result = await signup(email, password, name);

        if (result.success) {
            router.push('/app');
        } else {
            setError(result.error || t.signupFailed);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-cyan-50 to-rose-50 flex items-center justify-center px-4 py-12 overflow-hidden">
            {/* Animated Gradient Background */}
            <AnimatedGradientBackground className="opacity-30" />

            <Card className="w-full max-w-md p-8 shadow-card border-0 bg-card/95 backdrop-blur-sm relative z-10">
                {/* Logo */}
                <div className="text-center mb-8 md:mb-10">
                    <img src="/assets/logo4.svg" alt="SkinMe Logo" className="w-16 h-16 mx-auto mb-6 flex items-center justify-start" />
                    <h1 className="text-3xl font-medium text-foreground">
                        {t.signupTitle}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {t.signupSubtitle}
                    </p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-sm">❌ {error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t.signupName}
                        </label>
                        <Input
                            type="text"
                            placeholder={t.signupNamePlaceholder}
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            className="h-12 border border-input focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-lg bg-background"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t.signupEmail}
                        </label>
                        <Input
                            type="email"
                            placeholder={t.signupEmailPlaceholder}
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            className="h-12 border border-input focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-lg bg-background"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t.signupPassword}
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            className="h-12 border border-input focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-lg bg-background"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t.signupConfirmPassword}
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                            className="h-12 border border-input focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-lg bg-background"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        // 方案1: 优雅的蓝绿色渐变
                        className="w-full h-12 bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                        {loading ? t.signupLoading : t.signupButton}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-card text-muted-foreground">{t.signupOr}</span>
                    </div>
                </div>

                {/* Login Link */}
                <div className="text-center">
                    <p className="text-muted-foreground">
                        {t.signupHaveAccount}{' '}
                        <Link href="/login" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">
                            {t.signupLoginLink}
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {t.signupBackHome}
                    </Link>
                </div>
            </Card>
        </div>
    );
}
