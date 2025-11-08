'use client';

// [TAHAP 6] Tambahkan useState, useEffect
import React, { useState, useEffect } from 'react';
// [PERBAIKAN] Ganti Image next/image menjadi img biasa
// import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// [TAHAP 6] Tambahkan TournamentParticipant
import {
  FirestoreDocument,
  Tournament,
  TournamentParticipant,
} from '@/lib/clashub.types';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import {
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  TrophyIcon,
  ShieldIcon, // Menggunakan ShieldIcon sebagai pengganti THIcon
  Loader2Icon, // [TAHAP 6] Tambahkan Loader2Icon
} from '@/app/components/icons';
import { format } from 'date-fns';
// import { id } from 'date-fns/locale/id'; // Opsional jika ingin format bahasa Indonesia

// Tipe untuk props
interface TournamentDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
}

/**
 * @component InfoCard
 * Komponen kecil internal untuk menampilkan detail item di grid.
 */
const InfoCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
}> = ({ icon: Icon, title, value }) => (
  <div className="flex items-start rounded-lg bg-white/5 p-4 backdrop-blur-sm">
    <Icon className="mr-3 h-6 w-6 flex-shrink-0 text-coc-gold" />
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-coc-font-secondary">
        {title}
      </p>
      <p className="text-lg font-bold text-coc-font-primary">{value}</p>
    </div>
  </div>
);

/**
 * @component RegisterButtonLogic
 * Komponen internal untuk menangani logika tombol pendaftaran.
 */
const RegisterButtonLogic: React.FC<{
  tournament: FirestoreDocument<Tournament>;
}> = ({ tournament }) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  const handleRegisterClick = () => {
    // [PERBAIKAN] Gunakan path singular /tournament/
    router.push(`/tournament/${tournament.id}/register`);
  };

  // 1. Saat loading status auth
  if (loading) {
    return (
      <Button size="lg" disabled>
        Memuat...
      </Button>
    );
  }

  // 2. Jika turnamen tidak lagi UPCOMING
  if (tournament.status !== 'UPCOMING') {
    return (
      <Button size="lg" variant="secondary" disabled>
        Pendaftaran Ditutup
      </Button>
    );
  }

  // 3. Jika user belum login
  if (!userProfile) {
    return (
      <Button size="lg" variant="primary" href="/auth">
        Login untuk Daftar
      </Button>
    );
  }

  // 4. Jika user belum verifikasi tag
  if (!userProfile.isVerified) {
    return (
      <Button size="lg" variant="secondary" disabled>
        Verifikasi Player Tag untuk Daftar
      </Button>
    );
  }

  // 5. User sudah login dan terverifikasi
  return (
    <Button size="lg" variant="primary" onClick={handleRegisterClick}>
      Daftar Sekarang
    </Button>
  );
};

// --- [BARU TAHAP 6] ---
/**
 * @component ParticipantList
 * Komponen internal untuk fetch dan render daftar peserta.
 */
