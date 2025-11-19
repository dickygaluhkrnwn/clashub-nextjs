'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ManagedClan,
  Player,
  PublicClanIndex,
  RecommendedTeam,
} from '@/lib/types';

import { TeamHubHeader } from './components/TeamHubHeader';
import { TeamHubTabNavigation } from './components/TeamHubTabNavigation';
import { TeamHubFilterBar } from './components/TeamHubFilterBar';
import { ClashubTeamsTab } from './components/ClashubTeamsTab';
import { PublicClansTab } from './components/PublicClansTab';
import { PlayersTab } from './components/PlayersTab';

import { ShieldIcon, UserIcon, GlobeIcon } from '@/app/components/icons';

// Definisikan tipe filter
export type ManagedClanFilters = {
  searchTerm: string; // [FIX] Mengubah 'search' menjadi 'searchTerm' agar sesuai dengan TeamHubFilter
  thLevel: string;
  minMembers: number;
  vision: 'all' | 'Kompetitif' | 'Kasual';
  reputation: number;
};

export type PlayerFilters = {
  searchTerm: string;
  role: 'all' | 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  reputation: number;
  thLevel: number;
};

// Tipe ActiveTab
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('clashubTeams');

  // State Filter
  const [clanFilters, setClanFilters] = useState<ManagedClanFilters>({
    searchTerm: '', // [FIX] Menggunakan searchTerm
    thLevel: 'all',
    minMembers: 0,
    vision: 'all',
    reputation: 0, 
  });

  const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
    searchTerm: '',
    role: 'all',
    reputation: 0,
    thLevel: 0,
  });

  // State Load More & Filtering
  const [isFiltering, setIsFiltering] = useState(false);
  const [visibleClansCount, setVisibleClansCount] = useState(6);
  const [visiblePlayersCount, setVisiblePlayersCount] = useState(6);
  const [visiblePublicClansCount, setVisiblePublicClansCount] = useState(6);

  // State Pencarian Klan Publik
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
    // Reset filter saat ganti tab
    setClanFilters({
        searchTerm: '', // [FIX] Reset searchTerm
        thLevel: 'all',
        minMembers: 0,
        vision: 'all',
        reputation: 0,
    });
    setPlayerFilters({
        searchTerm: '',
        role: 'all',
        reputation: 0,
        thLevel: 0,
    });
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


  // --- FILTER LOGIC (CLANS) ---
  const filteredClans = useMemo(() => {
    return initialClans.filter((clan) => {
      // 1. Search
      if (
        clanFilters.searchTerm && // [FIX] Menggunakan searchTerm
        !clan.name.toLowerCase().includes(clanFilters.searchTerm.toLowerCase()) &&
        !clan.tag.toLowerCase().includes(clanFilters.searchTerm.toLowerCase())
      ) {
        return false;
      }
      // 2. Vision
      if (
        clanFilters.vision !== 'all' &&
        clan.vision !== clanFilters.vision
      ) {
        return false;
      }
      // 3. Reputation (Average Rating)
      if (clan.averageRating < clanFilters.reputation) {
        return false;
      }
      
      return true;
    }).sort((a, b) => b.averageRating - a.averageRating);
  }, [initialClans, clanFilters]);

  // --- FILTER LOGIC (PLAYERS) ---
  const filteredPlayers = useMemo(() => {
    return initialPlayers.filter((player) => {
      // 1. Search
      if (
        playerFilters.searchTerm &&
        !(player.displayName || player.name || '')
          .toLowerCase()
          .includes(playerFilters.searchTerm.toLowerCase()) &&
        !(player.playerTag || player.tag || '')
          .toLowerCase()
          .includes(playerFilters.searchTerm.toLowerCase())
      ) {
        return false;
      }
      // 2. Role
      if (
        playerFilters.role !== 'all' &&
        player.role !== playerFilters.role
      ) {
        return false;
      }
      // 3. Reputation
      const playerRep = player.reputation || 0;
      if (playerRep < playerFilters.reputation) {
        return false;
      }
      // 4. TH Level
      if (
        playerFilters.thLevel > 0 &&
        (player.thLevel || 0) < playerFilters.thLevel
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
  }, [initialPlayers, playerFilters]);

  const publicClansDataSource = publicClansCache;

  // --- HANDLERS ---
  const handleClanFilterChange = (newFilters: ManagedClanFilters) => {
    setIsFiltering(true);
    setVisibleClansCount(6); // Reset pagination
    setTimeout(() => {
      setClanFilters(newFilters);
      setIsFiltering(false);
    }, 300);
  };

  const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
    setIsFiltering(true);
    setVisiblePlayersCount(6); // Reset pagination
    setTimeout(() => {
      setPlayerFilters(newFilters);
      setIsFiltering(false);
    }, 300);
  };

  const handlePublicClanSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const rawTag = publicClanTag.toUpperCase().trim();
      if (!rawTag) {
        setPublicClanResult(null);
        setPublicSearchError(null);
        setVisiblePublicClansCount(6);
        return;
      }

      setIsSearchingPublicClan(true);
      setPublicSearchError(null);
      setPublicClanResult(null);

      const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
      const encodedTag = encodeURIComponent(tagToSearch);

      try {
        const response = await fetch(
          `/api/coc/search-clan?clanTag=${encodedTag}`,
        );
        let result: any;
        try {
            result = await response.json();
        } catch (jsonError) {
             throw new Error(`Failed to parse response.`);
        }

        if (!response.ok) {
          setPublicSearchError(
            response.status === 404
              ? `Klan dengan tag ${tagToSearch} tidak ditemukan.`
              : result.error || 'Gagal mengambil data.'
          );
          return;
        }

        if (result && result.clan) {
          setPublicClanResult(result.clan);
        } else {
          setPublicSearchError('Format respons tidak valid.');
        }
      } catch (error) {
        setPublicSearchError('Terjadi kesalahan saat mencari klan.');
      } finally {
        setIsSearchingPublicClan(false);
      }
    },
    [publicClanTag],
  );


  // --- RENDER HELPERS ---
  const clansToShow = filteredClans.slice(0, visibleClansCount);
  const playersToShow = filteredPlayers.slice(0, visiblePlayersCount);
  const publicClansToShow = publicClansDataSource.slice(0, visiblePublicClansCount);

  const clansToDisplayPublic = useMemo(() => {
    if (publicClanResult) {
      return [publicClanResult];
    }
    if (publicClanTag.trim() && !publicSearchError) {
      return [];
    }
    return publicClansToShow;
  }, [publicClanResult, publicClanTag, publicSearchError, publicClansToShow]);

  return (
    <div className="min-h-screen bg-coc-dark pb-20">
      <TeamHubHeader />

      <div className="container mx-auto p-4 md:p-8 -mt-8 relative z-10">
        <div className="card-stone p-6 md:p-8 rounded-xl shadow-2xl border border-coc-gold-dark/30">
          
          {/* Tab Navigation */}
          <TeamHubTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <div className="mt-8">
            {/* Konten Tab */}
            {activeTab === 'publicClans' ? (
                <PublicClansTab
                    publicClanTag={publicClanTag}
                    onPublicClanTagChange={setPublicClanTag}
                    onSearchSubmit={handlePublicClanSearch}
                    isSearching={isSearchingPublicClan}
                    searchError={publicSearchError}
                    clansToDisplay={clansToDisplayPublic}
                    isSearchResult={!!publicClanResult}
                    totalCacheCount={publicClansDataSource.length}
                    showLoadMore={
                        !publicClanResult &&
                        !publicClanTag.trim() &&
                        visiblePublicClansCount < publicClansDataSource.length
                    }
                    onLoadMore={() => setVisiblePublicClansCount((prev) => prev + 6)}
                    visibleCount={visiblePublicClansCount}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:items-start">
                    {/* Filter Sidebar */}
                    <TeamHubFilterBar
                        activeTab={activeTab}
                        clanFilters={clanFilters}
                        onClanFilterChange={handleClanFilterChange}
                        playerFilters={playerFilters}
                        onPlayerFilterChange={handlePlayerFilterChange}
                    />

                    {/* Konten Utama */}
                    <div className="lg:col-span-3">
                        {activeTab === 'clashubTeams' && (
                            <ClashubTeamsTab
                                isFiltering={isFiltering}
                                filteredClans={filteredClans}
                                clansToShow={clansToShow}
                                showLoadMoreClans={visibleClansCount < filteredClans.length}
                                onLoadMoreClans={() =>
                                    setVisibleClansCount((prev) => prev + 6)
                                }
                            />
                        )}

                        {activeTab === 'players' && (
                            <PlayersTab
                                isFiltering={isFiltering}
                                filteredPlayers={filteredPlayers}
                                playersToShow={playersToShow}
                                showLoadMorePlayers={
                                    visiblePlayersCount < filteredPlayers.length
                                }
                                onLoadMorePlayers={() =>
                                    setVisiblePlayersCount((prev) => prev + 6)
                                }
                            />
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamHubClient;