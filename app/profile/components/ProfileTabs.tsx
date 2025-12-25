'use client';

import React from 'react';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Tipe data untuk Tab ID agar type-safe
export type ProfileTab = 'summary' | 'reputation' | 'army' | 'achievements' | 'history' | 'posts';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

/**
 * Komponen Navigasi Tab Profil.
 * Desain: Pills / Segmented Control style (bukan border-bottom biasa).
 * Cocok untuk ditempatkan di dalam container sticky/glass.
 */
export const ProfileTabs = ({ activeTab, onTabChange }: ProfileTabsProps) => {
  const { t } = useLanguage();

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'summary', label: t.profile.tabSummary },
    { id: 'reputation', label: t.profile.tabReputation },
    { id: 'army', label: t.profile.tabArmy },
    { id: 'achievements', label: t.profile.tabAchievements },
    { id: 'history', label: t.profile.tabHistory },
    { id: 'posts', label: t.profile.tabPosts },
  ];

  return (
    <nav className="flex overflow-x-auto no-scrollbar gap-1 md:gap-2 w-full" aria-label="Profile Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-lg text-xs md:text-sm font-clash font-medium tracking-wide uppercase transition-all duration-300
            ${
              activeTab === tab.id
                ? 'bg-coc-gold text-coc-dark shadow-md shadow-coc-gold/10 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};