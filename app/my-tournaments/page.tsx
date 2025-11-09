// File: app/my-tournaments/page.tsx
// Deskripsi: [BARU - FASE 4] Halaman "Hub" untuk panitia turnamen.
// Menampilkan daftar turnamen yang dikelola oleh pengguna saat ini.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { Button } from '@/app/components/ui/Button';
import { PlusIcon, InfoIcon, TrophyIcon } from '@/app/components/icons'; // Impor Ikon
import { Query } from 'firebase-admin/firestore';

// --- [Komponen Internal] Kartu Turnamen untuk Manajemen ---
// Adaptasi dari TournamentCard di app/components/cards.tsx
// Perbedaan utama: Link mengarah ke /manage
// --------------------------------------------------------

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
          styles: 'border-coc-green bg-coc-green/10',
          badgeStyles: 'bg-coc-green text-coc-stone-dark',
        };
      case 'registration_closed':
        return {
          text: 'Pendaftaran Ditutup',
          styles: 'border-coc-blue bg-coc-blue/10',
          badgeStyles: 'bg-coc-blue text-white',
        };
      case 'ongoing':
        return {
          text: 'Sedang Berlangsung',
          styles: 'border-coc-red bg-coc-red/10 animate-pulse',
          badgeStyles: 'bg-coc-red text-white',
        };
      case 'completed':
        return {
          text: 'Selesai',
          styles: 'border-gray-500 bg-gray-500/10 opacity-70',
          badgeStyles: 'bg-gray-500 text-white',
        };
      case 'draft':
      default:
        return {
          text: 'Draft',
          styles: 'border-gray-400 bg-gray-400/10 opacity-80',
          badgeStyles: 'bg-gray-400 text-coc-stone-dark',
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
      // Mengurutkan dan menghitung TH unik
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
      className={`card-stone flex flex-col sm:flex-row justify-between items-center p-6 gap-4 border-l-4 ${statusInfo.styles} transition-shadow hover:shadow-xl rounded-lg`}
    >
      <div className="flex-grow w-full sm:w-auto">
        <h4 className="font-clash text-xl text-white leading-snug">
          {title}
        </h4>
        <div className="text-sm text-gray-300 space-y-1 mt-2 font-sans">
          <p>
            Syarat:{' '}
            <span className="font-bold text-white">{thReqText}</span>
          </p>
          <p>
            Hadiah: <span className="font-bold text-coc-gold">{prizePool}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full text-center font-sans ${statusInfo.badgeStyles}`}
        >
          {statusInfo.text}
        </span>
        {/* PENTING: Link mengarah ke halaman /manage */}
        <Button href={`/tournament/${id}/manage`} variant="secondary" className="w-full sm:w-auto">
          Kelola Turnamen
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
  ) as unknown as Query<Tournament>; // <--- [PERBAIKAN] Tambahkan 'as unknown' di sini

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

    // Tambahkan hasil organizer
    organizerSnap.docs.forEach((doc) => {
      const data = docToDataAdmin<Tournament>(doc);
      if (data) {
        tournamentsMap.set(doc.id, data);
      }
    });

    // Tambahkan hasil panitia (Map akan otomatis menangani duplikat)
    committeeSnap.docs.forEach((doc) => {
      const data = docToDataAdmin<Tournament>(doc);
      if (data) {
        tournamentsMap.set(doc.id, data);
      }
    });

    // Konversi Map kembali ke array dan urutkan
    const combinedList = Array.from(tournamentsMap.values());
    combinedList.sort(
      (a, b) => (b.startsAt as any) - (a.startsAt as any), // Urutkan terbaru dulu
    );

    return combinedList;
  } catch (error) {
    console.error('Firestore Error [getManagedTournaments - Admin]:', error);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

// --- [Halaman Utama] ---
export default async function MyTournamentsPage() {
  // 1. Ambil sesi user
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/auth'); // Wajib login untuk melihat halaman ini
  }

  // 2. Fetch turnamen yang dikelola user
  const tournaments = await getManagedTournaments(sessionUser.uid);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <TrophyIcon className="h-8 w-8 text-coc-gold" />
          <h1 className="font-clash text-3xl text-white">
            Manajemen Turnamen
          </h1>
        </div>
        <Button href="/tournament/create" variant="primary" size="md">
          <PlusIcon className="h-5 w-5 mr-2" />
          Buat Turnamen Baru
        </Button>
      </div>

      {/* Konten Halaman */}
      {tournaments.length === 0 ? (
        // Tampilan Empty State
        <div className="card-stone flex flex-col items-center justify-center gap-4 p-10 text-center rounded-lg">
          <InfoIcon className="h-12 w-12 text-coc-gold/50" />
          <h3 className="font-clash text-xl text-white">
            Anda Belum Mengelola Turnamen
          </h3>
          <p className="text-gray-400 max-w-md">
            Anda dapat membuat turnamen baru atau meminta organizer lain untuk
            menambahkan Anda sebagai panitia.
          </p>
        </div>
      ) : (
        // Daftar Turnamen
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
  );
}