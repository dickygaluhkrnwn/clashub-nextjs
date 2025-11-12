'use client';

// [TAHAP 6] Tambahkan useState, useEffect
import React, { useState, useEffect } from 'react';
// [PERBAIKAN] Ganti Image next/image menjadi img biasa
// import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// [TAHAP 6] Ganti Tipe Lama ke Tipe Baru
import {
  FirestoreDocument,
  Tournament,
  TournamentTeam,
  TournamentMatch,
  ThRequirement,
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
  SwordsIcon, // [FIX] Ganti SwordIcon menjadi SwordsIcon
} from '@/app/components/icons';
import { format } from 'date-fns';
// import { id } from 'date-fns/locale/id'; // Opsional jika ingin format bahasa Indonesia

// Tipe untuk props
interface TournamentDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
}

// --- [BARU TAHAP 6] ---
// Tipe data gabungan untuk match + data tim yang sudah dipopulasi
type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

/**
 * @function formatThRequirement
 * Helper untuk memformat objek ThRequirement menjadi string yang mudah dibaca.
 */
const formatThRequirement = (th: ThRequirement): string => {
  if (th.type === 'any') {
    return `TH ${th.minLevel} - ${th.maxLevel}`;
  }
  if (th.type === 'uniform') {
    return `Seragam TH ${th.allowedLevels[0]}`;
  }
  if (th.type === 'mixed') {
    return `Campuran: TH ${th.allowedLevels.join(', ')}`;
  }
  return 'N/A';
};
// --- [AKHIR BARU TAHAP 6] ---

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
  // [TAHAP 6] Ganti status 'UPCOMING' lama menjadi 'registration_open' baru
  if (tournament.status !== 'registration_open') {
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

// --- [HAPUS TAHAP 6] ---
// Komponen ParticipantList (daftar tabel) akan dihapus seluruhnya
// dan digantikan dengan BracketDisplay di bawah.
/*
const ParticipantList: React.FC<{ ... }> = ({ ... }) => {
  ... (SELURUH KODE ParticipantList DARI baris 111 s/d 251 DIHAPUS) ...
};
*/
// --- [AKHIR HAPUS TAHAP 6] ---

// --- [BARU TAHAP 6] ---
/**
 * @component TeamDisplay
 * Menampilkan nama tim dan badge untuk slot di MatchCard.
 * Menangani kasus 'BYE' (tim null).
 */
const TeamDisplay: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  isWinner: boolean;
}> = ({ team, isWinner }) => {
  if (!team) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-coc-dark-blue/50">
          <span className="text-xs font-semibold text-coc-font-secondary/50">
            -
          </span>
        </div>
        <span className="font-semibold text-coc-font-secondary/60">BYE</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <img
        className="h-8 w-8 rounded-md"
        src={team.originClanBadgeUrl}
        alt={`${team.teamName} badge`}
      />
      <span
        className={`font-semibold ${
          isWinner ? 'text-coc-gold' : 'text-coc-font-primary'
        }`}
      >
        {team.teamName}
      </span>
    </div>
  );
};

/**
 * @component MatchCard
 * Merender satu kartu pertandingan di dalam kolom bracket.
 */
const MatchCard: React.FC<{
  match: FullMatchData;
  tournamentId: string;
}> = ({ match, tournamentId }) => {
  const { team1, team2, winnerTeamRef, matchId, status } = match;

  const isTeam1Winner = winnerTeamRef?.path === team1?.id;
  const isTeam2Winner = winnerTeamRef?.path === team2?.id;

  // Tentukan status untuk styling
  let statusText = 'Pending';
  let statusColor = 'text-coc-font-secondary/70';
  if (status === 'completed' || status === 'reported') {
    statusText = 'Selesai';
    statusColor = 'text-green-400';
  } else if (status === 'live') {
    statusText = 'Live';
    statusColor = 'text-red-500 animate-pulse';
  } else if (status === 'scheduled' && match.scheduledTime) {
    statusText = format(new Date(match.scheduledTime), 'dd/MM HH:mm');
    statusColor = 'text-blue-400';
  }

  return (
    <Link
      href={`/tournament/${tournamentId}/match/${match.id}`}
      className="block rounded-lg border border-coc-border bg-coc-dark-blue/60 p-4 transition-all hover:border-coc-gold/50 hover:bg-coc-dark-blue"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-coc-font-secondary">
          {matchId}
        </span>
        <span className={`text-xs font-bold ${statusColor}`}>{statusText}</span>
      </div>
      <div className="space-y-3">
        {/* Tim 1 */}
        <TeamDisplay team={team1} isWinner={isTeam1Winner} />

        {/* VS Separator */}
        <div className="flex items-center pl-10">
          <SwordsIcon className="h-4 w-4 text-coc-font-secondary/50" /> {/* [FIX] Ganti SwordIcon menjadi SwordsIcon */}
          <hr className="ml-2 w-full border-t border-coc-border/30" />
        </div>

        {/* Tim 2 */}
        <TeamDisplay team={team2} isWinner={isTeam2Winner} />
      </div>
    </Link>
  );
};

