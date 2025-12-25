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
  ChevronLeftIcon, // [BARU] Import ikon kiri
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
        const priority = { registration_open: 0, scheduled: 1, ongoing: 2 };
        // @ts-ignore - status string aman
        return (priority[a.status] || 3) - (priority[b.status] || 3);
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
        case 'registration_open': return { label: 'PENDAFTARAN DIBUKA', color: 'bg-coc-green text-coc-stone-dark border-coc-green' };
        case 'scheduled': return { label: 'AKAN DATANG', color: 'bg-coc-blue text-white border-coc-blue' };
        case 'ongoing': return { label: 'SEDANG LIVE', color: 'bg-coc-red text-white border-coc-red animate-pulse' };
        default: return { label: 'FEATURED', color: 'bg-coc-gold text-coc-stone-dark border-coc-gold' };
     }
  };

  return (
    <div className="relative min-h-screen bg-coc-dark text-white font-clash overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[800px] bg-gradient-to-b from-coc-blue/20 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-coc-gold/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* 1. HERO SLIDER SECTION */}
      <section className="relative z-10 pt-10 pb-8 container mx-auto px-4 md:px-8">
        {activeFeatured && !serverError ? (
          <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group min-h-[450px] md:min-h-[500px]">
             
             {/* Banner Image with Slide Animation Key */}
             <div key={activeFeatured.id} className="absolute inset-0 animate-in fade-in zoom-in-105 duration-700">
                <img 
                  src={activeFeatured.bannerUrl || '/images/banner-teamhub.png'} 
                  alt="Featured" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-coc-dark via-coc-dark/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-coc-dark via-transparent to-transparent" />
             </div>
             
             {/* Slider Navigation Controls (Desktop) */}
             {featuredTournaments.length > 1 && (
                <>
                  <button 
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-coc-gold/20 hover:border-coc-gold/50 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                  >
                     <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-coc-gold/20 hover:border-coc-gold/50 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                  >
                     <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
             )}

             {/* Content */}
             <div className="relative z-10 p-8 md:p-16 flex flex-col items-start justify-center h-full min-h-[450px]">
                
                {/* Status Badge */}
                <span className={`px-4 py-1.5 font-bold text-xs uppercase tracking-widest rounded-lg border backdrop-blur-md shadow-lg mb-6 ${getStatusBadge(activeFeatured.status).color}`}>
                   {getStatusBadge(activeFeatured.status).label}
                </span>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 max-w-4xl leading-tight drop-shadow-2xl">
                   {activeFeatured.title}
                </h1>
                
                <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-xl line-clamp-2 drop-shadow-md">
                   {activeFeatured.description || "Bergabunglah dalam turnamen epik ini dan buktikan kemampuan klan Anda!"}
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                   <div className="flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                      <TrophyIcon className="h-6 w-6 text-coc-gold" />
                      <div>
                         <p className="text-[10px] text-gray-400 uppercase font-bold">Prize Pool</p>
                         <p className="text-white font-bold text-lg leading-none">{activeFeatured.prizePool}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                      <ClockIcon className="h-6 w-6 text-coc-blue" />
                      <div>
                         <p className="text-[10px] text-gray-400 uppercase font-bold">Mulai</p>
                         <p className="text-white font-bold text-lg leading-none">
                            {new Date(activeFeatured.tournamentStartsAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                         </p>
                      </div>
                   </div>
                </div>

                <Button href={`/tournament/${activeFeatured.id}`} variant="primary" size="lg" className="px-10 py-7 text-lg shadow-xl shadow-coc-gold/20 font-bold tracking-wide">
                   Lihat Detail <ChevronRightIcon className="ml-2 h-5 w-5" />
                </Button>
             </div>

             {/* Slider Indicators (Dots) */}
             {featuredTournaments.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                   {featuredTournaments.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                           currentSlide === idx 
                             ? 'w-8 bg-coc-gold shadow-[0_0_10px_#FFD700]' 
                             : 'w-2 bg-white/30 hover:bg-white/60'
                        }`}
                      />
                   ))}
                </div>
             )}
          </div>
        ) : (
           // Skeleton Loading Hero
           <div className="w-full h-[450px] rounded-3xl bg-white/5 animate-pulse border border-white/10 flex items-center justify-center">
              <TrophyIcon className="h-20 w-20 text-white/10" />
           </div>
        )}
      </section>

      {/* 2. STATS BAR */}
      <div className="container mx-auto px-4 md:px-8 mb-10 relative z-10">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { label: 'Total Turnamen', val: allTournaments.length, icon: TrophyIcon, color: 'text-coc-gold' },
               { label: 'Sedang Live', val: allTournaments.filter(t => t.status === 'ongoing').length, icon: CalendarCheck2Icon, color: 'text-coc-red' },
               { label: 'Total Hadiah', val: 'IDR ++', icon: TrophyIcon, color: 'text-coc-green' }, 
               { label: 'Komunitas', val: 'Active', icon: UsersIcon, color: 'text-coc-blue' },
            ].map((stat, idx) => (
               <div key={idx} className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className={`p-3 rounded-full bg-white/5 ${stat.color}`}>
                     <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-2xl font-bold text-white leading-none">{stat.val}</p>
                     <p className="text-xs text-gray-500 font-bold uppercase mt-1">{stat.label}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* === SIDEBAR FILTER (Sticky) === */}
          <aside className="lg:col-span-1 h-fit lg:sticky lg:top-24 space-y-6">
             <div className="lg:hidden mb-4">
                <Button 
                  variant="secondary" 
                  className="w-full flex justify-between"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                   <span className="flex items-center gap-2"><FilterIcon className="h-4 w-4"/> Filter</span>
                   <ChevronRightIcon className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
                </Button>
             </div>
             
             <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block`}>
                <TournamentFilter
                  filters={tournamentFilters}
                  onFilterChange={setTournamentFilters}
                />
             </div>
          </aside>

          {/* === MAIN CONTENT === */}
          <section className="lg:col-span-3 space-y-8">
             
             {/* Tabs & Search */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/10 pb-4">
                <div className="flex p-1 bg-black/40 backdrop-blur border border-white/10 rounded-xl">
                   <button
                     onClick={() => setActiveTab('tournaments')}
                     className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                       activeTab === 'tournaments' ? 'bg-coc-gold text-coc-dark shadow-lg' : 'text-gray-400 hover:text-white'
                     }`}
                   >
                     Turnamen
                   </button>
                   <button
                     onClick={() => setActiveTab('leagues')}
                     className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                       activeTab === 'leagues' ? 'bg-coc-gold text-coc-dark shadow-lg' : 'text-gray-400 hover:text-white'
                     }`}
                   >
                     Liga
                   </button>
                </div>
                
                <div className="text-sm text-gray-400">
                   Menampilkan <span className="text-white font-bold">{tournamentsToShow.length}</span> kompetisi
                </div>
             </div>

             {/* Grid Content */}
             {activeTab === 'tournaments' ? (
                <>
                   {isFiltering ? (
                      <div className="py-20 text-center animate-pulse">
                         <CogsIcon className="h-12 w-12 text-coc-gold mx-auto mb-4 animate-spin" />
                         <p className="text-gray-400 tracking-widest uppercase text-sm font-bold">Memfilter Data...</p>
                      </div>
                   ) : tournamentsToShow.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {tournamentsToShow.map((t) => (
                            <TournamentCardModern 
                               key={t.id} 
                               tournament={t as unknown as Tournament} // [FIX] Added casting
                               thRequirementText={formatThRequirementToString(t.thRequirement)}
                            />
                         ))}
                      </div>
                   ) : (
                      <div className="py-20 text-center bg-black/20 border border-white/5 rounded-3xl border-dashed">
                         <SearchIcon className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                         <h3 className="text-2xl text-white font-bold mb-2">Tidak Ada Turnamen</h3>
                         <p className="text-gray-500">Coba ubah filter atau cek kembali nanti.</p>
                      </div>
                   )}

                   {/* Load More */}
                   {visibleTournamentsCount < filteredTournaments.length && (
                      <div className="text-center pt-8">
                         <Button variant="secondary" onClick={() => setVisibleTournamentsCount(p => p + ITEMS_PER_LOAD_TOURNAMENT)}>
                            Muat Lebih Banyak
                         </Button>
                      </div>
                   )}
                </>
             ) : (
                <div className="py-32 text-center bg-black/20 border border-white/5 rounded-3xl">
                   <TrophyIcon className="h-20 w-20 text-coc-gold/20 mx-auto mb-6" />
                   <h2 className="text-3xl font-bold text-white mb-2">Musim Liga Segera Hadir</h2>
                   <p className="text-gray-400">Sistem liga kompetitif sedang dalam tahap persiapan.</p>
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
          className="rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-coc-stone relative group"
          title={t.clanEsports.createTeam}
        >
          <div className="absolute inset-0 bg-coc-gold/20 rounded-full animate-ping opacity-75 group-hover:opacity-100" />
          <EditIcon className="h-8 w-8 text-coc-gold relative z-10" />
        </Button>
      </div>
    </div>
  );
};

export default TournamentClient;