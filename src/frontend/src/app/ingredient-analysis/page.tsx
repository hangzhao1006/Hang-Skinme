'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Search, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

// Type definitions
interface Product {
  id: string;  // Changed from product_id
  title: string;
  brand: string;
  url: string;
}

interface Ingredient {
  ingredient_id: string;
  name_normalized: string;
  example_name: string | null;
}

interface ProductDetails {
  product: Product;
  ingredients: Ingredient[];
}

export default function IngredientAnalysisPage() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const t = useTranslations(language);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Search products
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError(language === 'zh' ? '请输入搜索关键词' : 'Please enter a search keyword');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedProduct(null);

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

      if (data.products.length === 0) {
        setError(
          language === 'zh'
            ? `未找到包含 "${searchQuery}" 的产品`
            : `No products found for "${searchQuery}"`
        );
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(
        language === 'zh'
          ? '搜索失败，请稍后重试'
          : 'Search failed. Please try again later.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Load product ingredients
  const handleSelectProduct = async (product: Product) => {
    setIsLoadingDetails(true);
    setError(null);
    setSelectedProduct(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/products/${encodeURIComponent(product.id)}/ingredients`  // Changed from product_id to id
      );

      if (!response.ok) {
        throw new Error('Failed to load product details');
      }

      const data: ProductDetails = await response.json();
      setSelectedProduct(data);
    } catch (err: any) {
      console.error('Load details error:', err);
      setError(
        language === 'zh'
          ? '加载产品详情失败'
          : 'Failed to load product details'
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <DashboardLayout noPadding={true}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'zh' ? '🧪 成分分析' : '🧪 Ingredient Analysis'}
          </h1>
          <p className="text-gray-600">
            {language === 'zh'
              ? '搜索护肤品，查看详细成分列表和安全评级'
              : 'Search skincare products and view detailed ingredient lists with safety ratings'}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={
                  language === 'zh'
                    ? '搜索产品名称或品牌...'
                    : 'Search product name or brand...'
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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'zh' ? '搜索中...' : 'Searching...'}
                </>
              ) : (
                language === 'zh' ? '搜索' : 'Search'
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

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left: Search Results */}
            <Card className="p-4 h-full overflow-auto">
              <h2 className="text-lg font-semibold mb-4">
                {language === 'zh' ? '搜索结果' : 'Search Results'}
                {searchResults.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({searchResults.length})
                  </span>
                )}
              </h2>

              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'zh'
                    ? '输入关键词开始搜索'
                    : 'Enter a keyword to start searching'}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <h3 className="font-medium text-gray-900 mb-1">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                      <div className="flex items-center justify-end">
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            EWG
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Right: Product Details */}
            <Card className="p-4 h-full overflow-auto">
              <h2 className="text-lg font-semibold mb-4">
                {language === 'zh' ? '成分详情' : 'Ingredient Details'}
              </h2>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : selectedProduct ? (
                <div>
                  {/* Product Info */}
                  <div className="mb-6 pb-4 border-b">
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedProduct.product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedProduct.product.brand}
                    </p>
                  </div>

                  {/* Ingredients List */}
                  <div>
                    <h4 className="font-medium mb-3">
                      {language === 'zh' ? '成分列表' : 'Ingredients List'} (
                      {selectedProduct.ingredients.length})
                    </h4>

                    <div className="space-y-3">
                      {selectedProduct.ingredients.map((ing, index) => (
                        <div
                          key={ing.ingredient_id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-500 mr-2">
                                #{index + 1}
                              </span>
                              <span className="font-medium text-gray-900">
                                {ing.name_normalized}
                              </span>
                            </div>
                          </div>

                          {ing.example_name && (
                            <p className="text-xs text-gray-500">
                              {language === 'zh' ? '示例名：' : 'Example: '}
                              {ing.example_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {language === 'zh'
                    ? '选择一个产品查看成分详情'
                    : 'Select a product to view ingredient details'}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
