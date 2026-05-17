'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Loader2,
  AlertCircle,
  BarChart3,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

// Type definitions
interface DayIngredient {
  name: string;
  count: number;
  products: string[];
}

interface DayData {
  date: string;
  total_products: number;
  ingredients: DayIngredient[];
}

interface IngredientTrend {
  name: string;
  dates: string[];
  counts: number[];
  totalCount: number;
  avgCount: number;
}

interface AIInsights {
  tldr: string;
  patterns: string[];
  insights: string[];
  recommendations: string[];
  followup_questions: string[];
  overall_assessment: 'positive' | 'balanced' | 'needs_attention';
}

export default function RoutineTrendsPage() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const router = useRouter();

  const [daysToShow, setDaysToShow] = useState(7);
  const [trendsData, setTrendsData] = useState<DayData[]>([]);
  const [ingredientTrends, setIngredientTrends] = useState<IngredientTrend[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load trends data
  useEffect(() => {
    if (user?.email) {
      loadTrends(user.email, daysToShow);
    }
  }, [user, daysToShow]);

  const loadTrends = async (email: string, days: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/routines/${encodeURIComponent(email)}/range?start_date=${format(
          startDate,
          'yyyy-MM-dd'
        )}&end_date=${format(endDate, 'yyyy-MM-dd')}`
      );

      if (!response.ok) {
        throw new Error('Failed to load trends');
      }

      const data = await response.json();
      const routines = data.routines || [];

      // Load ingredient summaries for each day
      const summaries: DayData[] = [];
      for (const routine of routines) {
        const summaryResponse = await fetch(
          `${apiUrl}/api/routines/${encodeURIComponent(email)}/${routine.date}/ingredients`
        );
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          summaries.push(summary);
        }
      }

      setTrendsData(summaries);

      // Calculate ingredient trends
      calculateIngredientTrends(summaries);

      // Load AI insights
      if (summaries.length > 0) {
        loadAIInsights(email, days);
      }
    } catch (err: any) {
      console.error('Load trends error:', err);
      setError(language === 'zh' ? '加载趋势数据失败' : 'Failed to load trends data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async (email: string, days: number) => {
    setIsLoadingInsights(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/ingredient-insights/${encodeURIComponent(email)}?days=${days}&language=${language}`
      );

      if (!response.ok) {
        throw new Error('Failed to load AI insights');
      }

      const insights = await response.json();
      setAiInsights(insights);
    } catch (err: any) {
      console.error('Load AI insights error:', err);
      // Don't set error - insights are optional
      setAiInsights(null);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const calculateIngredientTrends = (data: DayData[]) => {
    const ingredientMap = new Map<string, { dates: string[]; counts: number[] }>();

    // Aggregate data by ingredient
    data.forEach((day) => {
      day.ingredients.forEach((ing) => {
        if (!ingredientMap.has(ing.name)) {
          ingredientMap.set(ing.name, { dates: [], counts: [] });
        }
        const trend = ingredientMap.get(ing.name)!;
        trend.dates.push(day.date);
        trend.counts.push(ing.count);
      });
    });

    // Convert to array and calculate statistics
    const trends: IngredientTrend[] = Array.from(ingredientMap.entries()).map(
      ([name, data]) => ({
        name,
        dates: data.dates,
        counts: data.counts,
        totalCount: data.counts.reduce((sum, c) => sum + c, 0),
        avgCount: data.counts.reduce((sum, c) => sum + c, 0) / data.counts.length,
      })
    );

    // Sort by total count
    trends.sort((a, b) => b.totalCount - a.totalCount);

    setIngredientTrends(trends.slice(0, 20));
  };

  const getDayLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'zh' ? '今天' : 'Today';
    if (diffDays === 1) return language === 'zh' ? '昨天' : 'Yesterday';
    return format(date, 'MM/dd');
  };

  const maxDailyProducts = Math.max(...trendsData.map((d) => d.total_products), 1);

  return (
    <DashboardLayout noPadding={true}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'zh' ? '📈 成分使用趋势' : '📈 Ingredient Usage Trends'}
          </h1>
          <p className="text-gray-600">
            {language === 'zh'
              ? '查看护肤成分随时间的使用变化和趋势分析'
              : 'View ingredient usage changes and trend analysis over time'}
          </p>
        </div>

        {/* Time Range Selector */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {language === 'zh' ? '时间范围:' : 'Time Range:'}
            </span>
            {[7, 14, 30].map((days) => (
              <Button
                key={days}
                size="sm"
                variant={daysToShow === days ? 'default' : 'outline'}
                onClick={() => setDaysToShow(days)}
              >
                {language === 'zh' ? `${days}天` : `${days} days`}
              </Button>
            ))}
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-6">
            {/* AI Insights Card */}
            {trendsData.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  {language === 'zh' ? '🧠 智能成分洞察' : '🧠 Ingredient Insights'}
                </h2>

                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-600">
                      {language === 'zh' ? '分析中...' : 'Analyzing...'}
                    </span>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-4">
                    {/* TL;DR */}
                    <div className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 w-2 h-2 rounded-full ${
                            aiInsights.overall_assessment === 'positive'
                              ? 'bg-green-500'
                              : aiInsights.overall_assessment === 'needs_attention'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <p className="text-sm font-medium text-gray-800 flex-1">{aiInsights.tldr}</p>
                      </div>
                    </div>

                    {/* Main Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Patterns */}
                      {aiInsights.patterns && aiInsights.patterns.length > 0 && (
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {language === 'zh' ? '📊 使用模式' : '📊 Usage Patterns'}
                          </h3>
                          <ul className="space-y-1.5 text-sm text-gray-600">
                            {aiInsights.patterns.map((pattern, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Insights */}
                      {aiInsights.insights && aiInsights.insights.length > 0 && (
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {language === 'zh' ? '💡 关键发现' : '💡 Key Insights'}
                          </h3>
                          <ul className="space-y-1.5 text-sm text-gray-600">
                            {aiInsights.insights.map((insight, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                      <div className="p-4 bg-white rounded-lg border border-green-200">
                        <h3 className="text-sm font-semibold text-green-700 mb-2">
                          {language === 'zh' ? '✨ 优化建议' : '✨ Recommendations'}
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {aiInsights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600 font-bold mt-0.5">{idx + 1}.</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Follow-up Questions */}
                    {aiInsights.followup_questions && aiInsights.followup_questions.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {language === 'zh' ? '你可以问我：' : 'You can ask me:'}
                        </h3>
                        <div className="space-y-1.5">
                          {aiInsights.followup_questions.map((question, idx) => (
                            <button
                              key={idx}
                              className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                              onClick={() => {
                                // TODO: Open chat with this question
                                console.log('Question clicked:', question);
                              }}
                            >
                              💬 {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {language === 'zh'
                      ? '暂时无法生成洞察，请稍后重试'
                      : 'Insights temporarily unavailable'}
                  </div>
                )}
              </Card>
            )}

            {/* Daily Timeline */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {language === 'zh' ? '每日产品使用量' : 'Daily Product Usage'}
              </h2>

              {trendsData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'zh' ? '暂无数据' : 'No data available'}
                </div>
              ) : (
                <div className="space-y-4">
                  {trendsData.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {getDayLabel(day.date)}
                        </span>
                        <Badge variant="secondary">{day.total_products} products</Badge>
                      </div>

                      {/* Product count bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(day.total_products / maxDailyProducts) * 100}%` }}
                        />
                      </div>

                      {/* Top ingredients for this day */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {day.ingredients.slice(0, 5).map((ing, ingIndex) => (
                          <span
                            key={ingIndex}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
                          >
                            {ing.name}
                            <span className="font-semibold">{ing.count}x</span>
                          </span>
                        ))}
                        {day.ingredients.length > 5 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{day.ingredients.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Ingredient Trends */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {language === 'zh' ? '成分使用频率排行' : 'Top Ingredients by Frequency'}
              </h2>

              {ingredientTrends.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'zh' ? '暂无成分数据' : 'No ingredient data available'}
                </div>
              ) : (
                <div className="space-y-4">
                  {ingredientTrends.map((trend, index) => {
                    const maxTotal = Math.max(...ingredientTrends.map((t) => t.totalCount));
                    const percentage = (trend.totalCount / maxTotal) * 100;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 w-6">#{index + 1}</span>
                            <span className="font-medium text-gray-900 text-sm capitalize">
                              {trend.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {language === 'zh' ? '总计' : 'Total'}: {trend.totalCount}x
                            </Badge>
                            <Badge variant="outline" className="text-gray-600">
                              {language === 'zh' ? '平均' : 'Avg'}: {trend.avgCount.toFixed(1)}x
                            </Badge>
                          </div>
                        </div>

                        {/* Trend bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Mini timeline */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CalendarIcon className="w-3 h-3" />
                          <span>
                            {language === 'zh' ? '使用于' : 'Used on'} {trend.dates.length}{' '}
                            {language === 'zh' ? '天' : 'days'}
                          </span>
                          <span className="mx-1">•</span>
                          <div className="flex gap-0.5">
                            {trend.counts.map((count, cIndex) => (
                              <div
                                key={cIndex}
                                className="w-1.5 h-3 bg-green-400 rounded-sm"
                                style={{
                                  opacity: 0.3 + (count / Math.max(...trend.counts)) * 0.7
                                }}
                                title={`${trend.dates[cIndex]}: ${count}x`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Ingredient Analysis Insights */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                💡 {language === 'zh' ? '成分分析建议' : 'Ingredient Analysis Insights'}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="font-medium text-gray-800 mb-1">
                    {language === 'zh' ? '📊 成分分析方法：' : '📊 How to Analyze Ingredients:'}
                  </p>
                  <ul className="space-y-1 text-gray-600 ml-4">
                    <li>• {language === 'zh' ? '观察高频成分：哪些成分每天都在使用？' : 'Observe high-frequency ingredients: which ones are used daily?'}</li>
                    <li>• {language === 'zh' ? '检查重复成分：多个产品含有相同成分可能过度使用' : 'Check duplicate ingredients: multiple products with same ingredient may indicate overuse'}</li>
                    <li>• {language === 'zh' ? '注意活性成分：如视黄醇、水杨酸等不宜过量' : 'Watch active ingredients: retinol, salicylic acid, etc. should not be overused'}</li>
                  </ul>
                </div>

                {ingredientTrends.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="font-medium text-gray-800 mb-1">
                      {language === 'zh' ? '🔍 你的护肤分析：' : '🔍 Your Skincare Analysis:'}
                    </p>
                    <ul className="space-y-1 text-gray-600 ml-4">
                      <li>• {language === 'zh' ? `你最常用的成分是 "${ingredientTrends[0].name}"` : `Your most used ingredient is "${ingredientTrends[0].name}"`}</li>
                      <li>• {language === 'zh' ? `过去 ${daysToShow} 天共使用了 ${ingredientTrends.length} 种不同成分` : `Used ${ingredientTrends.length} unique ingredients in the past ${daysToShow} days`}</li>
                      {trendsData.length > 0 && (
                        <li>• {language === 'zh' ? `平均每天使用 ${(trendsData.reduce((sum, d) => sum + d.total_products, 0) / trendsData.length).toFixed(1)} 个产品` : `Average ${(trendsData.reduce((sum, d) => sum + d.total_products, 0) / trendsData.length).toFixed(1)} products per day`}</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <p className="font-medium text-gray-800 mb-1">
                    {language === 'zh' ? '⚠️ 需要注意：' : '⚠️ Important Notes:'}
                  </p>
                  <ul className="space-y-1 text-gray-600 ml-4">
                    <li>• {language === 'zh' ? '同时使用多种酸类可能刺激皮肤' : 'Using multiple acids simultaneously may irritate skin'}</li>
                    <li>• {language === 'zh' ? '视黄醇和维生素C建议分开使用（早晚）' : 'Retinol and Vitamin C should be used separately (AM/PM)'}</li>
                    <li>• {language === 'zh' ? '保湿成分（如透明质酸）可以每天使用' : 'Hydrating ingredients (like hyaluronic acid) can be used daily'}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
