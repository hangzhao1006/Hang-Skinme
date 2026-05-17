'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

// Type definitions
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

interface IngredientSummary {
  name: string;
  count: number;
  products: string[];
  risk_level?: 'high' | 'medium' | 'low';
  category?: string;
  risk_description_zh?: string;
  risk_description_en?: string;
}

interface RoutineData {
  user_identifier: string;
  date: string;
  products: RoutineProduct[];
  updated_at: string;
}

export default function DailyRoutinePage() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [routineProducts, setRoutineProducts] = useState<RoutineProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
  const [ingredientSummary, setIngredientSummary] = useState<IngredientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<'morning' | 'evening'>('morning');
  const [datesWithRoutines, setDatesWithRoutines] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load routine when date changes
  useEffect(() => {
    if (user?.email) {
      loadRoutine(user.email, format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, user]);

  // Load dates with routines for the current month
  useEffect(() => {
    if (user?.email) {
      loadMonthRoutines(user.email, currentMonth);
    }
  }, [currentMonth, user]);

  // Load existing routine
  const loadRoutine = async (email: string, date: string) => {
    setIsLoadingRoutine(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/routines/${encodeURIComponent(email)}/${date}`);

      if (response.status === 404) {
        // No routine for this date
        setRoutineProducts([]);
        setIngredientSummary([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load routine');
      }

      const data: RoutineData = await response.json();
      setRoutineProducts(data.products || []);

      // Load ingredient summary
      await loadIngredientSummary(email, date);
    } catch (err: any) {
      console.error('Load routine error:', err);
      setRoutineProducts([]);
      setIngredientSummary([]);
    } finally {
      setIsLoadingRoutine(false);
    }
  };

  // Load ingredient summary
  const loadIngredientSummary = async (email: string, date: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/routines/${encodeURIComponent(email)}/${date}/ingredients`
      );

      if (!response.ok) {
        throw new Error('Failed to load ingredient summary');
      }

      const data = await response.json();
      setIngredientSummary(data.ingredients || []);
    } catch (err: any) {
      console.error('Load ingredient summary error:', err);
      setIngredientSummary([]);
    }
  };

  // Load routines for the current month to mark dates on calendar
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

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const routines = data.routines || [];

      // Extract dates from routines
      const dates = new Set<string>(routines.map((r: RoutineData) => r.date));
      setDatesWithRoutines(dates);
    } catch (err: any) {
      console.error('Load month routines error:', err);
    }
  };

  // Search products
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError(language === 'zh' ? '请输入搜索关键词' : 'Please enter a search keyword');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(language === 'zh' ? '搜索失败，请稍后重试' : 'Search failed. Please try again later.');
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
    setShowSearchModal(false);
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
    if (!user?.email) {
      setError(language === 'zh' ? '用户未登录' : 'User not logged in');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/routines/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_identifier: user.email,
          date: format(selectedDate, 'yyyy-MM-dd'),
          products: routineProducts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save routine');
      }

      // Reload ingredient summary
      await loadIngredientSummary(user.email, format(selectedDate, 'yyyy-MM-dd'));

      // Show success message (you could add a toast notification here)
      setError(null);
    } catch (err: any) {
      console.error('Save routine error:', err);
      setError(language === 'zh' ? '保存失败，请稍后重试' : 'Save failed. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  const morningProducts = routineProducts.filter((p) => p.time === 'morning');
  const eveningProducts = routineProducts.filter((p) => p.time === 'evening');

  return (
    <DashboardLayout noPadding={true}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'zh' ? '📅 每日护肤记录' : '📅 Daily Skincare Routine'}
          </h1>
          <p className="text-gray-600">
            {language === 'zh'
              ? '记录每天使用的护肤品和用量，查看成分统计'
              : 'Track daily skincare products and amounts, view ingredient statistics'}
          </p>
        </div>

        {/* Date Picker */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      // Optionally open search modal for quick product adding
                      setShowSearchModal(true);
                      setCurrentTime('morning');
                    }
                  }}
                  onMonthChange={(month) => setCurrentMonth(month)}
                  modifiers={{
                    hasRoutine: Array.from(datesWithRoutines).map(dateStr => new Date(dateStr + 'T00:00:00'))
                  }}
                  modifiersClassNames={{
                    hasRoutine: 'has-routine-marker'
                  }}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleSaveRoutine} disabled={isSaving || routineProducts.length === 0}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'zh' ? '保存中...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '保存记录' : 'Save Routine'}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Morning & Evening Routines */}
            <div className="lg:col-span-2 space-y-6">
              {/* Morning Routine */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {language === 'zh' ? '🌅 晨间护肤' : '🌅 Morning Routine'}
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentTime('morning');
                      setShowSearchModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {language === 'zh' ? '添加产品' : 'Add Product'}
                  </Button>
                </div>

                {morningProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'zh' ? '暂无晨间护肤记录' : 'No morning routine yet'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {morningProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.product_name}</div>
                          <div className="text-sm text-gray-600">
                            {product.brand} • {product.amount}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProduct(routineProducts.indexOf(product))}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Evening Routine */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {language === 'zh' ? '🌙 晚间护肤' : '🌙 Evening Routine'}
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentTime('evening');
                      setShowSearchModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {language === 'zh' ? '添加产品' : 'Add Product'}
                  </Button>
                </div>

                {eveningProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'zh' ? '暂无晚间护肤记录' : 'No evening routine yet'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eveningProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.product_name}</div>
                          <div className="text-sm text-gray-600">
                            {product.brand} • {product.amount}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProduct(routineProducts.indexOf(product))}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Ingredient Summary */}
            <Card className="p-4 h-fit">
              <h2 className="text-lg font-semibold mb-4">
                {language === 'zh' ? '🧪 成分统计' : '🧪 Ingredient Summary'}
              </h2>

              {ingredientSummary.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'zh' ? '保存记录后查看成分统计' : 'Save routine to view ingredient summary'}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{routineProducts.length}</div>
                      <div className="text-xs text-blue-600">
                        {language === 'zh' ? '产品总数' : 'Total Products'}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{ingredientSummary.length}</div>
                      <div className="text-xs text-green-600">
                        {language === 'zh' ? '成分种类' : 'Unique Ingredients'}
                      </div>
                    </div>
                  </div>

                  {/* Ingredients by Risk Level */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {language === 'zh' ? '📊 成分分析（按风险等级）' : '📊 Ingredients by Risk Level'}
                    </h3>

                    {/* Group by risk level */}
                    {['high', 'medium', 'low'].map((riskLevel) => {
                      const filtered = ingredientSummary.filter((ing) => ing.risk_level === riskLevel);
                      if (filtered.length === 0) return null;

                      const riskColors = {
                        high: {
                          bg: 'bg-red-50',
                          border: 'border-red-200',
                          text: 'text-red-700',
                          badge: 'bg-red-100 text-red-800',
                          bar: 'from-red-500 to-red-600',
                          icon: '⚠️',
                          label: language === 'zh' ? '需谨慎' : 'High Risk',
                        },
                        medium: {
                          bg: 'bg-yellow-50',
                          border: 'border-yellow-200',
                          text: 'text-yellow-700',
                          badge: 'bg-yellow-100 text-yellow-800',
                          bar: 'from-yellow-500 to-yellow-600',
                          icon: '⚡',
                          label: language === 'zh' ? '适度使用' : 'Moderate',
                        },
                        low: {
                          bg: 'bg-green-50',
                          border: 'border-green-200',
                          text: 'text-green-700',
                          badge: 'bg-green-100 text-green-800',
                          bar: 'from-green-500 to-green-600',
                          icon: '✓',
                          label: language === 'zh' ? '安全' : 'Low Risk',
                        },
                      };

                      const colors = riskColors[riskLevel as keyof typeof riskColors];
                      const maxCount = Math.max(...filtered.map((i) => i.count));

                      return (
                        <div key={riskLevel} className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{colors.icon}</span>
                            <h4 className={`text-sm font-semibold ${colors.text}`}>{colors.label}</h4>
                            <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                              {filtered.length} {language === 'zh' ? '种' : 'ingredients'}
                            </Badge>
                          </div>

                          <div className="space-y-2.5">
                            {filtered.slice(0, 10).map((ing, index) => {
                              const percentage = (ing.count / maxCount) * 100;

                              return (
                                <div key={index} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="font-medium text-gray-900 text-sm capitalize">
                                        {ing.name}
                                      </span>
                                      {ing.category && ing.category !== 'other' && (
                                        <span className="text-xs text-gray-500 italic">
                                          ({ing.category})
                                        </span>
                                      )}
                                    </div>
                                    <Badge variant="secondary" className={`text-xs ${colors.badge}`}>
                                      {ing.count}x
                                    </Badge>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`bg-gradient-to-r ${colors.bar} h-2 rounded-full transition-all duration-500`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>

                                  {/* Source Products */}
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {language === 'zh' ? '来源:' : 'From:'}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {ing.products.map((product, pIndex) => (
                                        <span
                                          key={pIndex}
                                          className="inline-block px-2 py-0.5 bg-white text-gray-700 text-xs rounded-full border border-gray-200"
                                        >
                                          {product}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {filtered.length > 10 && (
                              <div className="text-center pt-2">
                                <span className="text-xs text-gray-500">
                                  {language === 'zh'
                                    ? `+${filtered.length - 10} 种更多`
                                    : `+${filtered.length - 10} more`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More Indicator */}
                  {ingredientSummary.length > 15 && (
                    <div className="text-center pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        {language === 'zh'
                          ? `还有 ${ingredientSummary.length - 15} 种成分未显示`
                          : `${ingredientSummary.length - 15} more ingredients`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  {language === 'zh' ? '搜索产品' : 'Search Products'}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setShowSearchModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={
                      language === 'zh' ? '搜索产品名称或品牌...' : 'Search product name or brand...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    language === 'zh' ? '搜索' : 'Search'
                  )}
                </Button>
              </div>

              {/* Search Results */}
              <div className="space-y-3">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      const amount = prompt(
                        language === 'zh' ? '请输入用量（如：2滴、1泵）：' : 'Enter amount (e.g., 2 drops, 1 pump):'
                      );
                      if (amount) {
                        handleAddProduct(product, amount);
                      }
                    }}
                  >
                    <h4 className="font-medium text-gray-900">{product.title}</h4>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
