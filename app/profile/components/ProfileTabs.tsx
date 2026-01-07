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
 * Desain: Gaming Pills dengan efek active state yang kuat (Gold Highlight).
 * Menggunakan transisi halus dan spacing yang nyaman untuk touch target.
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
    <nav className="w-full overflow-x-auto no-scrollbar" aria-label="Profile Tabs">
      <div className="flex gap-2 p-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative group px-5 py-2.5 rounded-xl text-xs md:text-sm font-clash font-bold tracking-wide uppercase
                transition-all duration-300 ease-out border
                ${
                  isActive
                    ? 'bg-coc-gold border-coc-gold text-coc-dark shadow-[0_0_20px_-5px_rgba(255,215,0,0.5)] scale-105'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                }
              `}
            >
              {/* Shine Effect for Active Tab */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-50 pointer-events-none" />
              )}
              
              {/* Label */}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};