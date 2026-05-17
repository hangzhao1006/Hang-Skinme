'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { language } = useLanguage();
  const t = useTranslations(language);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Clinical Pure White */}
      <nav className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-sm">
              <span className="text-white text-xl">S</span>
            </div>
            <span className="font-medium text-foreground text-lg">SkinMe AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t.navFeatures}
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              {t.navHowItWorks}
            </a>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              {t.navLogin}
            </Button>
            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
            >
              {t.navSignUp}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Elegant Gradient Design */}
      <section className="pt-32 pb-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-rose-50 rounded-card p-8 md:p-16 text-center shadow-card border border-border/50">
            {/* Subtle gradient orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-rose-100/30 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10 animate-fade-up">
              <h1
                className="text-4xl md:text-5xl lg:text-6xl mb-4 md:mb-6 text-foreground font-medium leading-tight whitespace-pre-line"
              >
                {t.heroTitle}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 text-base md:text-lg font-normal">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 w-full max-w-md md:max-w-none mx-auto">
                <Button
                  onClick={onGetStarted}
                  className="w-full md:w-auto bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-full px-10 h-12 shadow-lg hover:shadow-xl transition-all font-medium"
                >
                  {t.createProfile}
                </Button>
                <Button
                  variant="outline"
                  className="w-full md:w-auto text-foreground rounded-full px-10 h-12 border-slate-300 hover:bg-slate-50 font-medium"
                >
                  {t.memberLogin}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Featured In - Minimal */}
      < section className="py-24 px-6" >
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground text-xs mb-12 tracking-wide uppercase font-normal">
            {t.asfeaturedIn}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg h-20 flex items-center justify-center shadow-card border-none"
              >
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                    <span className="text-xl">🏢</span>
                  </div>
                  <span className="text-xs font-normal">Partner {i}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Features Section - Clinical Design */}
      < section id="features" className="py-24 px-6" >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl mb-4 text-foreground font-medium">
              {t.precisionSkincare}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-normal">
              {t.landingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Elegant gradient */}
            <div className="text-center bg-card rounded-card p-8 shadow-card border-none animate-fade-up">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center">
                <span className="text-3xl">🔬</span>
              </div>
              <h3 className="text-xl mb-3 text-foreground font-medium">
                {t.feature1Title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-normal">
                {t.feature1Desc}
              </p>
            </div>

            {/* Feature 2 - Elegant gradient */}
            <div className="text-center bg-card rounded-card p-8 shadow-card border-none animate-fade-up">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
                <span className="text-3xl">💊</span>
              </div>
              <h3 className="text-xl mb-3 text-foreground font-medium">
                {t.feature2Title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-normal">
                {t.feature2Desc}
              </p>
            </div>

            {/* Feature 3 - Elegant gradient */}
            <div className="text-center bg-card rounded-card p-8 shadow-card border-none animate-fade-up">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl mb-3 text-foreground font-medium">
                {t.feature3Title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-normal">
                {t.feature3Desc}
              </p>
            </div>
          </div>
        </div>
      </section >

      {/* How It Works - Breathable Spacing */}
      < section id="how-it-works" className="py-24 px-6 bg-card/30" >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl mb-4 text-foreground font-medium">
              {t.howItWorks}
            </h2>
            <p className="text-muted-foreground text-lg font-normal">
              {t.howItWorksSubtitle}
            </p>
          </div>

          {/* 加了 max-w-5xl 让三块整体不要太散 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="max-w-sm mx-auto text-left">
              {/* 数字圆可以保持居中，也可以去掉 mx-auto 让它跟文字左对齐，看你喜好 */}
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#e5f7b7] to-[#a4cf62]
                        flex items-center justify-center text-slate-700 text-2xl font-medium
                        shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                1
              </div>
              <h3 className="text-xl font-medium mb-3 text-slate-900">
                {t.step1Title}
              </h3>
              <p className="text-slate-600 font-normal leading-relaxed">
                {t.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="max-w-sm mx-auto text-left">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#f5e2cd] to-[#c58d6b]
                        flex items-center justify-center text-slate-700 text-2xl font-medium
                        shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                2
              </div>
              <h3 className="text-xl font-medium mb-3 text-slate-900">
                {t.step2Title}
              </h3>
              <p className="text-slate-600 font-normal leading-relaxed">
                {t.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="max-w-sm mx-auto text-left">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#e1ecff] to-[#9db7e6]
                        flex items-center justify-center text-slate-700 text-2xl font-medium
                        shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                3
              </div>
              <h3 className="text-xl font-medium mb-3 text-slate-900">
                {t.step3Title}
              </h3>
              <p className="text-slate-600 font-normal leading-relaxed">
                {t.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section >


      {/* CTA Section - Elegant Gradient */}
      < section className="py-24 px-6" >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#6d8a5c] via-[#5a7348] to-[#4a5f3b] rounded-card p-16 shadow-button border-none animate-fade-up">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl mb-6 font-medium text-white">
                {t.ctaReady}
              </h2>
              <p className="text-white/95 text-lg mb-10 max-w-2xl mx-auto font-normal">
                {t.ctaJoinText}
              </p>
              <Button
                onClick={onGetStarted}
                className="bg-white text-[#1c2617] hover:bg-slate-50 rounded-full px-12 h-14 text-lg shadow-card font-medium transition-all"
              >
                {t.ctaFreeStart}
              </Button>
            </div>
          </div>
        </div>
      </section >

      {/* Footer - Minimal */}
      < footer className="py-12 px-6 border-t border-border bg-card/30" >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <span className="text-white text-sm">S</span>
              </div>
              <span className="font-medium text-foreground">SkinMe AI</span>
            </div>
            <div className="text-muted-foreground text-sm font-normal">
              © 2025 SkinMe AI. {t.footerAllRights}.
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              {/* <button className="hover:text-foreground transition-colors">
                <span className="text-xl">𝕏</span>
              </button>
              <button className="hover:text-foreground transition-colors">
                <span className="text-xl">ⓘ</span>
              </button> */}
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}