const ParticipantList: React.FC<{
  tournamentId: string;
  participantCount: number;
  maxParticipants: number;
}> = ({ tournamentId, participantCount, maxParticipants }) => {
  const [participants, setParticipants] = useState<
    FirestoreDocument<TournamentParticipant>[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        // Panggil API route baru yang kita buat (Tahap 6, Poin 2)
        const response = await fetch(
          `/api/tournaments/${tournamentId}/participants`,
        );
        if (!response.ok) {
          throw new Error('Gagal memuat daftar peserta.');
        }
        const data: FirestoreDocument<TournamentParticipant>[] =
          await response.json();
        
        // Urutkan berdasarkan tanggal daftar (meskipun API sudah mengurutkan)
        data.sort((a, b) => 
          new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
        );

        setParticipants(data);
      } catch (err: any) {
        console.error('Error fetching participants:', err);
        setFetchError(err.message || 'Terjadi kesalahan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [tournamentId]); // Hanya fetch ulang jika ID turnamen berubah

  return (
    <section className="rounded-lg border border-coc-border bg-coc-dark-blue p-6">
      <h2 className="mb-4 flex items-center font-clash text-2xl font-bold text-white">
        <UsersIcon className="mr-2 h-6 w-6" />
        Peserta Terdaftar ({participantCount} / {maxParticipants})
      </h2>

      {/* State Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-8 text-center">
          <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold" />
          <p className="mt-2 text-coc-font-secondary">Memuat daftar tim...</p>
        </div>
      )}

      {/* State Error */}
      {fetchError && (
        <div className="rounded-lg border border-dashed border-red-700 bg-red-900/30 p-8 text-center text-red-300">
          <p>Error: {fetchError}</p>
        </div>
      )}

      {/* State Sukses (Data Kosong) */}
      {!isLoading && !fetchError && participants.length === 0 && (
        <div className="rounded-lg border border-dashed border-coc-border p-8 text-center">
          <p className="text-coc-font-secondary">
            Belum ada tim yang terdaftar. Jadilah yang pertama!
          </p>
        </div>
      )}

      {/* State Sukses (Ada Data) */}
      {!isLoading && !fetchError && participants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-coc-border/50">
            <thead className="bg-white/5">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-coc-font-secondary"
                >
                  Tim (Klan)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-coc-font-secondary"
                >
                  Didaftarkan Oleh
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-coc-font-secondary"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/30">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-md"
                          src={p.clanBadgeUrl}
                          alt={`${p.clanName} badge`}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="font-clash text-base font-medium text-coc-font-primary">
                          {p.clanName}
                        </div>
                        {/* ID Tim bisa ditampilkan jika perlu */}
                        {/* <div className="text-xs text-coc-font-secondary">{p.id}</div> */}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-coc-font-primary">
                      {p.representativeName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {/* Logika status (jika nanti ada PENDING/REJECTED) */}
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        p.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
// --- [AKHIR BARU TAHAP 6] ---

/**
 * @component TournamentDetailClient
 * Client Component untuk me-render detail turnamen.
 */
const TournamentDetailClient: React.FC<TournamentDetailClientProps> = ({
  tournament,
}) => {
  // Format tanggal menggunakan date-fns
  // Kita pakai new Date() untuk mengurai string tanggal yang diserialisasi dari Server Component
  const formattedDate = format(
    new Date(tournament.startDate),
    'dd MMMM yyyy - HH:mm',
    // { locale: id } // Opsional jika ingin format bahasa Indonesia
  );

  const getStatusClasses = () => {
    switch (tournament.status) {
      case 'UPCOMING':
        return 'bg-green-600/20 text-green-300 border-green-500';
      case 'ONGOING':
        return 'bg-blue-600/20 text-blue-300 border-blue-500';
      case 'COMPLETED':
        return 'bg-red-600/20 text-red-300 border-red-500';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-500';
    }
  };

  return (
    <div className="space-y-8 text-coc-font-primary">
      {/* 1. Banner & Header */}
      <section>
        <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl border-2 border-coc-border md:h-64 lg:h-80">
          {/* [PERBAIKAN] Ganti Next/Image menjadi <img> standar */}
          <img
            src={tournament.bannerUrl}
            alt={`Banner ${tournament.title}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            // Hapus props Next/Image: layout, objectFit, priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <span
              className={`mb-2 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusClasses()}`}
            >
              {tournament.status}
            </span>
            <h1 className="font-clash text-4xl font-bold leading-tight text-white md:text-5xl">
              {tournament.title}
            </h1>
          </div>
          <div className="flex-shrink-0">
            <RegisterButtonLogic tournament={tournament} />
          </div>
        </div>
      </section>

      {/* 2. Grid Info Detail */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={TrophyIcon}
          title="Hadiah"
          value={tournament.prizePool}
        />
        <InfoCard
          icon={ClockIcon}
          title="Tanggal Mulai"
          value={`${formattedDate} WIB`}
        />
        <InfoCard
          icon={UsersIcon}
          title="Format"
          value={`${tournament.format} (${tournament.teamSize}v${tournament.teamSize})`}
        />
        <InfoCard
          icon={ShieldIcon} // Menggunakan ShieldIcon sebagai pengganti THIcon
          title="Syarat Town Hall"
          value={tournament.thRequirement}
        />
        <InfoCard
          icon={UsersIcon}
          title="Peserta"
          value={`${tournament.participantCount} / ${tournament.maxParticipants}`}
        />
        <InfoCard
          icon={UserIcon}
          title="Organizer"
          value={tournament.organizerName}
        />
      </section>

      {/* 3. Deskripsi & Aturan */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Kolom Deskripsi */}
        <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6 md:col-span-2">
          <h2 className="mb-4 font-clash text-2xl font-bold text-white">
            Deskripsi Turnamen
          </h2>
          {/* Menggunakan 'prose' untuk styling teks yang aman */}
          <div className="prose prose-invert max-w-none text-coc-font-secondary">
            <p>{tournament.description}</p>
          </div>
        </div>

        {/* Kolom Aturan */}
        <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6 md:col-span-1">
          <h2 className="mb-4 flex items-center font-clash text-2xl font-bold text-white">
            <BookOpenIcon className="mr-2 h-6 w-6" />
            Aturan
          </h2>
          <div className="prose prose-invert max-w-none text-coc-font-secondary">
            {/* Asumsi 'rules' adalah teks biasa. Jika ini markdown, kita perlu parser. */}
            <p className="whitespace-pre-wrap">{tournament.rules}</p>
          </div>
        </div>
      </section>

      {/* 4. Daftar Peserta (DINAMIS - TAHAP 6) */}
      <ParticipantList
        tournamentId={tournament.id}
        participantCount={tournament.participantCount}
        maxParticipants={tournament.maxParticipants}
      />
    </div>
  );
};

export default TournamentDetailClient;