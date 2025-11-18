// File: app/profile/components/ProfileTabs.tsx
// Deskripsi: Komponen navigasi tab horizontal untuk halaman profil.
// Membagi konten menjadi Summary, Reputasi, Army, Achievements, History, dan Postingan.

'use client';

import React from 'react';

// Tipe data untuk Tab ID agar type-safe
export type ProfileTab = 'summary' | 'reputation' | 'army' | 'achievements' | 'history' | 'posts';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export const ProfileTabs = ({ activeTab, onTabChange }: ProfileTabsProps) => {
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'summary', label: 'SUMMARY' },
    { id: 'reputation', label: 'REPUTASI' },
    { id: 'army', label: 'ARMY' },
    { id: 'achievements', label: 'ACHIEVEMENTS' },
    { id: 'history', label: 'HISTORY' }, // Tab Baru
    { id: 'posts', label: 'POSTINGAN' }, // Tab Baru
  ];

  return (
    <div className="w-full border-b border-white/10 mb-6">
      <nav className="flex overflow-x-auto no-scrollbar gap-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              pb-3 text-sm font-clash tracking-wider uppercase transition-colors whitespace-nowrap border-b-2 px-1
              ${
                activeTab === tab.id
                  ? 'border-coc-gold text-coc-gold'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};