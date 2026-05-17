'use client';

import { useState } from 'react';
import { Cloud, Droplets, Sun } from 'lucide-react';
import EnhancedCalendar from '@/components/EnhancedCalendar';

interface DesktopFlashcardWidgetProps {
  weather: any;
  isFahrenheit: boolean;
  onToggleUnit: () => void;
  getDisplayTemperature: (tempC: string) => string;
  aiAdvice?: string;
  loadingAdvice?: boolean;
  skincareAdviceLabel: string;
}

export function DesktopFlashcardWidget({
  weather,
  isFahrenheit,
  onToggleUnit,
  getDisplayTemperature,
  aiAdvice,
  loadingAdvice,
  skincareAdviceLabel
}: DesktopFlashcardWidgetProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCondition = weather?.current_condition?.[0];
  const location = weather?.nearest_area?.[0]?.areaName?.[0]?.value || 'Allston';

  return (
    <div
      className="h-full min-h-[400px] relative overflow-hidden rounded-2xl"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front: EnhancedCalendar */}
        <div
          className="absolute inset-0 h-full relative cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={(e) => {
            // Only flip if clicking on the calendar background, not interactive elements
            const target = e.target as HTMLElement;
            if (target.closest('button, input, a, [role="button"]')) {
              return;
            }
            setIsFlipped(!isFlipped);
          }}
        >
          <EnhancedCalendar />
          <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">
            Tap to flip
          </div>
        </div>

        {/* Back: Weather Widget */}
        <div
          className="absolute inset-0 h-full bg-gradient-to-br from-[#e6f3ff] via-[#cfe6ff] to-[#a8d4ff] p-5 flex flex-col shadow-sm rounded-2xl cursor-pointer"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
          onClick={(e) => {
            // Only flip if clicking on the weather background, not interactive elements
            const target = e.target as HTMLElement;
            if (target.closest('button, input, a, [role="button"]')) {
              return;
            }
            setIsFlipped(!isFlipped);
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleUnit();
            }}
            className="absolute top-3 right-3 z-20 text-xs text-blue-900/60 hover:text-blue-900 bg-white/30 hover:bg-white/50 rounded-full px-3 py-1.5 transition-all"
          >
            {isFahrenheit ? '°C' : '°F'}
          </button>

          {currentCondition ? (
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="text-sm text-blue-900/70 mb-2">{location}</div>
              <div className="mb-3">
                <div className="text-5xl font-extralight text-blue-900 tracking-tight">
                  {getDisplayTemperature(currentCondition.temp_C)}
                </div>
                <div className="text-sm text-blue-900/70 mt-1">
                  {currentCondition.weatherDesc[0].value}
                </div>
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
                    <div className="text-xs text-blue-900/80 font-medium mb-1">
                      {skincareAdviceLabel}
                    </div>
                    <div className="text-xs text-blue-900/70 leading-relaxed">
                      {loadingAdvice ? <span className="animate-pulse">...</span> : aiAdvice}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Cloud className="w-10 h-10 text-blue-900/50 animate-pulse" />
            </div>
          )}

          <div className="absolute bottom-3 right-3 text-xs text-blue-900/40">Tap to flip</div>
        </div>
      </div>
    </div>
  );
}
