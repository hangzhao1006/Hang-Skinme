'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, User, Bot, Calendar, Image as ImageIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from '@/locales/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ConversationEntry {
  timestamp: string;
  role: 'user' | 'assistant';
  message: string;
  image_uploaded?: boolean;
  analysis?: any;
  metadata?: any;
}

export default function ChatHistoryPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const t = useTranslations(language);

  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  // Check authentication and load chat history
  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    // Only load if user email is available
    if (!user?.email) {
      return;
    }

    // Load chat history automatically
    const loadChatHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/chat-history/${encodeURIComponent(user.email)}?days=${days}&limit=100`);
        const data = await response.json();

        if (data.conversations) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [user?.email, days, isAuthenticated]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups: Record<string, ConversationEntry[]>, conv) => {
    const date = new Date(conv.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conv);
    return groups;
  }, {});

  // If not authenticated, show login prompt
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4dce6]/30 via-[#c8e5b9]/25 to-[#e8d9c9]/30">
        {/* Header - Hidden on mobile */}
        <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/assets/logo.svg" alt="SkinMe logo" width={32} height={32} />
              <span className="font-medium text-slate-900">SkinMe AI</span>
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Content */}
        <div className="min-h-screen flex items-center justify-center p-4 pt-4 md:pt-20" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
          <Card className="w-full max-w-md p-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                {t.chatHistory}
              </h1>
              <p className="text-slate-600 text-sm">
                {t.signtoviewhistory}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full">
                <Button className="w-full bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] font-medium">
                  {t.loginButton}
                </Button>
              </Link>
              <Link href="/signup" className="w-full">
                <Button variant="outline" className="w-full">
                  {t.signupButton}
                </Button>
              </Link>
              <Link href="/app" className="w-full">
                <Button variant="ghost" className="w-full text-sm">
                  {t.backToChat}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4dce6]/30 via-[#c8e5b9]/25 to-[#e8d9c9]/30">
      {/* Fixed Header - Hidden on mobile */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.svg" alt="SkinMe logo" width={32} height={32} />
            <span className="font-medium text-slate-900">SkinMe AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.email}</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="flex gap-2"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>{t.logOut}</span>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 md:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          {/* Page Header */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute left-0">
              <Link href="/app">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.backToChat}</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{t.chatHistory}</h1>
            <div className="absolute right-0">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-2 pr-7 py-1.5 sm:px-4 sm:pr-10 sm:py-2 border border-slate-300 rounded-full text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#a7c089] appearance-none bg-no-repeat bg-[right_8px_center] sm:bg-[right_14px_center]"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;utf8,<svg fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" stroke=\"%23748595\" stroke-width=\"1.6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8 10l4 4 4-4\"/></svg>')",
                  backgroundSize: '14px 14px'
                }}
              >
                <option value={1}>{t.last24Hours}</option>
                <option value={7}>{t.last7Days}</option>
                <option value={30}>{t.last30Days}</option>
                <option value={90}>{t.last90Days}</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">{t.loadingChatHistory}</p>
            </div>
          ) : conversations.length === 0 ? (
            /* Empty State */
            <Card className="p-8 shadow-card border-0 bg-white/95 backdrop-blur-sm text-center">
              <div className="text-5xl mb-3">💬</div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {t.noChatHistory}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {t.noChatHistoryDesc}
              </p>
              <Link href="/app">
                <Button className="w-full h-11 bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f9f6e] hover:from-[#bdd598] hover:via-[#97b178] hover:to-[#6d8a5c] text-[#1c2617] font-medium rounded-full shadow-lg hover:shadow-xl transition-all">
                  {t.startChatting}
                </Button>
              </Link>
            </Card>
          ) : (
            /* Conversation History */
            <div className="space-y-8">
              {Object.entries(groupedConversations).map(([date, convs]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <h2 className="text-sm font-medium text-gray-600">{date}</h2>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Conversation Messages */}
                  <div className="space-y-4">
                    {convs.map((conv, idx) => (
                      <Card
                        key={idx}
                        className={`p-4 shadow-sm border-0 ${
                          conv.role === 'user'
                            ? 'bg-slate-50 ml-8'
                            : 'bg-white mr-8'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              conv.role === 'user'
                                ? 'bg-slate-200'
                                : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            }`}
                          >
                            {conv.role === 'user' ? (
                              <User className="h-4 w-4 text-slate-700" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {conv.role === 'user' ? t.you : t.skinmeAI}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(conv.timestamp)}
                              </span>
                              {conv.image_uploaded && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {t.imageTag}
                                </Badge>
                              )}
                            </div>

                            <div className="prose prose-sm max-w-none !text-gray-900 [&_p]:!text-gray-900 [&_li]:!text-gray-900 [&_strong]:!text-gray-900 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900">
                              {conv.role === 'assistant' ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {conv.message}
                                </ReactMarkdown>
                              ) : (
                                <p className="whitespace-pre-wrap text-gray-900">{conv.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {!loading && conversations.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-500">
              {t.showingMessages} {conversations.length} {t.messagesFromLast} {days} {t.days}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
