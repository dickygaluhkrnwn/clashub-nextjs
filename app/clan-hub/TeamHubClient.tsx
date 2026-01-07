'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Player,
  PublicClanIndex,
  RecommendedTeam,
} from '@/lib/types';

import { TeamHubFilterBar } from './components/TeamHubFilterBar';
import { ClashubTeamsTab } from './components/ClashubTeamsTab';
import { PublicClansTab, PublicClanSearchFilter } from './components/PublicClansTab';
import { PlayersTab } from './components/PlayersTab';
import { TeamHubTabNavigation } from './components/TeamHubTabNavigation';
import FeaturedSection from './components/FeaturedSection'; 
import { TeamHubHeader } from './components/TeamHubHeader'; // [BARU] Import Header terpisah agar bersih

import { ManagedClanFilters } from '@/app/components/filters/TeamHubFilter';
import { useLanguage } from '@/lib/hooks/useLanguage';

export type PlayerFilters = {
  searchTerm: string;
  role: 'all' | 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  reputation: number;
  thLevel: number;
};

type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

interface TeamHubClientProps {
  initialClans: RecommendedTeam[];
  initialPlayers: Player[];
  initialPublicClans: PublicClanIndex[];
}

const TeamHubClient = ({
  initialClans,
  initialPlayers,
  initialPublicClans,
}: TeamHubClientProps) => {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('clashubTeams');
  
  // Filter States
  const [clanFilters, setClanFilters] = useState<ManagedClanFilters>({
    searchTerm: '', thLevel: 0, minMembers: 0, vision: 'all', reputation: 0,
  });
  const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
    searchTerm: '', role: 'all', reputation: 0, thLevel: 0,
  });

  // Data States
  const [isFiltering, setIsFiltering] = useState(false);
  const [visibleClansCount, setVisibleClansCount] = useState(6);
  const [visiblePlayersCount, setVisiblePlayersCount] = useState(6);
  const [visiblePublicClansCount, setVisiblePublicClansCount] = useState(6);

  // Public Search States
  const [publicClanTag, setPublicClanTag] = useState('');
  const [publicClanResult, setPublicClanResult] = useState<PublicClanIndex | null>(null);
  const [isSearchingPublicClan, setIsSearchingPublicClan] = useState(false);
  const [publicSearchError, setPublicSearchError] = useState<string | null>(null);
  const [publicClansCache] = useState<PublicClanIndex[]>(() =>
    [...initialPublicClans].sort((a, b) => (b.clanLevel || 0) - (a.clanLevel || 0))
  );

  // --- EFFECT: URL SYNC ---
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'players') setActiveTab('players');
    else if (tab === 'public-clans') setActiveTab('publicClans');
    else setActiveTab('clashubTeams');
  }, [searchParams]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    // Reset Filters & View Limits when changing tabs
    setClanFilters({ searchTerm: '', thLevel: 0, minMembers: 0, vision: 'all', reputation: 0 });
    setPlayerFilters({ searchTerm: '', role: 'all', reputation: 0, thLevel: 0 });
    setPublicClanTag('');
    setPublicSearchError(null);
    setPublicClanResult(null);
    setVisibleClansCount(6);
    setVisiblePlayersCount(6);
    setVisiblePublicClansCount(6);

    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'clashubTeams') params.delete('tab');
    else if (tab === 'players') params.set('tab', 'players');
    else if (tab === 'publicClans') params.set('tab', 'public-clans');
    router.push(`/clan-hub?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Filter Handlers
  const handleClanFilterChange = (newFilters: ManagedClanFilters) => {
    setIsFiltering(true);
    setVisibleClansCount(6);
    setTimeout(() => { setClanFilters(newFilters); setIsFiltering(false); }, 300);
  };

  const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
    setIsFiltering(true);
    setVisiblePlayersCount(6);
    setTimeout(() => { setPlayerFilters(newFilters); setIsFiltering(false); }, 300);
  };

  const handlePublicClanSearch = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      const rawTag = publicClanTag.toUpperCase().trim();
      if (!rawTag) {
        setPublicClanResult(null); setPublicSearchError(null); setVisiblePublicClansCount(6); return;
      }
      setIsSearchingPublicClan(true); setPublicSearchError(null); setPublicClanResult(null);
      const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
      try {
        const response = await fetch(`/api/coc/search-clan?clanTag=${encodeURIComponent(tagToSearch)}`);
        let result: any;
        try { result = await response.json(); } catch { throw new Error('Parse error'); }
        if (!response.ok) {
          setPublicSearchError(response.status === 404 ? `Klan ${tagToSearch} tidak ditemukan.` : result.error);
          return;
        }
        if (result && result.clan) setPublicClanResult(result.clan);
        else setPublicSearchError('Format respons tidak valid.');
      } catch { setPublicSearchError('Terjadi kesalahan.'); } 
      finally { setIsSearchingPublicClan(false); }
    }, [publicClanTag]);

  // Filtering Data Logic
  const filteredClans = useMemo(() => {
    return initialClans.filter((clan) => {
      if (clanFilters.searchTerm && !clan.name.toLowerCase().includes(clanFilters.searchTerm.toLowerCase()) && !clan.tag.toLowerCase().includes(clanFilters.searchTerm.toLowerCase())) return false;
      if (clanFilters.vision !== 'all' && clan.vision !== clanFilters.vision) return false;
      if (clan.averageRating < clanFilters.reputation) return false;
      if (clanFilters.minMembers > 0 && clan.memberCount < clanFilters.minMembers) return false;
      if (clanFilters.thLevel > 0 && Math.floor(clan.avgTh) < clanFilters.thLevel) return false;
      return true;
    }).sort((a, b) => b.averageRating - a.averageRating);
  }, [initialClans, clanFilters]);

  const filteredPlayers = useMemo(() => {
    return initialPlayers.filter((player) => {
      if (playerFilters.searchTerm && !(player.displayName || player.name || '').toLowerCase().includes(playerFilters.searchTerm.toLowerCase()) && !(player.playerTag || player.tag || '').toLowerCase().includes(playerFilters.searchTerm.toLowerCase())) return false;
      if (playerFilters.role !== 'all' && player.role !== playerFilters.role) return false;
      if ((player.reputation || 0) < playerFilters.reputation) return false;
      if (playerFilters.thLevel > 0 && (player.thLevel || 0) < playerFilters.thLevel) return false;
      return true;
    }).sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
  }, [initialPlayers, playerFilters]);

  const clansToShow = filteredClans.slice(0, visibleClansCount);
  const playersToShow = filteredPlayers.slice(0, visiblePlayersCount);
  const publicClansToShow = publicClansCache.slice(0, visiblePublicClansCount);
  const clansToDisplayPublic = useMemo(() => {
    if (publicClanResult) return [publicClanResult];
    if (publicClanTag.trim() && !publicSearchError) return [];
    return publicClansToShow;
  }, [publicClanResult, publicClanTag, publicSearchError, publicClansToShow]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-20 text-white font-clash relative overflow-x-hidden">
        
        {/* --- GLOBAL ATMOSPHERE & BACKGROUNDS --- */}
        {/* 1. Base Dark Texture */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />
        {/* 2. Top Spotlight (Blue for TeamHub) */}
        <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-gradient-to-b from-[#1a2c4e] via-[#0f1520]/80 to-transparent blur-[120px] pointer-events-none z-0" />
        {/* 3. Bottom Accent */}
        <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-coc-gold/5 blur-[150px] rounded-full pointer-events-none z-0" />

        {/* MAIN CONTAINER */}
        <div className="container mx-auto px-4 md:px-8 pt-6 relative z-10 space-y-12">
            
            {/* Header Area */}
            <TeamHubHeader />

            {/* [BARU] Featured Section (Spotlight) */}
            <FeaturedSection />

            {/* 1. CONTROL CENTER CARD (Unified Tabs & Filters) */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <TeamHubTabNavigation activeTab={activeTab} onTabChange={handleTabChange}>
                    {/* Render Filter Content based on active tab */}
                    {activeTab !== 'publicClans' ? (
                        <TeamHubFilterBar
                            activeTab={activeTab}
                            clanFilters={clanFilters}
                            onClanFilterChange={handleClanFilterChange}
                            playerFilters={playerFilters}
                            onPlayerFilterChange={handlePlayerFilterChange}
                        />
                    ) : (
                        <PublicClanSearchFilter 
                            publicClanTag={publicClanTag}
                            onPublicClanTagChange={setPublicClanTag}
                            onSearchSubmit={handlePublicClanSearch}
                            isSearching={isSearchingPublicClan}
                            searchError={publicSearchError}
                        />
                    )}
                </TeamHubTabNavigation>
            </div>

            {/* 2. RESULTS CONTENT */}
            <div className="animate-in fade-in duration-700 delay-200 min-h-[500px]">
                {activeTab === 'clashubTeams' && (
                    <ClashubTeamsTab
                        isFiltering={isFiltering}
                        filteredClans={filteredClans}
                        clansToShow={clansToShow}
                        showLoadMoreClans={visibleClansCount < filteredClans.length}
                        onLoadMoreClans={() => setVisibleClansCount((prev) => prev + 6)}
                    />
                )}

                {activeTab === 'players' && (
                    <PlayersTab
                        isFiltering={isFiltering}
                        filteredPlayers={filteredPlayers}
                        playersToShow={playersToShow}
                        showLoadMorePlayers={visiblePlayersCount < filteredPlayers.length}
                        onLoadMorePlayers={() => setVisiblePlayersCount((prev) => prev + 6)}
                    />
                )}

                {activeTab === 'publicClans' && (
                    <PublicClansTab
                        publicClanTag={publicClanTag}
                        onPublicClanTagChange={setPublicClanTag} 
                        onSearchSubmit={handlePublicClanSearch}
                        isSearching={isSearchingPublicClan}
                        searchError={publicSearchError}
                        clansToDisplay={clansToDisplayPublic}
                        isSearchResult={!!publicClanResult}
                        totalCacheCount={publicClansCache.length}
                        showLoadMore={!publicClanResult && !publicClanTag.trim() && visiblePublicClansCount < publicClansCache.length}
                        onLoadMore={() => setVisiblePublicClansCount((prev) => prev + 6)}
                        visibleCount={visiblePublicClansCount}
                    />
                )}
            </div>
        </div>
    </div>
  );
};

export default TeamHubClient;