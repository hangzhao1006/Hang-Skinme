'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Package, Edit, Trash2, Sparkles, FlaskConical, Search, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/locales/translations';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';

// Event types - now includes skincare_routine
type EventType = 'event' | 'product_delivery' | 'skincare_routine';

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
  time: 'morning' | 'evening';
}

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  title: string;
  description?: string;
  deliveryStatus?: 'ordered' | 'shipped' | 'delivered'; // For product_delivery events
  products?: RoutineProduct[]; // For skincare_routine events
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function EnhancedCalendar() {
  const { language } = useLanguage();
  const t = useTranslations(language);
  const { user } = useAuth();
  const { sessionId } = useChat();

  const [isMounted, setIsMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Form state
  const [eventType, setEventType] = useState<EventType>('event');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'ordered' | 'shipped' | 'delivered'>('ordered');

  // Product search state for skincare_routine
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [routineProducts, setRoutineProducts] = useState<RoutineProduct[]>([]);
  const [currentTime, setCurrentTime] = useState<'morning' | 'evening'>('morning');

  // Backend sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load events from backend (logged in or anonymous with sessionId) or localStorage (fallback)
  useEffect(() => {
    const loadEvents = async () => {
      if (user?.email) {
        // Logged in - load from backend with email
        try {
          setIsLoading(true);
          const response = await fetch(`${API_BASE_URL}/calendar/load/${encodeURIComponent(user.email)}`);

          if (response.ok) {
            const data = await response.json();
            setEvents(data.events || []);
            console.log(`✅ Loaded ${data.events?.length || 0} calendar events from backend (email)`);
          } else {
            console.error('Failed to load calendar events');
          }
        } catch (error) {
          console.error('Error loading calendar events:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (sessionId) {
        // Anonymous with sessionId - load from backend with session_id
        try {
          setIsLoading(true);
          const response = await fetch(`${API_BASE_URL}/calendar/load/${sessionId}`);

          if (response.ok) {
            const data = await response.json();
            setEvents(data.events || []);
            console.log(`✅ Loaded ${data.events?.length || 0} calendar events from backend (session_id)`);
          } else {
            console.error('Failed to load calendar events');
          }
        } catch (error) {
          console.error('Error loading calendar events:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No email and no sessionId yet - load from localStorage as fallback
        try {
          const localEvents = localStorage.getItem('calendar_events');
          if (localEvents) {
            const parsedEvents = JSON.parse(localEvents);
            setEvents(parsedEvents);
            console.log(`✅ Loaded ${parsedEvents.length} calendar events from localStorage`);
          }
        } catch (error) {
          console.error('Error loading from localStorage:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadEvents();
  }, [user?.email, sessionId]);

  // Save events to backend (logged in or anonymous with sessionId) or localStorage (fallback)
  const saveEvents = async (eventsToSave: CalendarEvent[]) => {
    if (user?.email) {
      // Logged in - save to backend with email
      try {
        setIsSyncing(true);
        const response = await fetch(`${API_BASE_URL}/calendar/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            events: eventsToSave,
          }),
        });

        if (response.ok) {
          console.log('✅ Calendar events saved to backend (email)');
        } else {
          console.error('Failed to save calendar events');
        }
      } catch (error) {
        console.error('Error saving calendar events:', error);
      } finally {
        setIsSyncing(false);
      }
    } else if (sessionId) {
      // Anonymous with sessionId - save to backend with session_id
      try {
        setIsSyncing(true);
        const response = await fetch(`${API_BASE_URL}/calendar/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            events: eventsToSave,
          }),
        });

        if (response.ok) {
          console.log('✅ Calendar events saved to backend (session_id)');
        } else {
          console.error('Failed to save calendar events');
        }
      } catch (error) {
        console.error('Error saving calendar events:', error);
      } finally {
        setIsSyncing(false);
      }
    } else {
      // No email and no sessionId - fallback to localStorage
      try {
        localStorage.setItem('calendar_events', JSON.stringify(eventsToSave));
        console.log(`✅ Saved ${eventsToSave.length} calendar events to localStorage`);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateStr(date);
    return events.filter(event => event.date === dateStr);
  };

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setIsEventDialogOpen(true);
    setEditingEvent(null);
    resetForm();
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventType(event.type);
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setDeliveryStatus(event.deliveryStatus || 'ordered');
    setRoutineProducts(event.products || []);
    setIsEventDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const updatedEvents = events.filter((e: CalendarEvent) => e.id !== eventId);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
  };

  const resetForm = () => {
    setEventType('event');
    setEventTitle('');
    setEventDescription('');
    setDeliveryStatus('ordered');
    setRoutineProducts([]);
    setSearchQuery('');
    setSearchResults([]);
    setShowProductSearch(false);
    setCurrentTime('morning');
  };

  // Search products
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );

      if (!response.ok) throw new Error('Failed to search products');

      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add product to routine
  const handleAddProduct = (product: Product) => {
    const newProduct: RoutineProduct = {
      product_id: product.id,
      product_name: product.title,
      brand: product.brand,
      time: currentTime,
    };

    setRoutineProducts([...routineProducts, newProduct]);
    setSearchQuery('');
    setSearchResults([]);
    setShowProductSearch(false);
  };

  // Remove product from routine
  const handleRemoveProduct = (productId: string) => {
    setRoutineProducts(routineProducts.filter((p) => p.product_id !== productId));
  };

  const handleSaveEvent = async () => {
    if (!selectedDate && !editingEvent) return;

    // For skincare_routine, require at least one product
    if (eventType === 'skincare_routine' && routineProducts.length === 0) {
      return;
    }

    const dateStr = editingEvent
      ? editingEvent.date
      : formatDateStr(selectedDate!);

    const newEvent: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      date: dateStr,
      type: eventType,
      title: eventType === 'skincare_routine'
        ? (language === 'zh' ? '护肤记录' : 'Skincare Routine')
        : eventTitle,
      description: eventDescription,
      deliveryStatus: eventType === 'product_delivery' ? deliveryStatus : undefined,
      products: eventType === 'skincare_routine' ? routineProducts : undefined,
      createdAt: editingEvent?.createdAt || new Date().toISOString()
    };

    let updatedEvents: CalendarEvent[];
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === editingEvent.id ? newEvent : e);
    } else {
      updatedEvents = [...events, newEvent];
    }

    setEvents(updatedEvents);

    // Save to backend or localStorage
    await saveEvents(updatedEvents);

    setIsEventDialogOpen(false);
    resetForm();
  };


  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'event':
        return <Sparkles className="w-3 h-3" />;
      case 'product_delivery':
        return <Package className="w-3 h-3" />;
      case 'skincare_routine':
        return <FlaskConical className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'event':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'product_delivery':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'skincare_routine':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (!isMounted) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#d9f3d0] via-[#f6e6f5] to-[#fbe4d5] p-5 flex flex-col shadow-sm h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-slate-600">Loading calendar...</div>
        </div>
      </div>
    );
  }

  const localeMap: Record<string, string> = {
    zh: 'zh-CN',
    en: 'en-US',
    es: 'es-ES',
    vi: 'vi-VN'
  };

  const eventLabels = {
    zh: { event: '活动/事件', delivery: '产品配送', skincare: '护肤记录' },
    en: { event: 'Event / Activity', delivery: 'Product Delivery', skincare: 'Skincare Routine' },
    es: { event: 'Evento / Actividad', delivery: 'Entrega de productos', skincare: 'Rutina de cuidado de la piel' },
    vi: { event: 'Sự kiện / Hoạt động', delivery: 'Giao sản phẩm', skincare: 'Quy trình chăm sóc da' }
  };

  const monthName = currentDate.toLocaleDateString(localeMap[language] || 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  const weekDays = t.weekDaysShort;

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#d9f3d0] via-[#f6e6f5] to-[#fbe4d5] p-5 flex flex-col shadow-sm h-full">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c8e5b9]/55 to-[#e3c5f4]/40 rounded-full blur-2xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-[#f7d5e8]/45 to-[#d9f3d0]/42 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-[#d7f0d2]/30 to-[#f0d9f5]/22 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      {/* SVG Noise Filter */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
        <filter id="enhancedCalendarNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#enhancedCalendarNoise)" opacity="0.05" />
      </svg>

      {/* Content with higher z-index */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Calendar Title Section with Month/Year */}
        <div className="flex-shrink-0 border-b border-slate-200/50 pb-2 mb-3 pr-10 md:pr-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{t.calendarTitle}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <span className="text-xs font-medium text-slate-700 min-w-[100px] text-center">
                {monthName}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Backend Sync Status Bar */}
        {isSyncing && (
          <div className="mb-2 py-1 px-2 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3">
                <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-xs font-medium text-slate-700">
                Saving...
              </span>
            </div>
          </div>
        )}

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 flex-shrink-0">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-slate-500 py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-9" />;
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayEvents = getEventsForDate(date);
          const isTodayDate = isToday(day);

          return (
            <div key={index} className="flex items-center justify-center h-9">
              <button
                onClick={() => handleDateClick(day)}
                className={`
                  w-9 h-9 rounded-full border-2 transition-all hover:scale-105
                  flex items-center justify-center relative group
                  ${isTodayDate ? 'bg-[#7f9f6e] border-[#7f9f6e] text-white font-semibold' : 'bg-white border-slate-200 text-slate-900 hover:border-[#d8c5f4]'}
                  ${dayEvents.length > 0 && !isTodayDate ? 'ring-2 ring-[#d8c5f4] ring-offset-1 ring-offset-white' : ''}
                `}
              >
                <span className="text-xs">{day}</span>

                {/* Event indicators */}
                {dayEvents.length > 0 && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          event.type === 'event' ? 'bg-[#c5a4e0]' :
                          event.type === 'product_delivery' ? 'bg-[#8fb48a]' :
                          'bg-[#60a5fa]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-200/50">
          <div className="text-xs text-slate-600 mb-2">{t.eventTypes}</div>
          <div className="flex items-center flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#c5a4e0] flex-shrink-0" />
              <span className="text-slate-700">{eventLabels[language]?.event || eventLabels.en.event}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#8fb48a] flex-shrink-0" />
              <span className="text-slate-700">{eventLabels[language]?.delivery || eventLabels.en.delivery}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa] flex-shrink-0" />
              <span className="text-slate-700">{eventLabels[language]?.skincare || eventLabels.en.skincare}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? t.editEvent : t.addEvent} - {selectedDate?.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show existing events for this date */}
            {selectedDate && !editingEvent && getEventsForDate(selectedDate).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">{t.existingEvents}</div>
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${getEventColor(event.type)} flex items-start justify-between`}
                  >
                    <div className="flex items-start gap-2 flex-1">
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{event.title}</div>
                        {event.description && (
                          <div className="text-xs mt-1 opacity-80">{event.description}</div>
                        )}
                        {event.deliveryStatus && (
                          <div className="text-xs mt-1">
                            Status: {event.deliveryStatus}
                          </div>
                        )}
                        {event.products && event.products.length > 0 && (
                          <div className="text-xs mt-1 opacity-80">
                            {event.products.length} {language === 'zh' ? '个产品' : 'products'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="text-sm font-medium text-slate-700 mb-3">{t.addNewEvent}</div>
                </div>
              </div>
            )}

            {/* Event Type */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t.eventTypeLabel}</label>
              <Select value={eventType} onValueChange={(value: EventType) => setEventType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="event">{eventLabels[language]?.event || eventLabels.en.event}</SelectItem>
                <SelectItem value="product_delivery">{eventLabels[language]?.delivery || eventLabels.en.delivery}</SelectItem>
                <SelectItem value="skincare_routine">{eventLabels[language]?.skincare || eventLabels.en.skincare}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title (only for non-skincare_routine events) */}
            {eventType !== 'skincare_routine' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">{t.titleLabel}</label>
                <Input
                  placeholder={t.eventTitlePlaceholder}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t.descriptionOptional}</label>
              <Textarea
                placeholder={t.eventDescriptionPlaceholder}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Skincare Routine Products (only for skincare_routine type) */}
            {eventType === 'skincare_routine' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  {language === 'zh' ? '产品列表' : 'Products'}
                </label>

                {/* Time selector */}
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={currentTime === 'morning' ? 'default' : 'outline'}
                    onClick={() => setCurrentTime('morning')}
                    className={currentTime === 'morning' ? 'bg-gradient-to-r from-[#B5D38E] via-[#83AB54] to-[#7f8f70]' : ''}
                  >
                    {language === 'zh' ? '早上' : 'Morning'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={currentTime === 'evening' ? 'default' : 'outline'}
                    onClick={() => setCurrentTime('evening')}
                    className={currentTime === 'evening' ? 'bg-gradient-to-r from-[#B5D38E] via-[#83AB54] to-[#7f8f70]' : ''}
                  >
                    {language === 'zh' ? '晚上' : 'Evening'}
                  </Button>
                </div>

                {/* Added products list */}
                {routineProducts.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {routineProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{product.product_name}</div>
                          <div className="text-xs text-gray-600">{product.brand}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.time === 'morning' ? (language === 'zh' ? '早上' : 'Morning') : (language === 'zh' ? '晚上' : 'Evening')}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProduct(product.product_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add product button */}
                <Button
                  type="button"
                  onClick={() => setShowProductSearch(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '添加产品' : 'Add Product'}
                </Button>
              </div>
            )}

            {/* Delivery Status (only for product_delivery type) */}
            {eventType === 'product_delivery' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">{t.deliveryStatusLabel}</label>
                <Select value={deliveryStatus} onValueChange={(value: 'ordered' | 'shipped' | 'delivered') => setDeliveryStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleSaveEvent}
              disabled={
                eventType === 'skincare_routine'
                  ? routineProducts.length === 0
                  : !eventTitle.trim()
              }
              className='bg-gradient-to-r from-[#B5D38E] via-[#83AB54] to-[#7f8f70] hover:from-[#bed0a3] hover:via-[#97a47d] hover:to-[#6d7c60] text-white'
            >
              {editingEvent ? t.update : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Search Modal */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'zh' ? '搜索产品' : 'Search Products'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <Input
                placeholder={language === 'zh' ? '输入产品名称或品牌...' : 'Enter product name or brand...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search results */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {language === 'zh' ? '输入关键词开始搜索' : 'Enter a keyword to start searching'}
                </div>
              ) : (
                searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductSearch(false)}>
              {t.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
