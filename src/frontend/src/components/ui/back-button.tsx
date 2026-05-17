"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  label?: React.ReactNode;
  fallback?: string;
  className?: string;
}

export default function BackButton({ label, fallback = '/', className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Prefer history back; fallback to a safe route
    try {
      router.back();
    } catch (err) {
      router.push(fallback);
    }
  };

  return (
    <Button variant="ghost" onClick={handleBack} className={className}>
      <ChevronLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
