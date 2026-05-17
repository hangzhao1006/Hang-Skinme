'use client';

import { useState } from 'react';
import { Cloud } from 'lucide-react';
import CompactCalendar from '@/components/CompactCalendar';

interface FlashcardWidgetProps {
  weather: any;
  isFahrenheit: boolean;
  onToggleUnit: () => void;
  getDisplayTemperature: (tempC: string) => string;
}

export function FlashcardWidget({
  weather,
  isFahrenheit,
  onToggleUnit,
  getDisplayTemperature
}: FlashcardWidgetProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCondition = weather?.current_condition?.[0];
  const location = weather?.nearest_area?.[0]?.areaName?.[0]?.value || 'Allston';

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="w-full h-full relative overflow-hidden rounded-2xl aspect-square cursor-pointer group"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front: CompactCalendar - same display as current */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent flip when interacting with calendar
          }}
        >
          <CompactCalendar />
        </div>

        {/* Back: Weather */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#e6f3ff] via-[#cfe6ff] to-[#a8d4ff] p-4 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleUnit();
            }}
            className="absolute top-2 right-2 text-[10px] text-blue-900/60 hover:text-blue-900 bg-white/30 hover:bg-white/50 rounded-full px-2 py-1 transition-all z-10"
          >
            {isFahrenheit ? '°C' : '°F'}
          </button>
          {currentCondition ? (
            <div className="text-center">
              <div className="text-xs text-blue-900/70 mb-1">{location}</div>
              <div className="text-4xl font-bold text-blue-900">
                {getDisplayTemperature(currentCondition.temp_C)}
              </div>
              <div className="text-xs text-blue-900/70 mt-2 flex items-center justify-center gap-2">
                <span>{currentCondition.humidity}%</span>
                <span>•</span>
                <span>UV {currentCondition.uvIndex || '0'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Cloud className="w-8 h-8 text-blue-900/50 animate-pulse" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 text-xs text-blue-900/40">Tap to flip</div>
        </div>
      </div>
    </div>
  );
}
