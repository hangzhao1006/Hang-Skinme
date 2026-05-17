'use client';

import { ReactNode, useState, useEffect, CSSProperties } from 'react';
import {
  MessageCircle,
  LogOut,
  User,
  History,
  Menu,
  X,
  FlaskConical,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '../LanguageSwitcher';

interface DashboardLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export function DashboardLayout({ children, noPadding = false }: DashboardLayoutProps) {
  const { language } = useLanguage();
  const t = useTranslations(language);
  const { logout, user } = useAuth();
  const chatContext = useChat();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsSidebarOpen(false);
  };

  const handleNewConversation = () => {
    if (chatContext && chatContext.resetConversation) {
      chatContext.resetConversation();
    }
    // Navigate to chat page
    router.push('/app');
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Safe area variables for mobile notch; desktop falls back to small spacing
  const mobileTopInset = 'calc(env(safe-area-inset-top, 0px) + 3.5rem)';
  // 在普通移动网页环境下保持与桌面一致的顶部间距；仅 PWA 使用 safe-area
  const desktopTopInset = '0px';
  const sidebarPaddingMobile = `calc(${mobileTopInset} + 1.5rem)`;
  const sidebarPaddingDesktop = '2.5rem';

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* ChatGPT-style Icon Sidebar */}
      <aside
        className={`
    w-72 max-w-[90vw] lg:w-20 bg-card border-r border-border flex-shrink-0
    flex flex-col justify-between                 /* 上下分布 */
    fixed top-0 left-0 h-screen z-40            /* 整个视窗高度的竖线 */
    items-center overflow-y-auto overscroll-contain scrollbar-thin
    lg:relative lg:translate-x-0 lg:py-6
    transition-transform duration-300 mobile-safe-padding
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `}
        style={
          {
            '--safe-padding-mobile': sidebarPaddingMobile,
            '--safe-padding-desktop': sidebarPaddingDesktop,
            // 给移动网页端预留底部（含浏览器工具栏）安全距离，便于滚动到底部
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.5rem)'
          } as CSSProperties
        }
      >
        {/* 上半部分：logo + 新聊天 + 语言 */}
        <div className="flex flex-col items-center w-full px-6 justify-center">
          {/* Product Logo - Navigate to Landing Page */}
          <button
            onClick={() => {
              router.push('/');
              closeSidebar();
            }}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:opacity-90 transition-opacity mb-6 shadow-sm"
            title="SkinMe AI"
          >
            <Image
              src="/assets/logo4.svg"
              alt="SkinMe logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </button>

          {/* Divider */}
          <div className="w-40 lg:w-10 h-px bg-border mb-6" />

          {/* Chat Icon */}
          <button
            onClick={handleNewConversation}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
            title={t.sidebarNewConversation}
          >
            <MessageCircle className="w-5 h-5 text-foreground" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.sidebarNewConversation}
            </span>
          </button>

          {/* Chat History Icon */}
          <button
            onClick={() => router.push('/chat-history')}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
            title="Chat History"
          >
            <History className="w-5 h-5 text-foreground" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.chatHistory}
            </span>
          </button>

          {/* Ingredient Analysis Icon */}
          <button
            onClick={() => {
              router.push('/ingredient-analysis');
              closeSidebar();
            }}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
            title={t.ingredientAnalysis}
          >
            <FlaskConical className="w-5 h-5 text-foreground" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.ingredientAnalysis}
            </span>
          </button>

          {/* Daily Routine Icon */}
          <button
            onClick={() => {
              router.push('/daily-routine');
              closeSidebar();
            }}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
            title={t.dailyRoutine}
          >
            <Calendar className="w-5 h-5 text-foreground" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.dailyRoutine}
            </span>
          </button>

          {/* Routine Trends Icon */}
          <button
            onClick={() => {
              router.push('/routine-trends');
              closeSidebar();
            }}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
            title={t.routineTrends}
          >
            <TrendingUp className="w-5 h-5 text-foreground" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.routineTrends}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="w-full lg:w-12 lg:h-12 flex items-center justify-center py-3 lg:py-0 mb-3">
            <LanguageSwitcher showFlag={false} alignStart={true} />
          </div>
          <div className="w-40 h-px bg-border my-3 lg:hidden" />
        </div>



        {/* 下半部分：分割线 + Profile + Logout，始终靠底 */}
        <div className="flex flex-col items-center w-full pb-2 px-6">
          {/* Bottom Divider */}
          <div className="w-40 lg:w-10 h-px bg-border mb-4" />
          {/* Profile Icon */}
          <button
            onClick={() => {
              router.push('/profile');
              closeSidebar();
            }}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
            title={t.sidebarProfile}
          >
            <User className="w-5 h-5 text-foreground flex-shrink-0" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.sidebarProfile}
            </span>
          </button>

          {/* Logout Icon */}
          <button
            onClick={handleLogout}
            className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors rounded-lg"
            title={t.sidebarLogout}
          >
            <LogOut className="w-5 h-5 text-foreground flex-shrink-0" />
            <span className="lg:hidden text-sm text-foreground font-medium">
              {t.sidebarLogout}
            </span>
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main
        className="flex-1 h-screen flex flex-col overflow-hidden"
        style={{ '--top-bar-height': '3.5rem' } as CSSProperties}
      >
        {/* Mobile Top Bar with Safe Area */}
        <div
          className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-border z-20 flex items-center justify-between px-4 mobile-safe-padding h-14"
          style={
            {
              '--safe-padding-mobile': mobileTopInset,
              '--safe-padding-desktop': '0px'
            } as CSSProperties
          }
        >
          {/* Left: Menu button */}
          <button
            onClick={toggleSidebar}
            className="w-11 h-11 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Center: Logo */}
          <button
            onClick={() => router.push('/app')}
            className="flex items-center gap-2"
          >
            <Image src="/assets/logo4.svg" alt="SkinMe AI" width={28} height={28} />
            <span className="font-medium text-slate-900 leading-none">SkinMe AI</span>
          </button>

          {/* Right: User Info */}
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7f9f6e] to-[#6d8a5c] flex items-center justify-center text-white text-sm font-medium">
              {mounted ? (user?.name ? user.name.charAt(0).toUpperCase() : 'U') : 'U'}
            </div>
          </button>
        </div>

        {/* Content with padding-top for mobile top bar and safe area */}
        <div
          className={`flex-1 overflow-hidden ${noPadding ? '' : 'p-4 md:p-8 lg:p-8'} mobile-safe-padding`}
          style={
            {
              // 移动网页端去掉额外顶距，仅保留很小的间隙；PWA 会由 mobile-top 变量接管
              '--safe-padding-mobile': '4rem',
              '--safe-padding-desktop': '0'
            } as CSSProperties
          }>
          <div className="page-fade h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
