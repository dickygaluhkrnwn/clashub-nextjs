'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import TournamentFilter, { TournamentFilters } from '@/app/components/filters/TournamentFilter';
import { Button } from '@/app/components/ui/Button';
import { Tournament, FirestoreDocument, ThRequirement } from '@/lib/clashub.types';
import { 
  TrophyIcon, 
  CogsIcon, 
  FilterIcon, 
  EditIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SearchIcon,
  CalendarCheck2Icon,
  UsersIcon,
  ClockIcon
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; 
import { TournamentCardModern } from './components/TournamentCardModern';

interface TournamentClientProps {
  initialTournaments: FirestoreDocument<
    Omit<Tournament, 'thRequirement'> & { thRequirement?: ThRequirement }
  >[];
  error: string | null;
}

const ITEMS_PER_LOAD_TOURNAMENT = 6;

const TournamentClient = ({
  initialTournaments,
  error: serverError,
}: TournamentClientProps) => {
  const { t } = useLanguage(); 
  
  const [allTournaments] = useState(initialTournaments);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>('tournaments');

  const [tournamentFilters, setTournamentFiltersState] = useState<TournamentFilters>({
    status: t.tournament.filterStatusAll, 
    thLevel: t.clanHub.filterAllTh,
    prize: 'all',
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleTournamentsCount, setVisibleTournamentsCount] = useState(ITEMS_PER_LOAD_TOURNAMENT);
  const [isFiltering, setIsFiltering] = useState(false);

  // --- LOGIKA SLIDER HERO ---
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter turnamen untuk banner (Prioritas: Pendaftaran Buka -> Akan Datang -> Sedang Berlangsung)
  const featuredTournaments = useMemo(() => {
      const list = allTournaments.filter(t => 
        ['registration_open', 'scheduled', 'ongoing'].includes(t.status)
      );
      
      // Urutkan prioritas: Open > Scheduled > Ongoing
      list.sort((a, b) => {
        const priority: Record<string, number> = { registration_open: 0, scheduled: 1, ongoing: 2 };
        const statusA = a.status as string;
        const statusB = b.status as string;
        return (priority[statusA] || 3) - (priority[statusB] || 3);
      });

      // Jika tidak ada yang aktif, ambil turnamen terbaru apa saja sebagai fallback
      if (list.length === 0 && allTournaments.length > 0) {
        return [allTournaments[0]];
      }
      
      return list.slice(0, 5); // Ambil maksimal 5 turnamen untuk slider
  }, [allTournaments]);

  const activeFeatured = featuredTournaments[currentSlide];

  // Auto-slide setiap 6 detik
  useEffect(() => {
    if (featuredTournaments.length <= 1) return;
    const timer = setInterval(() => {
       setCurrentSlide(prev => (prev + 1) % featuredTournaments.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredTournaments.length]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % featuredTournaments.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + featuredTournaments.length) % featuredTournaments.length);

  // --- END LOGIKA SLIDER ---

  // Helper Format TH
  const formatThRequirementToString = useCallback((thReq: ThRequirement | undefined): string => {
    if (!thReq) return 'N/A';
    switch (thReq.type) {
      case 'uniform': return `TH ${thReq.allowedLevels[0]} Only`;
      case 'mixed': return `Mixed TH`; 
      case 'any':
      default:
        if (thReq.minLevel === 1 && thReq.maxLevel === 17) return "All Town Halls";
        if (thReq.minLevel === thReq.maxLevel) return `TH ${thReq.minLevel}`;
        return `TH ${thReq.minLevel}-${thReq.maxLevel}`;
    }
  }, [t]);

  const setTournamentFilters = (newFilters: TournamentFilters) => {
    setIsFiltering(true);
    setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT);
    setTimeout(() => {
      setTournamentFiltersState(newFilters);
      setIsFiltering(false);
    }, 300);
  };

  // Logic Filter Grid Bawah
  const filteredTournaments = useMemo(() => {
    return allTournaments.filter((tournament) => {
      const { status: filterStatus, thLevel, prize } = tournamentFilters;

      if (tournament.status === 'draft') return false;

      // Filter Logic
      if (filterStatus !== t.tournament.filterStatusAll) {
         if (filterStatus === t.tournament.filterStatusUpcoming && !['scheduled', 'registration_open', 'registration_closed'].includes(tournament.status)) return false;
         if (filterStatus === t.tournament.filterStatusOngoing && tournament.status !== 'ongoing') return false;
         if (filterStatus === t.tournament.filterStatusCompleted && !['completed', 'cancelled'].includes(tournament.status)) return false;
      }

      // TH Logic
      let thMatch = false;
      if (thLevel === t.clanHub.filterAllTh) thMatch = true;
      else if (tournament.thRequirement) {
        const thReq = tournament.thRequirement;
        const filterThNum = parseInt(thLevel.replace(/\D/g, ''), 10);
        if (isNaN(filterThNum)) thMatch = true;
        else thMatch = thReq.minLevel <= filterThNum || thReq.maxLevel >= filterThNum;
      }
      if (!thMatch) return false;

      // Prize Logic
      let prizeMatch = true;
      const prizeLower = tournament.prizePool.toLowerCase();
      if (prize === 'cash') prizeMatch = ['rp', 'juta', 'cash', '$'].some(k => prizeLower.includes(k));
      else if (prize === 'item') prizeMatch = ['item', 'pass', 'skin', 'gold'].some(k => prizeLower.includes(k));

      return prizeMatch;
    });
  }, [allTournaments, tournamentFilters, t]);

  const tournamentsToShow = useMemo(
    () => filteredTournaments.slice(0, visibleTournamentsCount),
    [filteredTournaments, visibleTournamentsCount],
  );

  // Helper Banner Status Badge
  const getStatusBadge = (status: string) => {
     switch(status) {
        case 'registration_open': return { label: 'PENDAFTARAN DIBUKA', color: 'bg-coc-green/10 text-coc-green border-coc-green/30' };
        case 'scheduled': return { label: 'AKAN DATANG', color: 'bg-coc-blue/10 text-coc-blue border-coc-blue/30' };
        case 'ongoing': return { label: 'SEDANG LIVE', color: 'bg-coc-red/10 text-coc-red border-coc-red/30 animate-pulse' };
        default: return { label: 'FEATURED', color: 'bg-coc-gold/10 text-coc-gold border-coc-gold/30' };
     }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white font-clash overflow-x-hidden pb-20">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[800px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-coc-gold/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* 1. HERO SLIDER SECTION */}
      {/* REVISI: Mengurangi padding top agar banner tidak mengambang jauh dari header */}
      <section className="relative z-10 pt-6 md:pt-8 pb-8 container mx-auto px-4 md:px-8">
        {activeFeatured && !serverError ? (
          <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group min-h-[450px] md:min-h-[500px]">
              
             {/* Banner Image with Slide Animation Key */}
             <div key={activeFeatured.id} className="absolute inset-0 animate-in fade-in zoom-in-105 duration-1000">
                <img 
                  src={activeFeatured.bannerUrl || '/images/banner-teamhub.png'} 
                  alt="Featured" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />
             </div>
             
             {/* Slider Navigation Controls (Desktop) */}
             {featuredTournaments.length > 1 && (
                <>
                  <button 
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-coc-gold hover:text-black hover:border-coc-gold transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-lg active:scale-95"
                  >
                      <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-coc-gold hover:text-black hover:border-coc-gold transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center shadow-lg active:scale-95"
                  >
                      <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
             )}

             {/* Content */}
             <div className="relative z-10 p-8 md:p-16 flex flex-col items-start justify-center h-full min-h-[450px]">
                
                {/* Status Badge */}
                <div className={`px-4 py-1.5 font-bold text-xs uppercase tracking-widest rounded-lg border backdrop-blur-md shadow-lg mb-6 flex items-center gap-2 ${getStatusBadge(activeFeatured.status).color}`}>
                   <TrophyIcon className="h-3 w-3 fill-current" />
                   {getStatusBadge(activeFeatured.status).label}
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 max-w-4xl leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                   {activeFeatured.title}
                </h1>
                
                <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-xl line-clamp-2 drop-shadow-md font-sans leading-relaxed">
                   {activeFeatured.description || "Bergabunglah dalam turnamen epik ini dan buktikan kemampuan klan Anda!"}
                </p>
                
                <div className="flex flex-wrap gap-4 mb-10">
                   <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                      <TrophyIcon className="h-5 w-5 text-coc-gold" />
                      <div>
                         <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Prize Pool</p>
                         <p className="text-white font-bold text-lg leading-none font-sans">{activeFeatured.prizePool}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                      <ClockIcon className="h-5 w-5 text-coc-blue" />
                      <div>
                         <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Start Date</p>
                         <p className="text-white font-bold text-lg leading-none font-sans">
                            {new Date(activeFeatured.tournamentStartsAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                         </p>
                      </div>
                   </div>
                </div>

                <Button href={`/tournament/${activeFeatured.id}`} variant="primary" size="lg" className="px-10 py-4 h-auto text-sm md:text-base shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] font-bold tracking-widest uppercase">
                   Lihat Detail <ChevronRightIcon className="ml-2 h-5 w-5" />
                </Button>
             </div>

             {/* Slider Indicators (Dots) */}
             {featuredTournaments.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                   {featuredTournaments.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${
                           currentSlide === idx 
                             ? 'w-10 bg-coc-gold shadow-[0_0_10px_#FFD700]' 
                             : 'w-2 bg-white/20 hover:bg-white/50'
                        }`}
                      />
                   ))}
                </div>
             )}
          </div>
        ) : (
           // Skeleton Loading Hero
           <div className="w-full h-[450px] rounded-3xl bg-[#15171e] animate-pulse border border-white/10 flex items-center justify-center shadow-xl">
              <TrophyIcon className="h-24 w-24 text-white/5" />
           </div>
        )}
      </section>

      {/* 2. STATS BAR */}
      <div className="container mx-auto px-4 md:px-8 mb-12 relative z-10">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { label: 'Total Turnamen', val: allTournaments.length, icon: TrophyIcon, color: 'text-coc-gold', bg: 'bg-coc-gold/10', border: 'border-coc-gold/20' },
               { label: 'Sedang Live', val: allTournaments.filter(t => t.status === 'ongoing').length, icon: CalendarCheck2Icon, color: 'text-coc-red', bg: 'bg-coc-red/10', border: 'border-coc-red/20' },
               { label: 'Total Hadiah', val: 'IDR ++', icon: TrophyIcon, color: 'text-coc-green', bg: 'bg-coc-green/10', border: 'border-coc-green/20' }, 
               { label: 'Komunitas', val: 'Active', icon: UsersIcon, color: 'text-coc-blue', bg: 'bg-coc-blue/10', border: 'border-coc-blue/20' },
            ].map((stat, idx) => (
               <div key={idx} className="bg-[#15171e]/90 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                     <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                     <p className="text-2xl font-bold text-white leading-none font-clash">{stat.val}</p>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* === SIDEBAR FILTER (Sticky) === */}
          <aside className="lg:col-span-1 h-fit lg:sticky lg:top-24 space-y-6 z-20">
             <div className="lg:hidden mb-4">
                <Button 
                  variant="secondary" 
                  className="w-full flex justify-between bg-[#15171e] border-white/10 text-white"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                   <span className="flex items-center gap-2"><FilterIcon className="h-4 w-4"/> Filter Tournaments</span>
                   <ChevronRightIcon className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
                </Button>
             </div>
             
             <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block animate-in slide-in-from-top-2`}>
                <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-gold via-transparent to-transparent opacity-50" />
                   <TournamentFilter
                     filters={tournamentFilters}
                     onFilterChange={setTournamentFilters}
                   />
                </div>
             </div>
          </aside>

          {/* === MAIN CONTENT === */}
          <section className="lg:col-span-3 space-y-8">
             
             {/* Tabs & Search Header */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
                <div className="flex p-1.5 bg-[#15171e] rounded-xl border border-white/5 shadow-inner">
                   <button
                     onClick={() => setActiveTab('tournaments')}
                     className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                       activeTab === 'tournaments' ? 'bg-[#252830] text-white shadow-md border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'
                     }`}
                   >
                     Tournaments
                   </button>
                   <button
                     onClick={() => setActiveTab('leagues')}
                     className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                       activeTab === 'leagues' ? 'bg-[#252830] text-coc-gold shadow-md border border-coc-gold/20' : 'text-gray-500 hover:text-white hover:bg-white/5'
                     }`}
                   >
                     Leagues
                   </button>
                </div>
                
                <div className="text-xs text-gray-400 font-mono bg-[#15171e] px-4 py-2 rounded-full border border-white/5">
                   Showing <span className="text-white font-bold">{tournamentsToShow.length}</span> competitions
                </div>
             </div>

             {/* Grid Content */}
             {activeTab === 'tournaments' ? (
               <>
                  {isFiltering ? (
                     <div className="py-32 text-center animate-pulse flex flex-col items-center">
                        <div className="relative mb-6">
                           <div className="absolute inset-0 bg-coc-gold/20 blur-xl rounded-full" />
                           <CogsIcon className="h-16 w-16 text-coc-gold animate-spin relative z-10" />
                        </div>
                        <p className="text-white tracking-[0.3em] uppercase text-sm font-bold font-clash">FILTERING DATA...</p>
                     </div>
                  ) : tournamentsToShow.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tournamentsToShow.map((t) => (
                           <div key={t.id} className="transform transition-transform hover:-translate-y-1 duration-300">
                             <TournamentCardModern 
                                tournament={t as unknown as Tournament}
                                thRequirementText={formatThRequirementToString(t.thRequirement)}
                             />
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="py-32 text-center bg-[#15171e]/50 border border-white/5 rounded-3xl border-dashed flex flex-col items-center">
                        <div className="p-6 bg-[#0a0a0b] rounded-full border border-white/5 mb-6 shadow-xl">
                            <SearchIcon className="h-12 w-12 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-clash text-white font-bold mb-2 tracking-wide">No Tournaments Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">We couldn't find any tournaments matching your current filters. Try adjusting them or check back later.</p>
                        <Button 
                           variant="outline" 
                           className="mt-8 border-white/10 hover:bg-white/5"
                           onClick={() => setTournamentFilters({ status: t.tournament.filterStatusAll, thLevel: t.clanHub.filterAllTh, prize: 'all' })}
                        >
                           RESET FILTERS
                        </Button>
                     </div>
                  )}

                  {/* Load More */}
                  {visibleTournamentsCount < filteredTournaments.length && !isFiltering && (
                     <div className="text-center pt-8 pb-12">
                        <Button 
                           variant="secondary" 
                           onClick={() => setVisibleTournamentsCount(p => p + ITEMS_PER_LOAD_TOURNAMENT)}
                           className="px-10 py-4 bg-[#15171e] border-white/10 hover:bg-[#1a1d26] hover:border-coc-gold/30 text-white font-bold tracking-widest uppercase shadow-lg"
                        >
                           LOAD MORE
                        </Button>
                     </div>
                  )}
               </>
             ) : (
               <div className="py-40 text-center bg-[#15171e]/50 border border-white/5 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-coc-gold/5 to-transparent opacity-50 pointer-events-none" />
                  <TrophyIcon className="h-24 w-24 text-coc-gold/20 mb-6" />
                  <h2 className="text-3xl font-clash font-bold text-white mb-3 uppercase tracking-wide">League System</h2>
                  <p className="text-gray-400 font-sans tracking-wide">Coming Soon. Prepare for glory.</p>
               </div>
             )}

          </section>
        </div>
      </div>

      {/* FAB Create Tournament */}
      <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <Button
          href="/tournament/create"
          variant="primary"
          className="rounded-2xl w-16 h-16 p-0 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-gradient-to-br from-coc-gold to-yellow-600 relative group"
          title={t.clanEsports.createTeam}
        >
          <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
          <EditIcon className="h-8 w-8 text-[#0a0a0b] relative z-10 drop-shadow-sm" />
        </Button>
      </div>
    </div>
  );
};

export default TournamentClient;