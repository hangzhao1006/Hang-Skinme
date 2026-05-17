'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground';
import { User, Menu, X } from 'lucide-react';
import { useState, useEffect, CSSProperties } from 'react';

export default function HomePage() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = useTranslations(language);
    const { user, logout, isAuthenticated, initialized, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const authReady = initialized && !loading;
    const authed = authReady && isAuthenticated();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreateProfile = () => {
        router.push('/signup');
    };

    const handleMemberLogin = () => {
        router.push('/login');
    };

    const handleQuickDemo = () => {
        router.push('/app');
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Palette snippets (备用配色，方便替换)
    // 1) Sage Glass (current): bg from #7a8a6a -> #5b6856; CTA btn text #3f4836
    // 2) Pear Pop: gradients from #d6f08f -> #85b83a; outline text #5f7c2f
    // 3) Silver Olive: gradients from #eef1ee -> #7a8370; outline text #4f5548
    // 4) Clay Sand: gradients from #f1cda4 -> #a96149; outline text #a96149
    // 5) Mist Blue: gradients from #d9e9ff -> #7aa7d9; outline text #3b5d88
    // 6) Lilac + Lime (你提的紫绿): gradients from #d8b3ff -> #7ccf4a; outline text #5b2f82 or #5f7c2f

    // 在语言加载完成前显示背景渐变，避免文字闪烁
    if (!mounted) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f7f9f4] to-white">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,215,177,0.2),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(228,235,217,0.2),transparent_24%),radial-gradient(circle_at_50%_85%,rgba(182,198,156,0.16),transparent_26%)]" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f7f9f4] to-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,215,177,0.2),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(228,235,217,0.2),transparent_24%),radial-gradient(circle_at_50%_85%,rgba(182,198,156,0.16),transparent_26%)]" />
            {/* Navigation */}
            <nav
                className="fixed top-0 left-0 right-0 bg-white/85 backdrop-blur-md border-b border-slate-200 z-50 mobile-safe-padding"
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
                            <Image src="/assets/logo.svg" alt="SkinMe logo" width={32} height={32} priority />
                        </div>
                        <span className="font-medium text-slate-900">SkinMe AI</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 min-h-[40px]">
                        {!authReady ? (
                            <div className="w-24 h-6 rounded-full bg-slate-100 animate-pulse" aria-hidden />
                        ) : authed ? (
                            <>
                                <button
                                    onClick={() => router.push('/app')}
                                    className="text-slate-700 font-medium hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <User className="w-5 h-5" />
                                    {user?.name}
                                </button>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="text-slate-600 hover:text-slate-900"
                                >
                                    {t.logOut}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={handleMemberLogin} className="text-slate-600 hover:text-slate-900">
                                    {t.navLogin}
                                </Button>
                                <Button
                                    onClick={handleCreateProfile}
                                    // 方案1: 优雅的蓝绿色渐变
                                    className="bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] rounded-full px-6 shadow-lg hover:shadow-xl transition-all shadow-[0_12px_28px_rgba(109,138,92,0.22)]"
                                >
                                    {t.signup}
                                </Button>
                            </>
                        )}
                        <LanguageSwitcher />
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white">
                        <div className="px-6 py-4 space-y-3">
                            {authReady && authed ? (
                                <>
                                    <button
                                        onClick={() => {
                                            router.push('/app');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors justify-center flex items-center gap-2"
                                    >
                                        <User className="w-5 h-5" />
                                        <span>{user?.name}</span>
                                    </button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full justify-center"
                                    >
                                        {t.logOut}
                                    </Button>
                                </>
                            ) : authReady ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            handleMemberLogin();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full justify-center bg-slate-100 hover:bg-slate-200"
                                    >
                                        {t.navLogin}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleCreateProfile();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] rounded-full shadow-lg"
                                    >
                                        {t.signup}
                                    </Button>
                                </>
                            ) : null}
                            <div className="pt-2 justify-center flex mb-2">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-40 md:pt-44 pb-12 md:pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="relative overflow-hidden bg-white/80 backdrop-blur-[1px] rounded-[24px] md:rounded-[36px] p-6 md:p-10 lg:p-12 text-center border-white/60 shadow-2xl shadow-slate-200">
                        {/* Skin texture placeholder */}
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-85"
                            style={{ backgroundImage: "url('/assets/bg.jpg')" }}
                        />
                        {/* Softer gradient overlay */}
                        <AnimatedGradientBackground className="opacity-25" />

                        {/* Content Layer - Reduced height and padding on mobile */}
                        <div className="relative z-10 flex flex-col items-center justify-center gap-2 md:gap-4 min-h-[160px] md:min-h-[240px] text-center">
                            <h1 className="text-3xl md:text-6xl lg:text-7xl font-semibold text-white leading-tight drop-shadow-md">
                                {t.heroTitle}
                            </h1>
                            <p className="text-white/90 max-w-3xl mx-auto text-sm md:text-[20px] leading-relaxed drop-shadow px-4">
                                {t.heroSubtitle}
                            </p>
                            {!authReady ? (
                                // Loading state - prevent flash
                                <div className="h-14 pt-8" />
                            ) : authed ? (
                                <div className="flex items-center justify-center pt-10">
                                    <Button
                                        onClick={handleQuickDemo}
                                        className="bg-white/90 text-[#1f271c] hover:bg-white rounded-full px-12 h-14 text-lg font-semibold shadow-[0_18px_46px_rgba(0,0,0,0.22)] border border-white/70 backdrop-blur-sm"
                                    >
                                        {t.ctaReadyTitle || 'Back to Chat'}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop layout: all buttons in one row */}
                                    <div className="hidden md:flex items-center justify-center gap-4 pt-8">
                                        <Button
                                            onClick={handleCreateProfile}
                                            className="bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] rounded-full px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all shadow-[0_14px_30px_rgba(109,138,92,0.24)]"
                                        >
                                            {t.createProfile}
                                        </Button>
                                        <Button
                                            onClick={handleMemberLogin}
                                            variant="outline"
                                            className="text-[#4f5f43] rounded-full px-10 h-14 text-lg border-2 border-[#d7e3c5] hover:bg-[#f1f5eb] backdrop-blur-sm"
                                        >
                                            {t.memberLogin}
                                        </Button>
                                    </div>
                                    <div className="hidden md:flex items-center justify-center pt-2">
                                        <Button
                                            onClick={handleQuickDemo}
                                            className="bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] rounded-full px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all shadow-[0_14px_30px_rgba(109,138,92,0.24)]"
                                        >
                                            {t.quickDemo}
                                        </Button>
                                    </div>

                                    {/* Mobile layout: Register/Login side-by-side, Quick Demo below */}
                                    <div className="md:hidden flex flex-col items-center gap-3 pt-8 w-full px-4">
                                        <div className="flex items-center justify-center gap-3 w-full">
                                            <Button
                                                onClick={handleCreateProfile}
                                                className="flex-1 bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] rounded-full h-12 text-base shadow-lg hover:shadow-xl transition-all shadow-[0_14px_30px_rgba(109,138,92,0.24)]"
                                            >
                                                {t.createProfile}
                                            </Button>
                                            <Button
                                                onClick={handleMemberLogin}
                                                variant="outline"
                                                className="flex-1 text-[#4f5f43] rounded-full h-12 text-base border-2 border-[#d7e3c5] hover:bg-[#f1f5eb] backdrop-blur-sm"
                                            >
                                                {t.memberLogin}
                                            </Button>
                                        </div>
                                        <Button
                                            onClick={handleQuickDemo}
                                            className="w-full bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] rounded-full h-12 text-base shadow-lg hover:shadow-xl transition-all shadow-[0_14px_30px_rgba(109,138,92,0.24)]"
                                        >
                                            {t.quickDemo}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Stories */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-medium mb-4 text-slate-900">
                            {t.precisionSkincare}
                        </h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg font-normal">
                            {t.landingSubtitle}
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* Row 1: text + image (mobile: text on top) */}
                        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 md:items-center">
                            <div className="space-y-4 order-1">
                                <h3 className="text-2xl font-semibold text-slate-900">
                                    {t.feature1Title}
                                </h3>
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    {t.feature1Desc}
                                </p>
                            </div>
                            <div className="relative h-72 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden bg-slate-100/40 order-2">
                                <img
                                    src="/assets/ingredients.jpg" // TODO: 换成你的真实 URL
                                    alt="SkinMe feature 1"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        {/* Row 2: image + text (mobile: text on top) */}
                        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 md:items-center">
                            <div className="space-y-4 order-1 md:order-2">
                                <h3 className="text-2xl font-semibold text-slate-900">
                                    {t.feature2Title}
                                </h3>
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    {t.feature2Desc}
                                </p>
                            </div>
                            <div className="relative h-72 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden bg-slate-100/40 order-2 md:order-1">
                                <img
                                    src="/assets/ai.jpg" // TODO: 换成你的真实 URL
                                    alt="SkinMe feature 2"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        {/* Row 3: text + image (mobile: text on top) */}
                        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 md:items-center">
                            <div className="space-y-4 order-1">
                                <h3 className="text-2xl font-semibold text-slate-900">
                                    {t.feature3Title}
                                </h3>
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    {t.feature3Desc}
                                </p>
                            </div>
                            <div className="relative h-72 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden bg-slate-100/40 order-2">
                                <img
                                    src="/assets/skinanalysis.jpg" // TODO: 换成你的真实 URL
                                    alt="SkinMe feature 3"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6 bg-white/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-medium mb-4 text-slate-900">
                            {t.howItWorks}
                        </h2>
                        <p className="text-slate-600 text-lg font-normal">
                            {t.howItWorksSubtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f4dce6] via-[#c8e5b9] to-[#d8c5f4] shadow-[0_12px_28px_rgba(0,0,0,0.12)]" />
                                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/75 via-white/55 to-white/30 backdrop-blur-[2px] shadow-[inset_0_6px_18px_rgba(255,255,255,0.55)]" />
                                <div className="absolute -inset-[2px] rounded-full bg-white/10 blur-lg" />
                                <div className="relative w-full h-full flex items-center justify-center text-[#2f3a2c] text-2xl font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                                    1
                                </div>
                            </div>
                            <h3 className="text-xl font-medium mb-3 text-slate-900">
                                {t.step1Title}
                            </h3>
                            <p className="text-slate-600 font-normal">
                                {t.step1Desc}
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e8d9c9] via-[#f4dce6] to-[#c5a4e0] shadow-[0_12px_28px_rgba(0,0,0,0.12)]" />
                                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/75 via-white/55 to-white/30 backdrop-blur-[2px] shadow-[inset_0_6px_18px_rgba(255,255,255,0.55)]" />
                                <div className="absolute -inset-[2px] rounded-full bg-white/10 blur-lg" />
                                <div className="relative w-full h-full flex items-center justify-center text-[#3a2f2c] text-2xl font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                                    2
                                </div>
                            </div>
                            <h3 className="text-xl font-medium mb-3 text-slate-900">
                                {t.step2Title}
                            </h3>
                            <p className="text-slate-600 font-normal">
                                {t.step2Desc}
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d8c5f4] via-[#c8e5b9] to-[#e8d9c9] shadow-[0_12px_28px_rgba(0,0,0,0.12)]" />
                                <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/75 via-white/55 to-white/30 backdrop-blur-[2px] shadow-[inset_0_6px_18px_rgba(255,255,255,0.55)]" />
                                <div className="absolute -inset-[2px] rounded-full bg-white/10 blur-lg" />
                                <div className="relative w-full h-full flex items-center justify-center text-[#2f2f3a] text-2xl font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                                    3
                                </div>
                            </div>
                            <h3 className="text-xl font-medium mb-3 text-slate-900">
                                {t.step3Title}
                            </h3>
                            <p className="text-slate-600 font-normal">
                                {t.step3Desc}
                            </p>
                        </div>


                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden rounded-3xl p-12 text-center text-white shadow-2xl shadow-[0_28px_60px_rgba(50,40,30,0.26)] backdrop-blur-[14px] bg-gradient-to-br from-[#f4dce6]/70 via-[#c8e5b9]/60 via-[#e8d9c9]/55 to-[#d8c5f4]/65">
                        <div
                            className="absolute inset-0 pointer-events-none mix-blend-screen"
                            style={{
                                backgroundImage: `
      radial-gradient(circle at 16% 22%, rgba(246, 137, 152, 0.95), transparent 45%),
      radial-gradient(circle at 78% 18%, rgba(150, 235, 104, 0.92), transparent 45%),
      radial-gradient(circle at 32% 78%, rgba(235, 151, 72, 0.88), transparent 48%),
      radial-gradient(circle at 84% 76%, rgba(158, 114, 246, 0.9), transparent 50%)
    `
                            }}
                        />

                        {/* 内容 */}
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-medium mb-6 text-[#fcfdf7] drop-shadow-[0_2px_4px_rgba(120,140,95,0.35)] drop-shadow-[0_0_8px_rgba(255,230,250,0.45)]">
                                {t.ctaReady}
                            </h2>
                            <p className="text-[#f7f9ef] text-lg mb-8 max-w-2xl mx-auto font-normal drop-shadow-[0_1px_3px_rgba(112,128,85,0.28)] drop-shadow-[0_0_6px_rgba(250,230,240,0.4)]">

                                {t.ctaJoinText}
                            </p>

                            <Button
                                onClick={handleCreateProfile}
                                className="bg-white text-[#3f4836] hover:bg-white/95 rounded-full px-10 h-14 text-lg font-medium
                     shadow-lg hover:shadow-xl transition-all border border-white/50"
                            >
                                {t.ctaFreeStart}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-200 bg-white/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <Image src="/assets/logo.svg" alt="SkinMe logo" width={32} height={32} />
                            </div>
                            <span className="font-medium text-slate-900">SkinMe AI</span>
                        </div>
                        <div className="text-slate-600 text-sm">
                            © 2025 SkinMe AI. {t.footerAllRights}.
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                            {/* <button className="hover:text-slate-900 transition-colors">
                                <span className="text-xl">𝕏</span>
                            </button>
                            <button className="hover:text-slate-900 transition-colors">
                                <span className="text-xl">ⓘ</span>
                            </button> */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
