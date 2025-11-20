'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translation } from '@/lib/i18n/types';
import { translations } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

// Kita export Context ini agar bisa dipakai oleh Hook di file terpisah nanti
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default bahasa adalah Indonesia ('id')
  const [language, setLanguageState] = useState<Language>('id');
  
  // State untuk menandai apakah komponen sudah dimuat di client (untuk akses localStorage)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Cek apakah ada preferensi bahasa yang tersimpan
    const savedLang = localStorage.getItem('clashub-lang') as Language;
    if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('clashub-lang', lang);
  };

  // Ambil objek terjemahan (dictionary) berdasarkan bahasa yang aktif
  const t = translations[language];

  // Opsional: Mencegah hydration mismatch jika diperlukan, tapi untuk teks biasanya aman render default dulu
  if (!isMounted) {
    // Render dengan default state (id) di server/first paint
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}