/**
 * @component BracketColumn
 * Merender satu kolom penuh (misal: Upper Bracket) yang berisi ronde-ronde.
 */
const BracketColumn: React.FC<{
  title: string;
  matches: FullMatchData[];
  tournamentId: string;
}> = ({ title, matches, tournamentId }) => {
  // Kelompokkan match berdasarkan ronde
  const groupedMatches = matches.reduce(
    (acc, match) => {
      const round = match.round;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    },
    {} as Record<number, FullMatchData[]>,
  );

  return (
    <div className="flex-1">
      <h3 className="mb-4 font-clash text-2xl font-bold text-white">{title}</h3>
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <div key={round}>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-coc-font-secondary">
              Ronde {round}
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournamentId={tournamentId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * @component BracketDisplay
 * Komponen utama untuk fetch data bracket dan menampilkannya.
 */
const BracketDisplay: React.FC<{
  tournamentId: string;
  matches: FullMatchData[];
  isLoading: boolean;
  error: string | null;
}> = ({ tournamentId, matches, isLoading, error }) => {
  // State Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-12 text-center">
        <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold" />
        <p className="mt-3 text-lg text-coc-font-secondary">
          Memuat data bracket...
        </p>
      </div>
    );
  }

  // State Error
  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-red-700 bg-red-900/30 p-12 text-center text-red-300">
        <p className="text-lg font-bold">Gagal memuat bracket</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // State Sukses (Data Kosong - Bracket belum di-generate)
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-coc-border p-12 text-center">
        <p className="text-lg text-coc-font-secondary">
          Bracket turnamen belum dibuat oleh panitia.
        </p>
        <p className="text-sm text-coc-font-secondary/70">
          Silakan cek kembali setelah pendaftaran ditutup.
        </p>
      </div>
    );
  }

  // State Sukses (Ada Data)
  // Pisahkan match Upper dan Lower
  const upperBracketMatches = matches.filter((m) => m.bracket === 'upper');
  const lowerBracketMatches = matches.filter((m) => m.bracket === 'lower');

  return (
    <section className="space-y-8 rounded-lg border border-coc-border bg-coc-dark-blue p-6">
      <BracketColumn
        title="Upper Bracket"
        matches={upperBracketMatches}
        tournamentId={tournamentId}
      />
      {lowerBracketMatches.length > 0 && (
        <>
          <hr className="border-t border-coc-border/50" />
          <BracketColumn
            title="Lower Bracket"
            matches={lowerBracketMatches}
            tournamentId={tournamentId}
          />
        </>
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
  // --- [BARU TAHAP 6] ---
  // State untuk menyimpan data bracket (matches + teams)
  const [matches, setMatches] = useState<FullMatchData[]>([]);
  const [isLoadingBracket, setIsLoadingBracket] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch data bracket saat komponen dimuat
  useEffect(() => {
    const fetchBracketData = async () => {
      try {
        setIsLoadingBracket(true);
        setFetchError(null);
        // Panggil API route publik baru yang kita buat (Tahap 6)
        const response = await fetch(
          `/api/tournaments/${tournament.id}/bracket`,
        );
        if (!response.ok) {
          throw new Error('Gagal memuat data bracket.');
        }
        const data: { matches: FullMatchData[] } = await response.json();
        setMatches(data.matches || []);
      } catch (err: any) {
        console.error('Error fetching bracket data:', err);
        setFetchError(err.message || 'Terjadi kesalahan.');
      } finally {
        setIsLoadingBracket(false);
      }
    };

    // Hanya fetch bracket jika turnamen sudah 'ongoing' atau 'completed'
    if (tournament.status === 'ongoing' || tournament.status === 'completed') {
      fetchBracketData();
    } else {
      // Jika masih registrasi, tidak perlu fetch bracket, set loading ke false
      setIsLoadingBracket(false);
    }
  }, [tournament.id, tournament.status]); // Fetch ulang jika ID atau status berubah
  // --- [AKHIR BARU TAHAP 6] ---

  // Format tanggal menggunakan date-fns
  // Kita pakai new Date() untuk mengurai string tanggal yang diserialisasi dari Server Component
  const formattedDate = format(
    // [PERBAIKAN FASE 8.2] Ganti 'startsAt' (string) lama menjadi 'tournamentStartsAt' (Date) baru
    // Ini adalah penyebab error "Invalid time value"
    new Date(tournament.tournamentStartsAt),
    'dd MMMM yyyy - HH:mm',
    // { locale: id } // Opsional jika ingin format bahasa Indonesia
  );

  const getStatusClasses = () => {
    switch (tournament.status) {
      // [TAHAP 6] Sesuaikan status dengan Tipe Baru
      case 'registration_open':
        return 'bg-green-600/20 text-green-300 border-green-500';
      // [BARU FASE 8.2] Tambahkan status 'scheduled' dan 'cancelled'
      case 'scheduled':
        return 'bg-cyan-600/20 text-cyan-300 border-cyan-500';
      case 'registration_closed':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-500';
      case 'ongoing':
        return 'bg-blue-600/20 text-blue-300 border-blue-500';
      case 'completed':
        return 'bg-purple-600/20 text-purple-300 border-purple-500';
      case 'cancelled':
        return 'bg-red-600/20 text-red-300 border-red-500';
      default:
        // Hapus status lama, biarkan default
        // case 'UPCOMING':
        // case 'ONGOING':
        // case 'COMPLETED':
        return 'bg-gray-600/20 text-gray-300 border-gray-500';
    }
  };

  // [BARU FASE 8.2] Helper untuk memformat status agar lebih rapi
  const formatStatusText = (status: string) => {
    if (status === 'registration_open') return 'Pendaftaran Dibuka';
    if (status === 'registration_closed') return 'Pendaftaran Ditutup';
    if (status === 'scheduled') return 'Terjadwal';
    if (status === 'ongoing') return 'Sedang Berlangsung';
    if (status === 'completed') return 'Selesai';
    if (status === 'cancelled') return 'Dibatalkan';
    return status.replace('_', ' '); // Fallback
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
              {/* [PERBAIKAN FASE 8.2] Gunakan helper formatStatusText */}
              {formatStatusText(tournament.status)}
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
          // [PERBAIKAN FASE 8.2] Ubah title "Tanggal Mulai" menjadi "Turnamen Dimulai"
          title="Turnamen Dimulai"
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
          // [TAHAP 6] Gunakan helper baru untuk format objek ThRequirement
          value={formatThRequirement(tournament.thRequirement)}
        />
        <InfoCard
          icon={UsersIcon}
          title="Peserta"
          // [TAHAP 6] Gunakan counter 'participantCountCurrent' dan limit 'participantCount'
          value={`${tournament.participantCountCurrent} / ${tournament.participantCount}`}
        />
        <InfoCard
          icon={UserIcon}
          title="Organizer"
          value={tournament.organizerName}
        />
        {/* [BARU FASE 8.2] Tambahkan 2 InfoCard baru untuk tanggal pendaftaran */}
        <InfoCard
          icon={ClockIcon}
          title="Pendaftaran Dibuka"
          value={`${format(
            new Date(tournament.registrationStartsAt),
            'dd MMMM yyyy - HH:mm',
          )} WIB`}
        />
        <InfoCard
          icon={ClockIcon}
          title="Pendaftaran Ditutup"
          value={`${format(
            new Date(tournament.registrationEndsAt),
            'dd MMMM yyyy - HH:mm',
          )} WIB`}
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

      {/* 4. [ROMBAK TAHAP 6] Ganti Daftar Peserta menjadi Tampilan Bracket */}
      <BracketDisplay
        tournamentId={tournament.id}
        matches={matches}
        isLoading={isLoadingBracket}
        error={fetchError}
      />
    </div>
  );
};

export default TournamentDetailClient;