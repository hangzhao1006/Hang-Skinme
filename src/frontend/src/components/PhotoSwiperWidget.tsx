'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import Image from 'next/image';

interface PhotoEntry {
  date: string;
  imageUrl: string;
  note?: string;
}

interface PhotoSwiperWidgetProps {
  photos: PhotoEntry[];
  onAddNote?: (photoIndex: number, note: string) => void;
}

export function PhotoSwiperWidget({ photos, onAddNote }: PhotoSwiperWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(photos.length > 0 ? photos.length - 1 : 0);

  // Reset to newest photo when photos array changes
  useEffect(() => {
    if (photos.length > 0) {
      setCurrentIndex(photos.length - 1);
    }
  }, [photos.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = photos[currentIndex];

  const handleNoteChange = (e: any) => {
    const newNote = e.target.value;
    if (onAddNote) {
      onAddNote(currentIndex, newNote);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl aspect-square shadow-sm">
      {/* Photo Display Area - Full widget */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden">
        {currentPhoto?.imageUrl ? (
          <>
            <Image
              src={currentPhoto.imageUrl}
              alt={`Skin photo ${currentPhoto.date}`}
              fill
              className="object-cover"
            />

            {/* Date Label */}
            <div className="absolute top-2 left-2 bg-white/95 rounded-full px-2.5 py-1 shadow-sm z-10">
              <span className="text-[10px] font-medium text-slate-700">{currentPhoto.date}</span>
            </div>

            {/* Note Bubble - Editable */}
            {currentPhoto.note !== undefined && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[60%] z-10">
                <input
                  type="text"
                  value={currentPhoto.note}
                  onChange={handleNoteChange}
                  placeholder="Add note..."
                  className="w-full px-3 py-1.5 text-[10px] bg-white/90 backdrop-blur-md rounded-full border-none focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 text-slate-700 text-center shadow-lg"
                />
              </div>
            )}

            {/* Navigation Arrows - Inside photo */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all z-20"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all z-20"
                >
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </button>
              </>
            )}

            {/* Dots Indicator - Inside photo at bottom */}
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50 w-1.5'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-50">
            <Camera className="w-12 h-12 text-slate-300" />
          </div>
        )}
      </div>
    </div>
  );
}
