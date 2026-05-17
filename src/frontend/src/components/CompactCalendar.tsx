'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { XIcon } from 'lucide-react';
import EnhancedCalendar from '@/components/EnhancedCalendar';
import { useTranslations } from '@/locales/translations';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CompactCalendar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();
  const t = useTranslations(language);
  // 直接初始化日期，避免闪烁
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    // 仅在客户端更新日期确保准确性
    setCurrentDate(new Date());
  }, []);

  return (
    <>
      {/* Compact Widget - Click to expand */}
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#c8e5b9]/55 to-[#e3c5f4]/40 p-4 shadow-sm aspect-square flex flex-col items-center justify-center hover:shadow-md transition-shadow">
        <div className="text-xs text-slate-700 mb-1">
          {currentDate.toLocaleDateString(
            language === 'zh' ? 'zh-CN' : language === 'es' ? 'es-ES' : language === 'vi' ? 'vi-VN' : 'en-US',
            { month: 'short', year: 'numeric' }
          )}
        </div>
        <div className="text-4xl font-bold text-slate-800 leading-none">
          {currentDate.getDate()}
        </div>
        <div className="text-xs text-slate-700 mt-2 flex items-center justify-center gap-2">
          <span>{currentDate.toLocaleDateString(
            language === 'zh' ? 'zh-CN' : language === 'es' ? 'es-ES' : language === 'vi' ? 'vi-VN' : 'en-US',
            { weekday: 'short' }
          )}</span>
          <span>•</span>
          <span className="text-[10px] text-slate-500">{t.taptoopen}</span>
        </div>
      </button>

      {/* Expanded Calendar Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogPortal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-opacity duration-300 ease-out"
          />
          <DialogPrimitive.Content
            className="fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-md p-0 rounded-3xl overflow-hidden bg-white shadow-lg transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:scale-95 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
            onPointerDownOutside={() => setIsExpanded(false)}
            onEscapeKeyDown={() => setIsExpanded(false)}
          >
            {/* Hidden title for accessibility */}
            <VisuallyHidden.Root>
              <DialogTitle>Calendar</DialogTitle>
            </VisuallyHidden.Root>

            {/* Close button - positioned inside dialog on mobile, outside on desktop */}
            <DialogPrimitive.Close className="absolute top-3 right-3 md:-top-10 md:right-0 rounded-full bg-white/90 p-2 opacity-90 transition-opacity hover:opacity-100 focus:outline-none z-50">
              <XIcon className="w-5 h-5 text-slate-700" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {/* Calendar fills the dialog completely */}
            <EnhancedCalendar />
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
