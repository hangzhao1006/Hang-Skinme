'use client';

import { useState, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BackButton from '@/components/ui/back-button';
import { Search, Loader2, X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Type definitions
interface HistoryRecord {
    id: number;
    type: 'analysis' | 'condition';
    title: string;
    date: string;
    condition: string;
    hasImage?: boolean;
    imagePreview?: string | null;
    analysis?: {
        skinType?: string;
        concerns?: string[];
        summary?: string | null;
    } | null;
    weather?: {
        temp: string;
        humidity?: string;
        desc: string;
    } | null;
}

interface Stats {
    totalQueries: number;
    totalAnalyses: number;
    lastActivity: string | null;
}

interface Product {
    id: string;
    title: string;
    brand: string;
    url: string;
}

interface RoutineProduct {
    product_id: string;
    product_name: string;
    brand: string;
    amount: string;
    time: 'morning' | 'evening';
    order: number;
}

interface RoutineData {
    user_identifier: string;
    date: string;
    products: RoutineProduct[];
    updated_at: string;
}

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuth();
    const { language } = useLanguage();
    const t = useTranslations(language);
    const router = useRouter();
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalQueries: 0,
        totalAnalyses: 0,
        lastActivity: null
    });

    // Calendar and routine states
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [datesWithRoutines, setDatesWithRoutines] = useState<Set<string>>(new Set());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showProductModal, setShowProductModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [routineProducts, setRoutineProducts] = useState<RoutineProduct[]>([]);
    const [currentTime, setCurrentTime] = useState<'morning' | 'evening'>('morning');
    const [isSaving, setIsSaving] = useState(false);

    // Check login status
    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Load history records
    useEffect(() => {
        loadHistory();
    }, []);

    // Load dates with routines for calendar
    useEffect(() => {
        if (user?.email) {
            loadMonthRoutines(user.email, currentMonth);
        }
    }, [currentMonth, user]);

    // Load routine when date changes
    useEffect(() => {
        if (user?.email) {
            loadRoutine(user.email, format(selectedDate, 'yyyy-MM-dd'));
        }
    }, [selectedDate, user]);

    const loadHistory = (): void => {
        // Load all history records from localStorage
        const skinAnalysisHistory = JSON.parse(localStorage.getItem('skinAnalysisHistory') || '[]');
        const skinConditions = JSON.parse(localStorage.getItem('skinConditions') || '[]');

        // Merge all records
        const allRecords: HistoryRecord[] = [
            ...skinAnalysisHistory.map((item: any) => ({
                ...item,
                type: 'analysis' as const,
                title: item.condition || t.dashboardAIAnalysis,
                date: item.date
            })),
            ...skinConditions.map((item: any) => ({
                ...item,
                type: 'condition' as const,
                title: item.condition,
                date: item.date
            }))
        ];

        // Sort by date
        allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setHistory(allRecords);

        // Calculate statistics
        setStats({
            totalQueries: skinConditions.length,
            totalAnalyses: skinAnalysisHistory.length,
            lastActivity: allRecords[0]?.date || null
        });
    };

    const deleteRecord = (id: number): void => {
        // Delete from localStorage
        const skinAnalysisHistory = JSON.parse(localStorage.getItem('skinAnalysisHistory') || '[]');
        const skinConditions = JSON.parse(localStorage.getItem('skinConditions') || '[]');

        const updatedAnalysis = skinAnalysisHistory.filter((item: any) => item.id !== id);
        const updatedConditions = skinConditions.filter((item: any) => item.id !== id);

        localStorage.setItem('skinAnalysisHistory', JSON.stringify(updatedAnalysis));
        localStorage.setItem('skinConditions', JSON.stringify(updatedConditions));

        // Reload
        loadHistory();
        if (selectedRecord?.id === id) {
            setSelectedRecord(null);
        }
    };

    // Load routines for the current month
    const loadMonthRoutines = async (email: string, month: Date) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
            const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const startDate = format(firstDay, 'yyyy-MM-dd');
            const endDate = format(lastDay, 'yyyy-MM-dd');

            const response = await fetch(
                `${apiUrl}/api/routines/${encodeURIComponent(email)}/range?start_date=${startDate}&end_date=${endDate}`
            );

            if (!response.ok) return;

            const data = await response.json();
            const routines = data.routines || [];
            const dates = new Set<string>(routines.map((r: RoutineData) => r.date));
            setDatesWithRoutines(dates);
        } catch (err: any) {
            console.error('Load month routines error:', err);
        }
    };

    // Load routine for selected date
    const loadRoutine = async (email: string, date: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/routines/${encodeURIComponent(email)}/${date}`);

            if (response.status === 404) {
                setRoutineProducts([]);
                return;
            }

            if (!response.ok) return;

            const data: RoutineData = await response.json();
            setRoutineProducts(data.products || []);
        } catch (err: any) {
            console.error('Load routine error:', err);
            setRoutineProducts([]);
        }
    };

    // Search products
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(
                `${apiUrl}/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=50`
            );

            if (!response.ok) throw new Error('Failed to search');

            const data = await response.json();
            setSearchResults(data.products || []);
        } catch (err: any) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Add product to routine
    const handleAddProduct = (product: Product, amount: string) => {
        const newProduct: RoutineProduct = {
            product_id: product.id,
            product_name: product.title,
            brand: product.brand,
            amount: amount || '1 application',
            time: currentTime,
            order: routineProducts.filter((p) => p.time === currentTime).length + 1,
        };

        setRoutineProducts([...routineProducts, newProduct]);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Remove product
    const handleRemoveProduct = (index: number) => {
        const newProducts = routineProducts.filter((_, i) => i !== index);
        setRoutineProducts(newProducts);
    };

    // Save routine
    const handleSaveRoutine = async () => {
        if (!user?.email || routineProducts.length === 0) return;

        setIsSaving(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/routines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_identifier: user.email,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    products: routineProducts,
                }),
            });

            if (!response.ok) throw new Error('Failed to save');

            // Reload month data to update calendar markers
            await loadMonthRoutines(user.email, currentMonth);
            setShowProductModal(false);
        } catch (err: any) {
            console.error('Save routine error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return null; // Or show loading
    }

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="mb-6 flex-shrink-0">
                    <div className="mb-2">
                        <BackButton label={t.back} fallback="/app" />
                    </div>
                    <h1 className="text-2xl font-medium text-slate-900 mb-2">
                        {t.dashboardTitle}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {t.dashboardWelcome}, {user.name || user.email}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 bg-card hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-card">
                                <span className="text-2xl">📝</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t.dashboardSkinRecords}</p>
                                <p className="text-3xl font-medium text-slate-900">
                                    {stats.totalQueries}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center shadow-card">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t.dashboardAIAnalysis}</p>
                                <p className="text-3xl font-medium text-slate-900">
                                    {stats.totalAnalyses}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center shadow-card">
                                <span className="text-2xl">📅</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t.dashboardLastActivity}</p>
                                <p className="text-base font-medium text-slate-900">
                                    {stats.lastActivity
                                        ? new Date(stats.lastActivity).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')
                                        : t.dashboardNoActivity}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Calendar Widget */}
                <Card className="p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {language === 'zh' ? '📅 快速记录护肤' : '📅 Quick Skincare Log'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calendar */}
                        <div>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (date) {
                                        setSelectedDate(date);
                                        setShowProductModal(true);
                                        setCurrentTime('morning');
                                    }
                                }}
                                onMonthChange={(month) => setCurrentMonth(month)}
                                modifiers={{
                                    hasRoutine: Array.from(datesWithRoutines).map(
                                        (dateStr) => new Date(dateStr + 'T00:00:00')
                                    ),
                                }}
                                modifiersClassNames={{
                                    hasRoutine: 'has-routine-marker',
                                }}
                                className="rounded-lg border"
                            />
                        </div>

                        {/* Selected Date Info */}
                        <div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    {language === 'zh' ? '选中日期' : 'Selected Date'}
                                </p>
                                <p className="text-lg font-semibold">{format(selectedDate, 'PPP')}</p>
                            </div>

                            {routineProducts.length > 0 ? (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        {language === 'zh' ? '当日产品 (共 ' + routineProducts.length + ' 个)' : 'Products (' + routineProducts.length + ')'}
                                    </p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {routineProducts.map((product, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-gray-50 rounded-lg text-sm"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {product.product_name}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {product.brand} • {product.time === 'morning' ? '🌅' : '🌙'}{' '}
                                                            {product.amount}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="text-sm">
                                        {language === 'zh'
                                            ? '该日期暂无记录'
                                            : 'No routine for this date'}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={() => setShowProductModal(true)}
                                className="w-full mt-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'zh' ? '添加产品' : 'Add Product'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* History List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    {/* Left: List */}
                    <div className="min-h-0 flex flex-col">
                        <Card className="p-6 bg-card flex-1 min-h-0 flex flex-col shadow-card hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                                <h2 className="text-2xl font-medium text-slate-900">
                                    {t.dashboardHistory}
                                </h2>
                                <Link href="/history">
                                    <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-100">
                                        📅 View History
                                    </Button>
                                </Link>
                            </div>

                            {history.length === 0 ? (
                                <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-slate-500 text-lg mb-4">
                                        {t.dashboardNoRecords}
                                    </p>
                                    <Link href="/app">
                                        <Button className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-card">
                                            {t.dashboardStartUsing}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                                    {history.map((record) => (
                                        <div
                                            key={record.id}
                                            onClick={() => setSelectedRecord(record)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                selectedRecord?.id === record.id
                                                    ? 'border-slate-400 bg-gradient-to-br from-slate-50 to-slate-100'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant={record.type === 'analysis' ? 'default' : 'secondary'}
                                                            className={
                                                                record.type === 'analysis'
                                                                    ? 'bg-slate-600'
                                                                    : 'bg-rose-300 text-rose-900'
                                                            }
                                                        >
                                                            {record.type === 'analysis' ? t.aiAnalysisTag : t.photoTag}
                                                        </Badge>
                                                        {record.hasImage && (
                                                            <Badge variant="outline">Has Image</Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-medium text-slate-900 line-clamp-2">
                                                        {record.title}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {new Date(record.date).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                                        e.stopPropagation();
                                                        deleteRecord(record.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right: Detail */}
                    <div className="min-h-0">
                        <Card className="p-6 bg-card sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-card hover:shadow-lg transition-shadow">
                            <h2 className="text-2xl font-medium mb-6 text-slate-900">
                                {t.dashboardDetails}
                            </h2>

                            {!selectedRecord ? (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">👈</div>
                                    <p className="text-slate-500">
                                        {t.dashboardClickToView}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Title & Date */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant={selectedRecord.type === 'analysis' ? 'default' : 'secondary'}
                                                className={
                                                    selectedRecord.type === 'analysis'
                                                        ? 'bg-slate-600'
                                                        : 'bg-rose-300 text-rose-900'
                                                }
                                            >
                                                {selectedRecord.type === 'analysis' ? t.aiAnalysisTag : t.photoTag}
                                            </Badge>
                                            {selectedRecord.hasImage && (
                                                <Badge variant="outline">📷 Has Image</Badge>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-medium text-slate-900 mb-2">
                                            {selectedRecord.title}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {new Date(selectedRecord.date).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                                        </p>
                                    </div>

                                    {/* Content */}
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-slate-700 mb-2">
                                            {t.dashboardContent}
                                        </h4>
                                        <p className="text-slate-800 whitespace-pre-wrap">
                                            {selectedRecord.condition}
                                        </p>
                                    </div>

                                    {/* AI Analysis */}
                                    {selectedRecord.analysis && (
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border-2 border-slate-200">
                                            <h4 className="font-medium text-slate-800 mb-3">
                                                {t.dashboardAnalysisResults}
                                            </h4>
                                            {selectedRecord.analysis.skinType && (
                                                <div className="mb-3">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {t.dashboardSkinType}
                                                    </span>
                                                    <span className="text-sm text-slate-900 ml-2">
                                                        {selectedRecord.analysis.skinType}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedRecord.analysis.concerns && selectedRecord.analysis.concerns.length > 0 && (
                                                <div className="mb-3">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {t.dashboardConcerns}
                                                    </span>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                    {selectedRecord.analysis.concerns.map((concern, idx) => (
                                                            <Badge key={idx} variant="outline">
                                                                {concern}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedRecord.analysis.summary && (
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {t.dashboardSummary}
                                                    </span>
                                                    <div className="prose prose-sm mt-2 max-w-none">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {selectedRecord.analysis.summary}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Weather */}
                                    {selectedRecord.weather && (
                                        <div className="bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-300 p-4 rounded-lg text-blue-900">
                                            <h4 className="font-medium mb-2">
                                                {t.dashboardWeatherInfo}
                                            </h4>
                                            <p className="text-sm">
                                                🌡️ {t.dashboardTemp}: {selectedRecord.weather.temp}°C
                                            </p>
                                            <p className="text-sm">
                                                ☁️ {t.dashboardCondition}: {selectedRecord.weather.desc}
                                            </p>
                                            {selectedRecord.weather.humidity && (
                                                <p className="text-sm">
                                                    💧 {t.dashboardHumidity}: {selectedRecord.weather.humidity}%
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Product Search Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {language === 'zh' ? '添加产品' : 'Add Product'}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {format(selectedDate, 'PPP')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowProductModal(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Time Selection */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    {language === 'zh' ? '时间段' : 'Time'}
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={currentTime === 'morning' ? 'default' : 'outline'}
                                        onClick={() => setCurrentTime('morning')}
                                        size="sm"
                                    >
                                        🌅 {language === 'zh' ? '早上' : 'Morning'}
                                    </Button>
                                    <Button
                                        variant={currentTime === 'evening' ? 'default' : 'outline'}
                                        onClick={() => setCurrentTime('evening')}
                                        size="sm"
                                    >
                                        🌙 {language === 'zh' ? '晚上' : 'Evening'}
                                    </Button>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    {language === 'zh' ? '搜索产品' : 'Search Product'}
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder={
                                            language === 'zh'
                                                ? '输入产品名称、品牌...'
                                                : 'Enter product name, brand...'
                                        }
                                    />
                                    <Button onClick={handleSearch} disabled={isSearching}>
                                        {isSearching ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        {language === 'zh' ? '搜索结果' : 'Search Results'}
                                    </p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {searchResults.map((product) => (
                                            <div
                                                key={product.id}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleAddProduct(product, '1 application')}
                                            >
                                                <p className="font-medium text-gray-900">{product.title}</p>
                                                <p className="text-sm text-gray-600">{product.brand}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Added Products */}
                            {routineProducts.filter((p) => p.time === currentTime).length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        {language === 'zh'
                                            ? `已添加 (${routineProducts.filter((p) => p.time === currentTime).length})`
                                            : `Added (${routineProducts.filter((p) => p.time === currentTime).length})`}
                                    </p>
                                    <div className="space-y-2">
                                        {routineProducts
                                            .map((p, idx) => ({ ...p, originalIndex: idx }))
                                            .filter((p) => p.time === currentTime)
                                            .map((product) => (
                                                <div
                                                    key={product.originalIndex}
                                                    className="p-3 bg-blue-50 rounded-lg flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {product.product_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {product.brand} • {product.amount}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveProduct(product.originalIndex)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowProductModal(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="flex-1"
                            >
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleSaveRoutine}
                                disabled={isSaving || routineProducts.length === 0}
                                className="flex-1"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {language === 'zh' ? '保存中...' : 'Saving...'}
                                    </>
                                ) : (
                                    language === 'zh' ? '保存' : 'Save'
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
