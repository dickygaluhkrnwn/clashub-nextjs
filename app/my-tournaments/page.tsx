import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { Button } from '@/app/components/ui/Button';
import { PlusIcon, InfoIcon, TrophyIcon, EditIcon, SettingsIcon, CalendarCheck2Icon, ShieldIcon } from '@/app/components/icons'; 
import { Query } from 'firebase-admin/firestore';

// --- [Komponen Internal] Kartu Turnamen untuk Manajemen ---
type ManagementCardProps = {
  tournament: FirestoreDocument<Tournament>;
};

const ManagementTournamentCard = ({ tournament }: ManagementCardProps) => {
  const { id, title, status, thRequirement, prizePool } = tournament;

  // Helper untuk memformat status dengan Gaming Style
  const getStatusInfo = (status: Tournament['status']): {
    text: string;
    styles: string;
    badgeStyles: string;
    icon: React.ReactNode;
  } => {
    switch (status) {
      case 'registration_open':
        return {
          text: 'Open Registration',
          styles: 'border-coc-green/30 hover:border-coc-green/60 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]',
          badgeStyles: 'bg-coc-green/10 text-coc-green border-coc-green/20',
          icon: <EditIcon className="h-4 w-4" />
        };
      case 'registration_closed':
        return {
          text: 'Reg Closed',
          styles: 'border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]',
          badgeStyles: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          icon: <ShieldIcon className="h-4 w-4" />
        };
      case 'ongoing':
        return {
          text: 'Live Now',
          styles: 'border-coc-red/30 hover:border-coc-red/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
          badgeStyles: 'bg-coc-red/10 text-coc-red border-coc-red/20 animate-pulse',
          icon: <TrophyIcon className="h-4 w-4" />
        };
      case 'completed':
        return {
          text: 'Completed',
          styles: 'border-purple-500/30 hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
          badgeStyles: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <TrophyIcon className="h-4 w-4" />
        };
      case 'cancelled':
        return {
           text: 'Cancelled',
           styles: 'border-gray-600/30 hover:border-gray-500/60 opacity-70 hover:opacity-100',
           badgeStyles: 'bg-gray-700/20 text-gray-400 border-gray-600/30',
           icon: <InfoIcon className="h-4 w-4" />
        }
      case 'draft':
      case 'scheduled':
      default:
        return {
          text: 'Upcoming / Draft',
          styles: 'border-coc-blue/30 hover:border-coc-blue/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
          badgeStyles: 'bg-coc-blue/10 text-coc-blue border-coc-blue/20',
          icon: <CalendarCheck2Icon className="h-4 w-4" />
        };
    }
  };

  // Helper untuk memformat TH Requirement
  const formatThRequirement = (req: Tournament['thRequirement']): string => {
    if (req.type === 'any') {
      return `TH ${req.minLevel} - ${req.maxLevel}`;
    }
    if (req.type === 'uniform') {
      return `TH ${req.allowedLevels[0]} Only`;
    }
    if (req.type === 'mixed') {
      return `Mixed TH`;
    }
    return 'Custom';
  };

  const statusInfo = getStatusInfo(status);
  const thReqText = formatThRequirement(thRequirement);

  return (
    <div
      className={`group relative bg-[#15171e]/90 backdrop-blur-xl border p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden ${statusInfo.styles}`}
    >
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${statusInfo.styles.includes('red') ? 'bg-coc-red' : statusInfo.styles.includes('green') ? 'bg-coc-green' : 'bg-coc-blue'}`} />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
           <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${statusInfo.badgeStyles}`}>
              {statusInfo.icon}
              {statusInfo.text}
           </span>
           <span className="text-[10px] font-mono text-gray-500 bg-[#0a0a0b] px-2 py-1 rounded border border-white/5">
              ID: {id.slice(0, 6)}...
           </span>
        </div>
        
        <h4 className="font-clash text-2xl font-bold text-white group-hover:text-coc-gold transition-colors line-clamp-2 leading-tight mb-4">
          {title}
        </h4>
        
        <div className="flex flex-wrap gap-4 text-xs font-sans text-gray-400 bg-[#0a0a0b]/50 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5">
             <ShieldIcon className="h-3.5 w-3.5 text-coc-blue" />
             <span>Req: <span className="text-gray-200 font-bold">{thReqText}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
             <TrophyIcon className="h-3.5 w-3.5 text-coc-gold" />
             <span>Prize: <span className="text-coc-gold font-bold">{prizePool}</span></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
        <Button href={`/tournament/${id}`} variant="outline" size="sm" className="flex-1 border-white/10 hover:bg-white/5 text-gray-300 hover:text-white">
           <InfoIcon className="h-4 w-4 mr-2" /> Detail
        </Button>
        <Button href={`/tournament/${id}/manage`} variant="primary" size="sm" className="flex-1 shadow-lg shadow-coc-gold/10 font-bold">
           <SettingsIcon className="h-4 w-4 mr-2" /> Manage
        </Button>
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
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden pb-20">
       {/* Background Ambience */}
       <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
       <div className="fixed top-20 right-0 w-[600px] h-[600px] bg-coc-gold/5 blur-[120px] pointer-events-none z-0" />
       
       <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
             <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 flex items-center gap-3 uppercase tracking-wide drop-shadow-md">
                   <div className="p-2 bg-coc-gold/10 rounded-xl border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                      <TrophyIcon className="h-8 w-8 text-coc-gold" />
                   </div>
                   Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-coc-gold to-yellow-200">Hub</span>
                </h1>
                <p className="text-gray-400 font-sans max-w-lg text-sm md:text-base leading-relaxed">
                   Kelola turnamen yang Anda buat atau ikuti sebagai panitia. Atur jadwal, bracket, dan peserta di satu tempat.
                </p>
             </div>
             
             <Button href="/tournament/create" variant="primary" size="lg" className="shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] font-bold tracking-widest px-8">
                <PlusIcon className="h-5 w-5 mr-2" />
                CREATE TOURNAMENT
             </Button>
          </div>

          {/* Konten */}
          {tournaments.length === 0 ? (
            <div className="bg-[#15171e]/50 backdrop-blur-md border border-white/5 rounded-3xl p-16 text-center flex flex-col items-center justify-center border-dashed">
               <div className="w-24 h-24 bg-[#0a0a0b] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                  <InfoIcon className="h-10 w-10 text-gray-600 opacity-50" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2 font-clash uppercase tracking-wide">
                  No Tournaments Found
               </h3>
               <p className="text-gray-500 max-w-md mb-8 font-sans leading-relaxed">
                  Anda belum mengelola turnamen apapun saat ini. Mulailah dengan membuat turnamen baru untuk komunitas Anda!
               </p>
               <Button href="/tournament/create" variant="outline" className="border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10 hover:text-white px-8">
                  Mulai Buat Turnamen
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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