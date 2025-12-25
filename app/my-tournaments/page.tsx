import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { Button } from '@/app/components/ui/Button';
import { PlusIcon, InfoIcon, TrophyIcon, EditIcon, SettingsIcon } from '@/app/components/icons'; 
import { Query } from 'firebase-admin/firestore';

// --- [Komponen Internal] Kartu Turnamen untuk Manajemen ---
type ManagementCardProps = {
  tournament: FirestoreDocument<Tournament>;
};

const ManagementTournamentCard = ({ tournament }: ManagementCardProps) => {
  const { id, title, status, thRequirement, prizePool } = tournament;

  // Helper untuk memformat status
  const getStatusInfo = (status: Tournament['status']): {
    text: string;
    styles: string;
    badgeStyles: string;
  } => {
    switch (status) {
      case 'registration_open':
        return {
          text: 'Pendaftaran Dibuka',
          styles: 'border-l-4 border-coc-green hover:shadow-coc-green/10',
          badgeStyles: 'bg-coc-green/10 text-coc-green border-coc-green/20',
        };
      case 'registration_closed':
        return {
          text: 'Pendaftaran Ditutup',
          styles: 'border-l-4 border-coc-blue hover:shadow-coc-blue/10',
          badgeStyles: 'bg-coc-blue/10 text-coc-blue border-coc-blue/20',
        };
      case 'ongoing':
        return {
          text: 'Sedang Berlangsung',
          styles: 'border-l-4 border-coc-red hover:shadow-coc-red/10',
          badgeStyles: 'bg-coc-red/10 text-coc-red border-coc-red/20 animate-pulse',
        };
      case 'completed':
        return {
          text: 'Selesai',
          styles: 'border-l-4 border-purple-500 hover:shadow-purple-500/10 opacity-80',
          badgeStyles: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
      case 'cancelled':
        return {
           text: 'Dibatalkan',
           styles: 'border-l-4 border-red-700 hover:shadow-red-900/10 opacity-60',
           badgeStyles: 'bg-red-900/20 text-red-400 border-red-700/30',
        }
      case 'draft':
      case 'scheduled':
      default:
        return {
          text: 'Draft / Terjadwal',
          styles: 'border-l-4 border-gray-500 hover:shadow-gray-500/10',
          badgeStyles: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
    }
  };

  // Helper untuk memformat TH Requirement
  const formatThRequirement = (req: Tournament['thRequirement']): string => {
    if (req.type === 'any') {
      return `TH ${req.minLevel} - ${req.maxLevel}`;
    }
    if (req.type === 'uniform') {
      return `Seragam TH ${req.allowedLevels[0]}`;
    }
    if (req.type === 'mixed') {
      const counts: { [key: number]: number } = {};
      req.allowedLevels.forEach((th) => (counts[th] = (counts[th] || 0) + 1));
      return Object.keys(counts)
        .map(Number)
        .sort((a, b) => b - a)
        .map((th) => `${counts[th]}x TH${th}`)
        .join(', ');
    }
    return 'Kustom';
  };

  const statusInfo = getStatusInfo(status);
  const thReqText = formatThRequirement(thRequirement);

  return (
    <div
      className={`bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-black/50 group ${statusInfo.styles}`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        {/* Info Utama */}
        <div className="flex-grow space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
             <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${statusInfo.badgeStyles}`}>
                {statusInfo.text}
             </span>
             <span className="text-xs font-mono text-gray-500">ID: {id}</span>
          </div>
          
          <h4 className="font-clash text-2xl font-bold text-white group-hover:text-coc-gold transition-colors">
            {title}
          </h4>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-sans">
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-coc-blue" />
               <span>Syarat: <span className="text-gray-300 font-semibold">{thReqText}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-coc-gold" />
               <span>Hadiah: <span className="text-coc-gold font-semibold">{prizePool}</span></span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Button href={`/tournament/${id}`} variant="outline" size="sm" className="w-full sm:w-auto border-white/10 hover:bg-white/5">
             <InfoIcon className="h-4 w-4 mr-2" /> Detail
          </Button>
          <Button href={`/tournament/${id}/manage`} variant="primary" size="sm" className="w-full sm:w-auto shadow-lg shadow-coc-gold/10">
             <SettingsIcon className="h-4 w-4 mr-2" /> Kelola
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- [Fungsi Fetch Data Server] ---
async function getManagedTournaments(
  userId: string,
): Promise<FirestoreDocument<Tournament>[]> {
  const tournamentsRef = adminFirestore.collection(
    COLLECTIONS.TOURNAMENTS,
  ) as unknown as Query<Tournament>;

  // Query 1: Dimana user adalah organizer
  const organizerQuery = tournamentsRef.where('organizerUid', '==', userId);
  // Query 2: Dimana user adalah panitia
  const committeeQuery = tournamentsRef.where(
    'committeeUids',
    'array-contains',
    userId,
  );

  try {
    const [organizerSnap, committeeSnap] = await Promise.all([
      organizerQuery.get(),
      committeeQuery.get(),
    ]);

    const tournamentsMap = new Map<string, FirestoreDocument<Tournament>>();

    organizerSnap.docs.forEach((doc) => {
      const data = docToDataAdmin<Tournament>(doc);
      if (data) tournamentsMap.set(doc.id, data);
    });

    committeeSnap.docs.forEach((doc) => {
      const data = docToDataAdmin<Tournament>(doc);
      if (data) tournamentsMap.set(doc.id, data);
    });

    const combinedList = Array.from(tournamentsMap.values());
    
    // Sort by start date (newest first)
    combinedList.sort((a, b) => {
        const timeA = a.tournamentStartsAt ? a.tournamentStartsAt.getTime() : 0;
        const timeB = b.tournamentStartsAt ? b.tournamentStartsAt.getTime() : 0;
        return timeB - timeA; 
    });

    return combinedList;
  } catch (error) {
    console.error('Firestore Error [getManagedTournaments]:', error);
    return [];
  }
}

// --- [Halaman Utama] ---
export default async function MyTournamentsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/auth');
  }

  const tournaments = await getManagedTournaments(sessionUser.uid);

  return (
    <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden">
       {/* Background Ambience */}
       <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
       
       <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
             <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                   <TrophyIcon className="h-8 w-8 text-coc-gold" />
                   Manajemen Turnamen
                </h1>
                <p className="text-gray-400 font-sans max-w-md">
                   Kelola turnamen yang Anda buat atau panitiai di sini.
                </p>
             </div>
             
             <Button href="/tournament/create" variant="primary" size="lg" className="shadow-xl shadow-coc-gold/20">
                <PlusIcon className="h-5 w-5 mr-2" />
                Buat Turnamen Baru
             </Button>
          </div>

          {/* Konten */}
          {tournaments.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-2xl">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <InfoIcon className="h-12 w-12 text-gray-600" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">
                  Belum Ada Turnamen
               </h3>
               <p className="text-gray-400 max-w-lg mb-8 font-sans leading-relaxed">
                  Anda belum mengelola turnamen apapun saat ini. Mulailah dengan membuat turnamen baru untuk komunitas Anda!
               </p>
               <Button href="/tournament/create" variant="outline" className="border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10">
                  Mulai Buat Turnamen
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
               {tournaments.map((tournament) => (
                  <ManagementTournamentCard
                     key={tournament.id}
                     tournament={tournament}
                  />
               ))}
            </div>
          )}
       </div>
    </div>
  );
}