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
    <div className="w-full bg-gradient-to-b from-[#252525] to-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
      
      {/* 1. Header: Segmented Control Tabs */}
      <div className="p-2 md:p-3 border-b border-white/5 bg-black/20">
        <div className="flex p-1 gap-1 bg-black/40 rounded-xl overflow-x-auto no-scrollbar snap-x">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            // Dynamic Style based on Active State
            let activeClass = 'text-gray-400 hover:text-white hover:bg-white/5';
            let iconClass = 'text-gray-500 group-hover:text-gray-300';
            
            if (isActive) {
                if (tab.id === 'clashubTeams') { activeClass = 'bg-coc-gold text-coc-stone shadow-lg'; iconClass = 'text-coc-stone'; }
                else if (tab.id === 'publicClans') { activeClass = 'bg-coc-blue text-white shadow-lg'; iconClass = 'text-white'; }
                else { activeClass = 'bg-coc-green text-white shadow-lg'; iconClass = 'text-white'; }
            }

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as ActiveTab)}
                className={`flex-1 min-w-[120px] snap-center flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide transition-all duration-300 ${activeClass}`}
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconClass}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Body: Dynamic Filter/Search Content */}
      <div className="p-4 md:p-6 bg-white/[0.02]">
        <div className="animate-in fade-in zoom-in-95 duration-300">
            {children}
        </div>
      </div>
    </div>
  );
};