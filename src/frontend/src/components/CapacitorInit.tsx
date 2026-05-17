'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function CapacitorInit() {
  useEffect(() => {
    // Capacitor will automatically initialize on native platforms
    // This component ensures proper initialization for web/dev mode
    if (Capacitor.isNativePlatform()) {
      console.log('Running on native platform:', Capacitor.getPlatform());
    } else {
      console.log('Running on web platform');
    }
  }, []);

  return null;
}
