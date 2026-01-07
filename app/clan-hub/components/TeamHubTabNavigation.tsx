'use client';

import React, { ReactNode } from 'react';
import { ShieldIcon, UserIcon, GlobeIcon } from '@/app/components/icons';

type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

interface TeamHubTabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  children?: ReactNode; // Slot untuk Filter Bar / Search Input
}

const tabs = [
  { id: 'clashubTeams', label: 'Clan Internal', icon: ShieldIcon },
  { id: 'publicClans', label: 'Cari Klan Publik', icon: GlobeIcon },
  { id: 'players', label: 'Cari Pemain', icon: UserIcon },
] as const;

export const TeamHubTabNavigation = ({
  activeTab,
  onTabChange,
  children
}: TeamHubTabNavigationProps) => {

  return (
    // Unified Control Card
    <div className="w-full bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
      {/* Decorative Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue via-coc-gold to-coc-green opacity-50" />
      
      {/* 1. Header: Segmented Control Tabs */}
      <div className="p-4 border-b border-white/5 bg-[#0a0a0b]/50">
        <div className="flex p-1 gap-1 bg-[#0f1115] rounded-xl overflow-x-auto no-scrollbar snap-x border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            // Dynamic Style based on Active State
            let activeClass = 'text-gray-500 hover:text-white hover:bg-white/5';
            let iconClass = 'text-gray-600 group-hover:text-gray-400';
            
            if (isActive) {
                if (tab.id === 'clashubTeams') { activeClass = 'bg-[#1a1d26] text-white shadow-md border border-white/10'; iconClass = 'text-coc-gold'; }
                else if (tab.id === 'publicClans') { activeClass = 'bg-[#1a1d26] text-white shadow-md border border-white/10'; iconClass = 'text-coc-blue'; }
                else { activeClass = 'bg-[#1a1d26] text-white shadow-md border border-white/10'; iconClass = 'text-coc-green'; }
            }

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as ActiveTab)}
                className={`flex-1 min-w-[140px] snap-center flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 group ${activeClass}`}
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${iconClass}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Body: Dynamic Filter/Search Content */}
      <div className="p-6 md:p-8 bg-[#0a0a0b]/30 relative">
        <div className="animate-in fade-in zoom-in-95 duration-300">
            {children}
        </div>
      </div>
    </div>
  );
};