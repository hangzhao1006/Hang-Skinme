'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Paperclip, Image as ImageIcon, Send, Sun, CheckCircle2, Camera, Sparkles, Cloud, CloudRain, Wind, Droplets, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRequired, type ChatMessage } from '@/contexts/ChatContext';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EnhancedCalendar from '@/components/EnhancedCalendar';
import CompactCalendar from '@/components/CompactCalendar';
import { FlashcardWidget } from '@/components/FlashcardWidget';
import { DesktopFlashcardWidget } from '@/components/DesktopFlashcardWidget';
import { PhotoSwiperWidget } from '@/components/PhotoSwiperWidget';
import { chatTheme } from '@/styles/chat-theme';

interface DashboardContentProps {
  API_BASE_URL: string;
}

const extractUrls = (text: string): string[] => {
  if (!text) return [];
  // Capture http/https and bare www links
  const urlRegex = /((https?:\/\/|www\.)[^\s)]+)/gi;
  const matches = text.match(urlRegex) || [];

  const normalize = (url: string) => {
    const trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    return `https://${trimmed}`;
  };

  const seen = new Set<string>();
  return matches
    .map(normalize)
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
};

export function DashboardContent({ API_BASE_URL }: DashboardContentProps) {
  const { language } = useLanguage();
  const t = useTranslations(language);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { chatMessages, setChatMessages, sessionId, setSessionId } = useChatRequired();

  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Weather state
  const [weather, setWeather] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(5);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  // Photo tracking state
  const [skinPhotos, setSkinPhotos] = useState<Array<{date: string; imageUrl: string; note?: string}>>([]);

  // Handler for adding notes to photos
  const handleAddPhotoNote = async (photoIndex: number, note: string) => {
    const photo = skinPhotos[photoIndex];
    if (!photo) return;

    // Update local state immediately
    setSkinPhotos((prev) => {
      const updated = [...prev];
      updated[photoIndex] = { ...updated[photoIndex], note };
      return updated;
    });

    // Save to backend
    const identifier = user?.email || sessionId;
    if (!identifier) return;

    try {
      const formData = new FormData();
      formData.append('date', photo.date);
      formData.append('note', note);

      await fetch(`${API_BASE_URL}/skin-photos/${identifier}/note`, {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error('Error saving photo note:', error);
    }
  };

  // Recent activity - using translations
  const recentActivity = [
    {
      id: 1,
      type: 'routine',
      title: t.dashboardActivityRoutine,
      time: `${t.dashboardActivityTimeToday}, 8:15 AM`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      id: 2,
      type: 'photo',
      title: t.dashboardActivityPhoto,
      time: `${t.dashboardActivityTimeYesterday}, 9:00 PM`,
      icon: Camera,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'product',
      title: t.dashboardActivityProductSaved,
      time: `${t.dashboardActivityTimeYesterday}, 9:03 PM`,
      icon: ShoppingBag,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      id: 4,
      type: 'recommendation',
      title: t.dashboardActivityRecommendation,
      time: `${t.dashboardActivityTimeYesterday}, 9:05 PM`,
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];


  // Initialize with welcome message
  useEffect(() => {
    // Update welcome message when language changes
    if (chatMessages.length === 1 && chatMessages[0].role === 'assistant') {
      setChatMessages([
        {
          role: 'assistant',
          content: t.dashboardAIWelcomeMessage
        }
      ]);
    }
  }, [language]); // Re-initialize when language changes

  // Auto scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Fetch weather with geolocation
  useEffect(() => {
    fetchWeather();
  }, []);

  // Fetch skin progress photos
  useEffect(() => {
    fetchSkinPhotos();
  }, [user, sessionId]);

  const fetchSkinPhotos = async () => {
    const identifier = user?.email || sessionId;
    if (!identifier) return;

    try {
      const response = await fetch(`${API_BASE_URL}/skin-photos/${identifier}`);
      if (response.ok) {
        const data = await response.json();
        setSkinPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching skin photos:', error);
    }
  };

  async function safeJson(response: Response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      console.error("Invalid JSON from backend:", text);
      return {};
    }
  }


  const fetchWeather = async () => {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    // Check if user wants to use OpenWeatherMap (if API key is configured)
    if (API_KEY && API_KEY !== 'your_openweather_api_key_here') {
      console.log('Using OpenWeatherMap API');
      try {
        // Try to get user's location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              console.log(`✅ Got user location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
              await fetchOpenWeatherData(latitude, longitude);
            },
            (error) => {
              console.warn('⚠️ Geolocation error:', error.message);
              console.log('🔍 Please enable location access in your browser settings for accurate weather.');
              // Fallback to Cambridge, MA coordinates
              fetchOpenWeatherData(42.3736, -71.1097);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // Cache for 5 minutes
            }
          );
        } else {
          console.log('Geolocation not supported by browser');
          fetchOpenWeatherData(42.3736, -71.1097);
        }
      } catch (error) {
        console.log('OpenWeatherMap failed, falling back to wttr.in');
        await fetchWttrWeather();
      }
      return;
    }

    // Default: Use wttr.in API (free, no API key needed)
    console.log('Using wttr.in API (free)');
    await fetchWttrWeather();
  };

  const fetchWttrWeather = async () => {
    try {
      // Try to get user's location first with high accuracy
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`Got user location for wttr.in: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
            // Call wttr.in directly from browser with coordinates
            const response = await fetch(`https://wttr.in/${latitude},${longitude}?format=j1`);
            const data = await safeJson(response);
            console.log('Location name:', data.nearest_area?.[0]?.areaName?.[0]?.value);
            setWeather(data);
          },
          async (error) => {
            console.warn('⚠️ Geolocation error:', error.message);
            console.log('Using IP-based location as fallback...');
            // Fallback to IP-based location (wttr.in detects from browser IP)
            const response = await fetch('https://wttr.in/?format=j1');
            const data = await safeJson(response);
            console.log('📍 IP-based location:', data.nearest_area?.[0]?.areaName?.[0]?.value);
            setWeather(data);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // Cache for 5 minutes
          }
        );
      } else {
        console.log('Geolocation not supported, using IP-based location');
        // Fallback to IP-based location (wttr.in detects from browser IP)
        const response = await fetch('https://wttr.in/?format=j1');
        const data = await safeJson(response);
        setWeather(data);
      }
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }
  };

  // OpenWeatherMap API function (备选方案，需要配置 API Key)
  const fetchOpenWeatherData = async (lat: number, lon: number) => {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    try {
      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const weatherData = await weatherResponse.json();

      // Fetch UV index
      const uvResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );

      // Use safe JSON parsing here (recommended)
      const uvData = await safeJson(uvResponse);

      console.log('OpenWeatherMap data:', { weather: weatherData, uv: uvData });

      // Transform OpenWeatherMap data to match our existing structure
      const transformedData = {
        current_condition: [{
          temp_C: Math.round(weatherData.main.temp).toString(),
          temp_F: Math.round((weatherData.main.temp * 9 / 5) + 32).toString(),
          weatherDesc: [{ value: weatherData.weather[0].description }],
          humidity: weatherData.main.humidity.toString(),
          uvIndex: Math.round(uvData.value).toString(),
          FeelsLikeC: Math.round(weatherData.main.feels_like).toString(),
          cloudcover: weatherData.clouds?.all?.toString() || '0',
          windspeedKmph: Math.round(weatherData.wind.speed * 3.6).toString()
        }],
        nearest_area: [{
          areaName: [{ value: weatherData.name || 'Unknown' }],
          country: [{ value: weatherData.sys.country || '' }]
        }]
      };


      setWeather(transformedData);
    } catch (error: any) {
      console.error('OpenWeatherMap API error:', error);
      console.log('Using fallback weather data');
      setWeather({
        current_condition: [{
          temp_C: '24',
          weatherDesc: [{ value: 'Sunny' }],
          humidity: '65',
          uvIndex: '7'
        }],
        nearest_area: [{ areaName: [{ value: 'Allston' }] }]
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !selectedImage) return;

    const hasImage = !!selectedImage;
    const hasText = chatInput.trim().length > 0;

    // If both image and text exist, create separate messages
    if (hasImage && hasText) {
      const imageMessage: ChatMessage = {
        role: 'user',
        content: '',
        image: imagePreview || undefined
      };
      const textMessage: ChatMessage = {
        role: 'user',
        content: chatInput
      };
      setChatMessages(prev => [...prev, imageMessage, textMessage]);
    } else {
      // Single message for image only or text only
      const userMessage: ChatMessage = {
        role: 'user',
        content: chatInput,
        image: imagePreview || undefined
      };
      setChatMessages(prev => [...prev, userMessage]);
    }

    setChatInput('');

    // Clear image preview immediately after adding to messages
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setImagePreview(null);

    setLoading(true);

    // Rotating status messages with emojis while waiting for response
    const statusMessages = hasImage ? [
      '🔍 Analyzing your skin image...',
      '🧬 Detecting skin conditions...',
      '💡 Searching for product recommendations...',
      '✨ Personalizing results...',
      '🎯 Finding the best matches...'
    ] : [
      '🤔 Thinking...',
      '💬 Processing your request...',
      '📚 Consulting skincare knowledge...',
      '✨ Personalizing response...',
      '🎯 Preparing answer...'
    ];

    // Sentinel ID to find and replace the status bubble without index arithmetic
    const STATUS_ID = '__status__';
    let currentStatusIndex = 0;

    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: statusMessages[0],
      id: STATUS_ID,
    } as ChatMessage]);

    const statusInterval = setInterval(() => {
      currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
      setChatMessages(prev => prev.map(m =>
        (m as any).id === STATUS_ID ? { ...m, content: statusMessages[currentStatusIndex] } : m
      ));
    }, 2000);

    try {
      const formData = new FormData();
      formData.append('message', chatInput);
      if (imageToSend) formData.append('image', imageToSend);
      if (sessionId) formData.append('session_id', sessionId);
      if (user?.email) formData.append('email', user.email);

      if (weather?.current_condition?.[0]) {
        const currentWeather = weather.current_condition[0];
        const weatherLocation = weather?.nearest_area?.[0]?.areaName?.[0]?.value || 'Allston';
        const weatherData = {
          temperature: parseFloat(currentWeather.temp_C),
          humidity: parseInt(currentWeather.humidity),
          uv_index: parseInt(currentWeather.uvIndex || '0'),
          weather_condition: currentWeather.weatherDesc?.[0]?.value || 'Clear',
          location: weatherLocation
        };
        formData.append('weather', JSON.stringify(weatherData));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      clearInterval(statusInterval);

      // Show cursor before first token arrives
      setChatMessages(prev => prev.map(m =>
        (m as any).id === STATUS_ID ? { ...m, content: '', id: STATUS_ID, typing: true } : m
      ));

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulated = '';
      let finalProducts: any[] = [];
      let finalSessionId = '';

      // Token queue + typewriter: drain 1 token every 18ms for smooth character-by-character feel
      const tokenQueue: string[] = [];
      let typingTimer: ReturnType<typeof setInterval> | null = null;
      let streamDone = false;

      const startTyping = () => {
        if (typingTimer) return;
        typingTimer = setInterval(() => {
          if (tokenQueue.length > 0) {
            const tok = tokenQueue.shift()!;
            accumulated += tok;
            setChatMessages(prev => prev.map(m =>
              (m as any).id === STATUS_ID
                ? { role: 'assistant', content: accumulated, id: STATUS_ID, typing: true }
                : m
            ));
          } else if (streamDone) {
            // All tokens drained — finalize
            clearInterval(typingTimer!);
            if (finalSessionId && !sessionId) setSessionId(finalSessionId);
            setChatMessages(prev => prev.map(m => {
              if ((m as any).id !== STATUS_ID) return m;
              const final: ChatMessage = { role: 'assistant', content: accumulated };
              if (finalProducts.length > 0) final.products = finalProducts;
              return final;
            }));
          }
        }, 18);
      };

      const processEvent = (jsonStr: string) => {
        let ev: any;
        try { ev = JSON.parse(jsonStr); } catch { return; }

        if (ev.status) {
          setChatMessages(prev => prev.map(m =>
            (m as any).id === STATUS_ID ? { ...m, content: ev.status, id: STATUS_ID } : m
          ));
        } else if (ev.token) {
          // Split token into individual chars for smoother effect
          for (const ch of ev.token) tokenQueue.push(ch);
          startTyping();
        } else if (ev.done) {
          finalSessionId = ev.session_id || '';
          finalProducts = Array.isArray(ev.products) ? ev.products : [];
          streamDone = true;
        } else if (ev.error) {
          streamDone = true;
          clearInterval(typingTimer!);
          setChatMessages(prev => prev.map(m =>
            (m as any).id === STATUS_ID
              ? { role: 'assistant', content: `Error: ${ev.error}` }
              : m
          ));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) sseBuffer += decoder.decode(value, { stream: true });
        if (done) {
          if (sseBuffer.trim()) {
            for (const line of sseBuffer.split('\n')) {
              if (line.startsWith('data: ')) processEvent(line.slice(6).trim());
            }
          }
          streamDone = true;
          break;
        }
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() ?? '';
        for (const block of events) {
          for (const line of block.split('\n')) {
            if (line.startsWith('data: ')) processEvent(line.slice(6).trim());
          }
        }
      }

      if (hasImage) setTimeout(() => fetchSkinPhotos(), 1000);

    } catch (error) {
      console.error('Chat error:', error);
      clearInterval(statusInterval);
      setChatMessages(prev => prev.map(m =>
        (m as any).id === STATUS_ID
          ? { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const currentCondition = weather?.current_condition?.[0];
  const location = weather?.nearest_area?.[0]?.areaName?.[0]?.value || 'Allston';

  // Temperature conversion helper
  const getDisplayTemperature = (tempC: string) => {
    const celsius = parseFloat(tempC);
    if (isFahrenheit) {
      const fahrenheit = Math.round((celsius * 9 / 5) + 32);
      return `${fahrenheit}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Generate calendar days for October 2024
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const calendarDays = getDaysInMonth();

  // State for AI-generated weather advice
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Generate skincare advice based on weather data (frontend-only)
  const fetchWeatherAdvice = () => {
    if (!currentCondition) return;

    try {
      setLoadingAdvice(true);
      // Use rule-based advice directly from weather data
      const advice = getWeatherAdviceFallback();
      setAiAdvice(advice);
    } catch (error) {
      console.error('Failed to generate weather advice:', error);
      setAiAdvice('');
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Fetch AI advice when weather data changes
  useEffect(() => {
    if (currentCondition) {
      fetchWeatherAdvice();
    }
  }, [currentCondition, language]);

  // Get skincare advice based on weather (fallback)
  const getWeatherAdviceFallback = () => {
    if (!currentCondition) return '';

    const temp = parseInt(currentCondition.temp_C || '20');
    const humidity = parseInt(currentCondition.humidity || '50');
    const uvIndex = parseInt(currentCondition.uvIndex || '0');

    const advice: string[] = [];

    // Temperature advice
    if (temp > 30) {
      advice.push(t.weatherHotAdvice);
    } else if (temp < 10) {
      advice.push(t.weatherColdAdvice);
    }

    // Humidity advice
    if (humidity < 30) {
      advice.push(t.weatherDryAdvice);
    } else if (humidity > 80) {
      advice.push(t.weatherHumidAdvice);
    }

    // UV advice
    if (uvIndex > 6) {
      advice.push(t.weatherUVAdvice);
    }

    return advice.length > 0 ? advice.join(' • ') : t.weatherNormalAdvice;
  };

  return (
    <div
      className="h-full flex flex-col mobile-safe-padding pt-[calc(var(--top-bar-height,3.5rem)+0.75rem)] lg:pt-16"
      style={
        {
          '--safe-padding-mobile': '3.75rem',
          '--safe-padding-desktop': '1rem'
        } as React.CSSProperties
      }
    >
      {/* Header - Desktop Only */}
      <div className="mb-3 flex-shrink-0 hidden lg:block">
        <h1 className="mb-2 text-slate-900">
          {mounted && user?.name ? `${t.dashboardWelcomeBack} ${user.name}` : t.dashboardWelcomeBack}
        </h1>
        <p className="text-sm text-slate-500">{t.dashboardJourneySummary}</p>
      </div>
      {/* Mobile widgets removed to avoid duplication */}

      {/* Main Content - ChatGPT-style layout */}
      <div className="chat-fade h-full flex flex-col">
        {chatMessages.length === 1 ? (
          // Initial state - Welcome message with input at bottom
          <div className="flex-1 flex flex-col h-full relative transition-all duration-500 ease-out">
            {/* Top Content Area - Scrollable */}
            <div
              className="flex-1 overflow-y-auto flex flex-col items-center justify-start pt-4 px-4 pb-40 md:pb-4"
            >
              {/* Mobile Compact Widgets - Dynamic based on photo existence */}
              <div className="w-full grid grid-cols-2 gap-3 mb-6 lg:hidden max-w-4xl">
                {skinPhotos.length > 0 ? (
                  <>
                    <div className="aspect-square w-full">
                      {/* FlashcardWidget: Calendar/Weather flip card */}
                      <FlashcardWidget
                        weather={weather}
                        isFahrenheit={isFahrenheit}
                        onToggleUnit={() => setIsFahrenheit(!isFahrenheit)}
                        getDisplayTemperature={getDisplayTemperature}
                      />
                    </div>

                    <div className="aspect-square w-full">
                      {/* PhotoSwiperWidget: Replaces weather position */}
                      <PhotoSwiperWidget
                        photos={skinPhotos}
                        onAddNote={handleAddPhotoNote}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="aspect-square w-full">
                      {/* Default: Compact Calendar Widget - Clickable to expand */}
                      <CompactCalendar />
                    </div>

                    {/* Upload Prompt - Encourages users to start tracking */}
                    <div className="aspect-square w-full">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f5e6ff] via-[#e6d4ff] to-[#d4b3ff] p-4 shadow-sm flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform group"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                        <Camera className="w-10 h-10 text-purple-900/60 mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-medium text-purple-900/80 text-center">
                          {language === 'zh' ? '上传照片' : 'Upload Photo'}
                        </div>
                        <div className="text-[10px] text-purple-900/50 text-center mt-1">
                          {language === 'zh' ? '开始追踪进度' : 'Start tracking progress'}
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-8">
                <h1 className={`${chatTheme.welcomeTitle.main.fontSize} ${chatTheme.welcomeTitle.main.fontWeight} ${chatTheme.welcomeTitle.main.textColor} mb-3`}>{t.dashboardAIAssistantTitle}</h1>
                <p className={`${chatTheme.welcomeTitle.subtitle.fontSize} ${chatTheme.welcomeTitle.subtitle.textColor}`}>{t.dashboardAIAssistantSubtitle}</p>
              </div>

              {/* Quick Action Buttons - Above input */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 w-full max-w-4xl items-stretch">
                <button
                  onClick={() => {
                  const message = language === 'zh'
                    ? '拍照分析皮肤'
                    : language === 'es'
                      ? 'Analiza tu piel con una foto'
                      : language === 'vi'
                        ? 'Phân tích da bằng ảnh'
                        : 'Analyze Skin with Photo';
                    setChatMessages([
                      chatMessages[0],
                      { role: 'user', content: message },
                      {
                        role: 'assistant',
                        content: language === 'zh'
                          ? '请上传一张清晰的皮肤照片，我会帮你：\n\n✓ 识别皮肤类型\n✓ 检测皮肤问题（痘痘、暗沉、细纹等）\n✓ 推荐适合的护肤品\n\n点击下方的图片按钮📎上传照片。'
                          : language === 'es'
                            ? 'Sube una foto clara de tu piel y te ayudaré a:\n\n✓ Identificar tu tipo de piel\n✓ Detectar problemas (acné, opacidad, líneas finas, etc.)\n✓ Recomendar productos adecuados\n\nHaz clic en el botón de imagen 📎 para subir.'
                            : language === 'vi'
                              ? 'Hãy tải một ảnh rõ của da bạn, tôi sẽ giúp bạn:\n\n✓ Xác định loại da\n✓ Phát hiện vấn đề (mụn, xỉn màu, nếp nhăn, v.v.)\n✓ Đề xuất sản phẩm phù hợp\n\nNhấn nút ảnh 📎 để tải lên.'
                              : 'Please upload a clear photo of your skin, and I will:\n\n✓ Identify your skin type\n✓ Detect skin issues (acne, dullness, fine lines, etc.)\n✓ Recommend suitable skincare products\n\nClick the image button 📎 below to upload.'
                      }
                    ]);
                  }}
                  className={`${chatTheme.quickActions.padding} ${chatTheme.quickActions.borderRadius} ${chatTheme.quickActions.background} ${chatTheme.quickActions.border} ${chatTheme.quickActions.hoverBackground} transition-all text-left group h-full min-h-[150px] flex flex-col justify-start`}
                >
                  <div className={`${chatTheme.quickActions.emojiSize} mb-2`}>📸</div>
                  <div className={`${chatTheme.quickActions.title.fontSize} ${chatTheme.quickActions.title.fontWeight} ${chatTheme.quickActions.title.textColor} mb-1`}>
                    {language === 'zh' ? '拍照分析': language === 'es' ? 'Análisis de foto' : language === 'vi' ? 'Phân tích ảnh' : 'Photo Analysis'}
                  </div>
                  <div className={`${chatTheme.quickActions.subtitle.fontSize} ${chatTheme.quickActions.subtitle.textColor}`}>
                    {language === 'zh' ? '上传照片分析皮肤' : language === 'es' ? 'Sube una foto para analizar' : language === 'vi' ? 'Tải ảnh để phân tích' : 'Upload photo to analyze'}
                  </div>
                </button>

                <button
                  onClick={() => {
                  const message = language === 'zh'
                    ? '护肤品推荐'
                    : language === 'es'
                      ? 'Recomendaciones de productos'
                      : language === 'vi'
                        ? 'Gợi ý sản phẩm'
                        : 'Product Recommendations';
                    setChatMessages([
                      chatMessages[0],
                      { role: 'user', content: message },
                      {
                        role: 'assistant',
                        content: language === 'zh'
                          ? '好的！我可以帮你推荐合适的护肤品。请告诉我：\n\n1. 你的肤质是什么？（干性/油性/混合性/敏感性）\n2. 你主要想解决什么皮肤问题？（痘痘/暗沉/细纹/毛孔等）\n3. 你在寻找什么类型的产品？（洁面/精华/面霜等）'
                          : language === 'es'
                            ? '¡Puedo ayudarte a encontrar los productos adecuados! Cuéntame:\n\n1. ¿Cuál es tu tipo de piel? (Seca/Grasa/Mixta/Sensible)\n2. ¿Qué preocupaciones quieres tratar? (Acné, opacidad, líneas finas, poros, etc.)\n3. ¿Qué tipo de producto buscas? (Limpiador/Sérum/Hidratante, etc.)'
                            : language === 'vi'
                              ? 'Tôi có thể giúp bạn tìm sản phẩm phù hợp! Hãy cho tôi biết:\n\n1. Loại da của bạn là gì? (Khô/Dầu/Hỗn hợp/Nhạy cảm)\n2. Bạn muốn giải quyết vấn đề gì? (Mụn, xỉn màu, nếp nhăn, lỗ chân lông...)\n3. Bạn đang tìm loại sản phẩm nào? (Sữa rửa mặt/Tinh chất/Kem dưỡng...)'
                              : 'I can help you find the right skincare products! Please tell me:\n\n1. What is your skin type? (Dry/Oily/Combination/Sensitive)\n2. What skin concerns do you want to address? (Acne/Dullness/Fine lines/Pores etc.)\n3. What type of product are you looking for? (Cleanser/Serum/Moisturizer etc.)'
                      }
                    ]);
                  }}
                  className={`${chatTheme.quickActions.padding} ${chatTheme.quickActions.borderRadius} ${chatTheme.quickActions.background} ${chatTheme.quickActions.border} ${chatTheme.quickActions.hoverBackground} transition-all text-left group h-full min-h-[150px] flex flex-col justify-start`}
                >
                  <div className={`${chatTheme.quickActions.emojiSize} mb-2`}>💄</div>
                  <div className={`${chatTheme.quickActions.title.fontSize} ${chatTheme.quickActions.title.fontWeight} ${chatTheme.quickActions.title.textColor} mb-1`}>
                    {language === 'zh' ? '护肤品推荐' : language === 'es' ? 'Recomendaciones de productos' : language === 'vi' ? 'Gợi ý sản phẩm' : 'Product Recommendations'}
                  </div>
                  <div className={`${chatTheme.quickActions.subtitle.fontSize} ${chatTheme.quickActions.subtitle.textColor}`}>
                    {language === 'zh' ? '找到适合你的产品' : language === 'es' ? 'Encuentra productos adecuados' : language === 'vi' ? 'Tìm sản phẩm phù hợp' : 'Find your perfect match'}
                  </div>
                </button>

                <button
                  onClick={() => {
                  const message = language === 'zh'
                    ? '皮肤健康咨询'
                    : language === 'es'
                      ? 'Consulta de salud de la piel'
                      : language === 'vi'
                        ? 'Tư vấn sức khỏe da'
                        : 'Skin Health Consultation';
                    setChatMessages([
                      chatMessages[0],
                      { role: 'user', content: message },
                      {
                        role: 'assistant',
                        content: language === 'zh'
                          ? '你好！我可以帮你分析皮肤问题。请：\n\n1. 描述你的皮肤问题（如：痘痘、干燥、发红等）\n2. 或者上传一张皮肤照片，我会帮你分析\n\n请选择其中一种方式，我会为你提供专业建议。'
                          : language === 'es'
                            ? '¡Hola! Puedo analizar tus preocupaciones de piel. Por favor:\n\n1. Describe tus problemas (acné, sequedad, enrojecimiento…)\n2. O sube una foto de tu piel para analizar\n\nElige una opción y te daré recomendaciones.'
                            : language === 'vi'
                              ? 'Chào bạn! Tôi có thể phân tích vấn đề da của bạn. Vui lòng:\n\n1. Mô tả vấn đề (mụn, khô, đỏ...)\n2. Hoặc tải ảnh da để tôi phân tích\n\nChọn một cách và tôi sẽ tư vấn cho bạn.'
                              : 'Hi! I can help analyze your skin concerns. Please:\n\n1. Describe your skin issues (e.g., acne, dryness, redness)\n2. Or upload a photo of your skin for analysis\n\nChoose one method and I\'ll provide professional advice.'
                      }
                    ]);
                  }}
                  className={`${chatTheme.quickActions.padding} ${chatTheme.quickActions.borderRadius} ${chatTheme.quickActions.background} ${chatTheme.quickActions.border} ${chatTheme.quickActions.hoverBackground} transition-all text-left group h-full min-h-[150px] flex flex-col justify-start`}
                >
                  <div className={`${chatTheme.quickActions.emojiSize} mb-2`}>🌿</div>
                  <div className={`${chatTheme.quickActions.title.fontSize} ${chatTheme.quickActions.title.fontWeight} ${chatTheme.quickActions.title.textColor} mb-1`}>
                    {language === 'zh' ? '皮肤健康' : language=== 'es' ? 'Consulta de salud' : language === 'vi' ? 'Tư vấn sức khỏe' : 'Skin Health'}
                  </div>
                  <div className={`${chatTheme.quickActions.subtitle.fontSize} ${chatTheme.quickActions.subtitle.textColor}`}>
                    {language === 'zh' ? '了解你的皮肤状况' : language === 'es' ? 'Entiende tu condición de piel' : language === 'vi' ? 'Hiểu về tình trạng da của bạn' : 'Understand your skin condition'}
                  </div>
                </button>

                <button
                  onClick={() => {
                  const message = language === 'zh'
                    ? '成分分析'
                    : language === 'es'
                      ? 'Análisis de ingredientes'
                      : language === 'vi'
                        ? 'Phân tích thành phần'
                        : 'Ingredient Analysis';
                    setChatMessages([
                      chatMessages[0],
                      { role: 'user', content: message },
                      {
                        role: 'assistant',
                        content: language === 'zh'
                          ? '我可以帮你分析护肤品成分的安全性！\n\n请输入你想分析的成分列表，或者告诉我产品名称，我会：\n\n✓ 分析每个成分的安全等级\n✓ 指出潜在的刺激性成分\n✓ 给出使用建议\n\n请输入成分或产品名称：'
                          : language === 'es'
                            ? '¡Puedo ayudarte a analizar la seguridad de los ingredientes! Por favor ingresa la lista de ingredientes o el nombre del producto, y yo:\n\n✓ Analizaré la seguridad de cada ingrediente\n✓ Identificaré posibles irritantes\n✓ Daré recomendaciones de uso\n\nIntroduce ingredientes o nombre del producto:'
                            : language === 'vi'
                              ? 'Tôi có thể giúp bạn phân tích độ an toàn thành phần! Vui lòng nhập danh sách thành phần hoặc tên sản phẩm, tôi sẽ:\n\n✓ Phân tích độ an toàn từng thành phần\n✓ Chỉ ra thành phần có thể gây kích ứng\n✓ Đưa ra khuyến nghị sử dụng\n\nNhập thành phần hoặc tên sản phẩm:'
                              : 'I can help analyze skincare ingredient safety!\n\nPlease enter the ingredient list or product name, and I will:\n\n✓ Analyze safety rating of each ingredient\n✓ Identify potentially irritating ingredients\n✓ Provide usage recommendations\n\nPlease enter ingredients or product name:'
                      }
                    ]);
                  }}
                  className={`${chatTheme.quickActions.padding} ${chatTheme.quickActions.borderRadius} ${chatTheme.quickActions.background} ${chatTheme.quickActions.border} ${chatTheme.quickActions.hoverBackground} transition-all text-left group h-full min-h-[150px] flex flex-col justify-start`}
                >
                  <div className={`${chatTheme.quickActions.emojiSize} mb-2`}>💻</div>
                  <div className={`${chatTheme.quickActions.title.fontSize} ${chatTheme.quickActions.title.fontWeight} ${chatTheme.quickActions.title.textColor} mb-1`}>
                    {language === 'zh' ? '成分分析' : language === 'es' ? 'Análisis de ingredientes' : language === 'vi' ? 'Phân tích thành phần' : 'Ingredient Analysis'}
                  </div>
                  <div className={`${chatTheme.quickActions.subtitle.fontSize} ${chatTheme.quickActions.subtitle.textColor}`}>
                    {language === 'zh' ? '深入了解成分安全性' : language === 'es' ? 'Aprende sobre la seguridad de los ingredientes' : language === 'vi' ? 'Tìm hiểu về độ an toàn của thành phần' : 'Learn about ingredient safety'}
                  </div>
                </button>
              </div>

              {/* Desktop: Calendar + Weather/Photo Row - Dynamic based on photo existence */}
              <div className="hidden lg:grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 gap-4 mb-8 items-stretch">
                {skinPhotos.length > 0 ? (
                  <>
                    {/* DesktopFlashcardWidget: Calendar with flip to Weather */}
                    <div className="h-full">
                      <DesktopFlashcardWidget
                        weather={weather}
                        isFahrenheit={isFahrenheit}
                        onToggleUnit={() => setIsFahrenheit(!isFahrenheit)}
                        getDisplayTemperature={getDisplayTemperature}
                        aiAdvice={aiAdvice}
                        loadingAdvice={loadingAdvice}
                        skincareAdviceLabel={t.skincareAdvice || 'Skincare Advice'}
                      />
                    </div>

                    {/* PhotoSwiperWidget: Replaces weather widget */}
                    <div className="h-full">
                      <PhotoSwiperWidget
                        photos={skinPhotos}
                        onAddNote={handleAddPhotoNote}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Enhanced Calendar Widget - Interactive with GCS storage */}
                    <div className="min-h-[350px] max-h-[420px]">
                      <EnhancedCalendar />
                    </div>

                    {/* Upload Prompt or Weather Widget */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e6f3ff] via-[#cfe6ff] to-[#a8d4ff] p-5 flex flex-col shadow-sm min-h-[280px] max-h-[420px]">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
                      {/* Temperature unit toggle button */}
                      <button
                        onClick={() => setIsFahrenheit(!isFahrenheit)}
                        className="absolute top-3 right-3 z-20 text-xs text-blue-900/60 hover:text-blue-900 bg-white/30 hover:bg-white/50 rounded-full px-3 py-1.5 transition-all"
                      >
                        {isFahrenheit ? '°C' : '°F'}
                      </button>
                      {currentCondition ? (
                        <div className="relative z-10 flex-1 flex flex-col">
                          <div className="text-sm text-blue-900/70 mb-2">{location}</div>
                          <div className="mb-3">
                            <div className="text-5xl font-extralight text-blue-900 tracking-tight">{getDisplayTemperature(currentCondition.temp_C)}</div>
                            <div className="text-sm text-blue-900/70 mt-1">{currentCondition.weatherDesc[0].value}</div>
                          </div>
                          <div className="mt-auto space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-blue-700" />
                                <span className="text-blue-900">{currentCondition.humidity}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span className="text-blue-900">UV {currentCondition.uvIndex || '0'}</span>
                              </div>
                            </div>
                            {aiAdvice && (
                              <div className="mt-3 pt-3 border-t border-blue-900/10">
                                <div className="text-xs text-blue-900/80 font-medium mb-1">{t.skincareAdvice || 'Skincare Advice'}</div>
                                <div className="text-xs text-blue-900/70 leading-relaxed">{loadingAdvice ? <span className="animate-pulse">...</span> : aiAdvice}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-blue-900/60 py-12 flex-1 flex items-center justify-center">
                          <Cloud className="w-10 h-10 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Fixed Input Area */}
            <div className="fixed md:sticky bottom-0 left-0 right-0 w-full bg-white pt-3 px-4 border-t border-slate-100 z-10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
              <div className="w-full max-w-3xl mx-auto">
                {/* Image Preview - Moved above input box */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImage(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white rounded-3xl px-5 py-3.5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t.dashboardChatPlaceholder}
                    className="flex-1 bg-transparent border-none outline-none text-base text-slate-800 placeholder-slate-400 min-w-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors p-0"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors p-0"
                  >
                    <ImageIcon className="w-4.5 h-4.5" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || (!chatInput.trim() && !selectedImage)}
                    className="flex-shrink-0 h-8 w-8 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-all p-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat active - Two column layout like ChatGPT
          <div className="flex gap-0 md:gap-10 flex-1 min-h-0 max-w-7xl mx-auto w-full transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-bottom-4">
            {/* Left Column - Chat (no card, transparent) */}
            <div className="flex-1 flex flex-col min-h-0 relative w-full md:w-auto">

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto pb-28 space-y-4 min-h-0 chat-scroll-smooth px-4 md:px-0"
              >
                {chatMessages.map((message, index) => (
                  <div key={index} className="space-y-3">
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-3 pl-8 md:pl-12 text-xs text-slate-500">
                        {/* Anchor for quick visual separation */}
                      </div>
                    )}
                    <div
                      className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      {/* Assistant avatar - Hidden on mobile */}
                      {message.role === 'assistant' && (
                        <div className="hidden md:flex w-10 h-10 rounded-full bg-white items-center justify-center flex-shrink-0 shadow-card">
                          <Image src="/assets/logo4.svg" alt="SkinMe AI" width={40} height={40} className="w-full h-full" />
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`${message.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[90%] md:max-w-[85%]'} ${message.role === 'user'
                          ? 'rounded-[18px] bg-[rgb(244,244,244)] text-black px-4 py-1.5 flex items-center min-h-[44px]'
                          : `${chatTheme.messages.assistant.borderRadius} ${chatTheme.messages.assistant.padding} ${chatTheme.messages.assistant.background} ${chatTheme.messages.assistant.textColor}`
                          }`}
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Uploaded"
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        {(message.content || (message as any).typing) && (
                          <div className={`text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-0 ${message.role === 'user'
                            ? '[&_*]:!text-black [&_p]:my-0'
                            : '[&_*]:!text-gray-900'
                            }`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content || ''}
                            </ReactMarkdown>
                            {(message as any).typing && (
                              <span className="inline-block w-[2px] h-[1em] bg-gray-700 ml-[1px] align-middle animate-pulse" />
                            )}
                          </div>
                        )}
                        {message.role === 'assistant' && (() => {
                          const urls = extractUrls(message.content);
                          if (urls.length === 0) return null;
                          return (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {urls.map((url, idx) => {
                                let hostname = url;
                                try {
                                  hostname = new URL(url).hostname.replace(/^www\./, '');
                                } catch {
                                  // leave raw url as fallback
                                }
                                return (
                                  <a
                                    key={`${url}-${idx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-2xl border border-slate-200/80 bg-white/80 hover:border-teal-300 hover:shadow-md transition-all px-4 py-3 overflow-hidden"
                                  >
                                    <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Buy link</div>
                                    <div className="text-sm font-medium text-slate-800 truncate break-all">{hostname}</div>
                                    <div className="text-xs text-teal-600 truncate break-all group-hover:underline">{url}</div>
                                  </a>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Product Cards - Display if products exist */}
                    {message.products && message.products.length > 0 && (
                      <div className="pl-10 md:pl-13 pr-0 md:pr-4 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {message.products.map((product, idx) => (
                            <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                              <div className="flex gap-3 p-4 overflow-hidden">
                                {/* Product Image */}
                                {product.imageUrl && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={product.imageUrl}
                                      alt={product.title}
                                      className="w-24 h-24 object-cover rounded-lg"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96x96/E9EDF3/475569?text=Product';
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Product Info */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 break-words">
                                      {product.title}
                                    </h4>
                                  </div>

                                  <p className="text-xs text-gray-600 mb-2 truncate">{product.brand}</p>

                                  {product.category && (
                                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full mb-2 truncate max-w-full">
                                      {product.category}
                                    </span>
                                  )}

                                  {/* Ingredients Preview */}
                                  {product.ingredients && product.ingredients !== "Not listed" && (
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 break-words">
                                      <span className="font-medium">Ingredients:</span> {product.ingredients}
                                    </p>
                                  )}

                                  {/* Buy Links */}
                                  {product.buyLinks && product.buyLinks.length > 0 && (
                                    <div className="flex flex-col gap-1.5 mt-2">
                                      {product.buyLinks.slice(0, 2).map((link, linkIdx) => {
                                        let hostname = link;
                                        try {
                                          const url = new URL(link);
                                          hostname = url.hostname.replace(/^www\./, '');
                                        } catch {
                                          // keep original link as fallback
                                        }
                                        return (
                                          <a
                                            key={linkIdx}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-lg border border-slate-200/80 bg-white/80 hover:border-teal-300 hover:shadow-sm transition-all px-3 py-2 overflow-hidden"
                                          >
                                            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                                              Buy link
                                            </div>
                                            <div className="text-xs font-medium text-slate-800 truncate break-all">
                                              {hostname}
                                            </div>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="hidden md:flex w-10 h-10 rounded-full bg-white items-center justify-center flex-shrink-0 shadow-card">
                      <Image src="/assets/logo4.svg" alt="SkinMe AI" width={40} height={40} className="w-full h-full" />
                    </div>
                    <div className="bg-card rounded-2xl px-4 py-3 shadow-card">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area (sticky) */}
              <div className="sticky bottom-0 pt-3 pb-5 lg:pb-1 bg-gradient-to-t from-white via-white to-transparent">
                {/* Image Preview - Above input box */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block flex-shrink-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-20 rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImage(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white rounded-3xl px-5 py-3.5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t.dashboardChatPlaceholder}
                    className="flex-1 bg-transparent border-none outline-none text-base text-slate-800 placeholder-slate-400 min-w-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors p-0"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors p-0"
                  >
                    <ImageIcon className="w-4.5 h-4.5" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || (!chatInput.trim() && !selectedImage)}
                    className="flex-shrink-0 h-8 w-8 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-all p-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar + Weather (Desktop Only) */}
            <div className="w-[360px] flex-shrink-0 flex-col gap-4 hidden xl:flex">
              {/* Enhanced Calendar Widget - Interactive with GCS storage */}
              <div className="min-h-[400px]">
                <EnhancedCalendar />
              </div>

              {/* Weather Widget */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e6f3ff] via-[#cfe6ff] to-[#a8d4ff] p-5 flex flex-col shadow-sm min-h-[320px]">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/25 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/18 rounded-full blur-3xl"></div>

                {/* Temperature unit toggle button */}
                <button
                  onClick={() => setIsFahrenheit(!isFahrenheit)}
                  className="absolute top-3 right-3 z-20 text-xs text-blue-900/60 hover:text-blue-900 bg-white/30 hover:bg-white/50 rounded-full px-3 py-1.5 transition-all"
                >
                  {isFahrenheit ? '°C' : '°F'}
                </button>

                {currentCondition ? (
                  <div className="relative z-10 flex-1 flex flex-col">
                    {/* Location */}
                    <div className="text-sm text-blue-900/70 mb-2">{location}</div>

                    {/* Temperature */}
                    <div className="mb-3">
                      <div className="text-5xl font-extralight text-blue-900 tracking-tight">
                        {getDisplayTemperature(currentCondition.temp_C)}
                      </div>
                      <div className="text-sm text-blue-900/70 mt-1">
                        {currentCondition.weatherDesc[0].value}
                      </div>
                    </div>

                    {/* Weather details */}
                    <div className="mt-auto space-y-2">
                      {/* UV Index + Humidity */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-700" />
                          <span className="text-blue-900">{currentCondition.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-500" />
                          <span className="text-blue-900">UV {currentCondition.uvIndex || '0'}</span>
                        </div>
                      </div>

                      {/* Skincare Advice */}
                      {aiAdvice && (
                        <div className="mt-3 pt-3 border-t border-blue-900/10">
                          <div className="text-xs text-blue-900/80 font-medium mb-1">
                            {t.skincareAdvice || 'Skincare Advice'}
                          </div>
                          <div className="text-xs text-blue-900/70 leading-relaxed">
                            {loadingAdvice ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              aiAdvice
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-blue-900/60 py-12 flex-1 flex items-center justify-center">
                    <Cloud className="w-10 h-10 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
