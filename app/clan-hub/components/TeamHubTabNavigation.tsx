'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ShieldIcon, UserIcon, GlobeIcon } from '@/app/components/icons';

type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

interface TeamHubTabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  children?: ReactNode; // Slot untuk Filter Bar
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  return (
    // [LAYOUT BARU] Header Bar yang menampung Navigasi & Filter
    // Wrapper ini akan mengisi 100% lebar dari parent-nya (div sticky di TeamHubClient)
    <div className="w-full bg-[#1a1a1a] border-b border-white/10 p-4 shadow-xl">
        <div className="container mx-auto flex flex-col xl:flex-row xl:items-start gap-4 xl:gap-6">
            
            {/* 1. Navigation Menu (Dropdown) - Sebelah Kiri */}
            <div className="relative w-full xl:w-auto xl:min-w-[260px] z-40 shrink-0" ref={dropdownRef}>
                <div className="mb-2 hidden xl:block">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">
                        Kategori
                    </label>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white transition-all focus:outline-none focus:border-coc-gold/50 focus:ring-1 focus:ring-coc-gold/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-coc-gold/10 text-coc-gold">
                            <ActiveIcon className="w-5 h-5" />
                        </div>
                        <span className="font-clash text-base tracking-wide">{activeTabObj.label}</span>
                    </div>
                    {/* Chevron Icon */}
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu Overlay */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#222] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        onTabChange(tab.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-white/5 last:border-0
                                        ${isActive 
                                            ? 'bg-coc-gold/10 text-coc-gold' 
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-coc-gold' : 'text-gray-500'}`} />
                                    <span className={`font-sans ${isActive ? 'font-bold' : 'font-medium'}`}>
                                        {tab.label}
                                    </span>
                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-coc-gold shadow-[0_0_8px_rgba(255,215,0,0.5)]"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 2. Filters Area - Sebelah Kanan (Mengisi sisa ruang) */}
            <div className="flex-grow w-full min-w-0">
                {children}
            </div>
        </div>
    </div>
  );
};