'use client';

// File: app/tournament/[tournamentId]/match/[matchId]/MatchDetailClient.tsx
// Deskripsi: [FASE 6 DIEDIT] Client Component untuk Halaman Detail Match.
// Menangani UI, state, check-in, dan polling live war.

// [TAHAP 6] Tambahkan useEffect
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
// [FIX 1] Ganti impor dari 'clashub.types' ke 'types' (barrel file)
import {
  FirestoreDocument,
  Tournament,
  TournamentMatch,
  TournamentTeam,
  TournamentTeamMember,
  CocCurrentWar, // [TAHAP 6] Tipe data untuk live war
} from '@/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  Loader2Icon,
  ShieldIcon,
  SwordsIcon,
  UserIcon,
  UsersIcon,
  AlertTriangleIcon, // [TAHAP 6] Ikon untuk status
} from '@/app/components/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
// [TAHAP 6] Impor komponen display war yang baru
import CurrentWarDisplay from '@/app/components/war/CurrentWarDisplay';

// Tipe data gabungan yang diterima dari Server Component
type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

// Tipe props untuk Client Component
interface MatchDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
  initialMatchData: FullMatchData;
}

/**
 * @component MatchHeader
 * Menampilkan header pertandingan (Team A vs Team B).
 */
const MatchHeader: React.FC<{
  match: FullMatchData;
  tournamentTitle: string;
}> = ({ match, tournamentTitle }) => {
  const router = useRouter();
  const { team1, team2, matchId } = match;

  return (
    <div className="mb-6">
      {/* Tombol Kembali */}
      <Button
        variant="secondary" // [FIX 2] Ganti "outline" menjadi "secondary"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Kembali ke Bracket
      </Button>

      {/* Info Match */}
      <p className="text-sm font-semibold uppercase tracking-wider text-coc-gold">
        {tournamentTitle}
      </p>
      <h1 className="mb-2 font-clash text-4xl font-bold text-white md:text-5xl">
        Match: {matchId}
      </h1>

      {/* Tim vs Tim */}
      <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-coc-border bg-coc-dark-blue p-6 md:flex-row md:space-x-8 md:space-y-0">
        {/* Tim 1 */}
        <div className="flex items-center space-x-3">
          <img
            src={team1?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
            alt={team1?.teamName || 'Tim 1'}
            className="h-12 w-12 rounded-md"
          />
          <span className="font-clash text-2xl font-bold text-white">
            {team1?.teamName || 'TBD'}
          </span>
        </div>

        <SwordsIcon className="h-8 w-8 text-coc-font-secondary/50" />

        {/* Tim 2 */}
        <div className="flex items-center space-x-3">
          <img
            src={team2?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
            alt={team2?.teamName || 'Tim 2'}
            className="h-12 w-12 rounded-md"
          />
          <span className="font-clash text-2xl font-bold text-white">
            {team2?.teamName || 'TBD'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * @component MatchStatusInfo
 * Menampilkan info status, jadwal, dan ronde.
 */
const MatchStatusInfo: React.FC<{ match: FullMatchData }> = ({ match }) => {
  const { status, scheduledTime, round, bracket } = match;

  let statusText = 'Pending';
  let statusColor = 'text-gray-400';
  if (status === 'completed' || status === 'reported') {
    statusText = 'Selesai';
    statusColor = 'text-green-400';
  } else if (status === 'live') {
    statusText = 'Live';
    statusColor = 'text-red-500 animate-pulse';
  } else if (status === 'scheduled') {
    statusText = 'Terjadwal';
    statusColor = 'text-blue-400';
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Status
        </p>
        <p className={`text-lg font-bold ${statusColor}`}>{statusText}</p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Jadwal
        </p>
        <p className="text-lg font-bold text-coc-font-primary">
          {scheduledTime
            ? format(new Date(scheduledTime), 'dd/MM/yy - HH:mm')
            : 'Belum Diatur'}
        </p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Bracket
        </p>
        <p className="text-lg font-bold capitalize text-coc-font-primary">
          {bracket}
        </p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Ronde
        </p>
        <p className="text-lg font-bold text-coc-font-primary">{round}</p>
      </div>
    </div>
  );
};

/**
 * @component TeamCheckInCard
 * Menampilkan panel untuk satu tim, termasuk daftar member dan logic check-in.
 */
const TeamCheckInCard: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  teamSide: 'team1' | 'team2';
  match: FullMatchData;
  tournamentId: string;
  onCheckInSuccess: (updatedMatch: FullMatchData) => void;
}> = ({ team, teamSide, match, tournamentId, onCheckInSuccess }) => {
  const { userProfile, loading: authLoading } = useAuth();
  const [clanTag, setClanTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!team) {
    return (
      <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6">
        <h3 className="mb-4 font-clash text-xl font-bold text-white">
          Tim (BYE)
        </h3>
        <p className="text-coc-font-secondary">Slot ini kosong (BYE).</p>
      </div>
    );
  }

  const isLeader = userProfile?.uid === team.leaderUid;
  // [FIX] Status 'live' juga harus mengizinkan check-in (jika tim lain belum)
  const isMatchReady = match.status === 'scheduled' || match.status === 'live';
  const checkedInClanTag =
    teamSide === 'team1' ? match.team1ClanTag : match.team2ClanTag;

  const handleCheckIn = async () => {
    // Validasi clan tag (harus diawali # dan minimal 4 char)
    if (!clanTag.startsWith('#') || clanTag.length < 4) {
      setError('Format Clan Tag tidak valid. Harus diawali dengan #.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Panggil API Route Check-in (Fase 6, Poin 3)
      const response = await fetch(
        `/api/tournaments/${tournamentId}/match/${match.id}/check-in`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clanTag: clanTag.toUpperCase(),
            teamSide: teamSide,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal melakukan check-in.');
      }

      // Sukses
      onCheckInSuccess(result.match); // Update state di parent
      setClanTag(''); // Kosongkan input
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6">
      {/* Header Tim */}
      <div className="mb-4 flex items-center space-x-3">
        <img
          src={team.originClanBadgeUrl}
          alt={team.teamName}
          className="h-10 w-10 rounded-md"
        />
        <div>
          <h3 className="font-clash text-xl font-bold text-white">
            {team.teamName}
          </h3>
          <p className="text-sm text-coc-font-secondary">
            Leader: {team.leaderUid.substring(0, 6)}...
          </p>
        </div>
      </div>

      {/* Daftar Anggota Tim */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase text-coc-font-secondary">
          Anggota Tim
        </h4>
        <ul className="space-y-2">
          {team.members.map((member) => (
            <li
              key={member.playerTag}
              className="flex items-center space-x-2 rounded bg-white/5 p-2"
            >
              <ShieldIcon className="h-5 w-5 text-coc-font-secondary" />
              <span className="font-semibold text-coc-font-primary">
                {member.playerName}
              </span>
              <span className="text-sm text-coc-font-secondary">
                (TH{member.townHallLevel})
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Panel Check-in */}
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-coc-font-secondary">
          Check-in Clan Tanding
        </h4>
        {checkedInClanTag ? (
          // SUDAH CHECK-IN
          <div className="flex items-center space-x-2 rounded-lg border border-green-700 bg-green-900/30 p-4">
            <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-green-400" />
            <div>
              <p className="font-bold text-green-300">Berhasil Check-in</p>
              <p className="font-mono text-lg font-bold text-white">
                {checkedInClanTag}
              </p>
            </div>
          </div>
        ) : (
          // BELUM CHECK-IN
          <div>
            {!isMatchReady ? (
              <p className="text-sm text-coc-font-secondary/70">
                Check-in akan dibuka saat match berstatus "Terjadwal".
              </p>
            ) : isLeader ? (
              // Tampilkan form jika user adalah leader
              <div className="space-y-3">
                <p className="text-sm text-coc-font-secondary">
                  Sebagai Leader, masukkan Clan Tag yang akan digunakan untuk
                  bertanding.
                </p>
                <Input
                  type="text"
                  placeholder="#2PYCLLVG"
                  value={clanTag}
                  onChange={(e) =>
                    setClanTag(e.target.value.toUpperCase().trim())
                  }
                  disabled={isLoading}
                  className="font-mono"
                />
                <Button
                  onClick={handleCheckIn}
                  disabled={isLoading || !clanTag}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Konfirmasi Check-in
                </Button>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>
            ) : (
              // Tampilkan pesan tunggu jika bukan leader
              <p className="text-sm text-coc-font-secondary/70">
                Menunggu Leader Tim ({team.leaderUid.substring(0, 6)}...
                ) melakukan check-in clan tanding.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- [EDIT FASE 6 (Tambahan)] ---
/**
 * @component LiveWarTracker
 * Komponen baru untuk menangani logic polling dan menampilkan CurrentWarDisplay.
 */
const LiveWarTracker: React.FC<{
  match: FullMatchData;
  tournamentId: string; // [EDIT] Tambahkan tournamentId
  onSetLive: (liveWar: CocCurrentWar) => void; // [EDIT] Tambahkan callback
}> = ({ match, tournamentId, onSetLive }) => {
  const { team1ClanTag, team2ClanTag } = match;
  // [EDIT] Gunakan status dari match sebagai state awal
  const [matchStatus, setMatchStatus] = useState(match.status);
  const [warData, setWarData] = useState<CocCurrentWar | null>(
    (match.liveWarData as CocCurrentWar) || null, // [FIX] Type casting di sini
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref untuk mencegah double call API 'set-live'
  const setLiveApiCalled = useRef(false);

  // [EDIT] Fungsi untuk memanggil API set-live
  const callSetLiveApi = async (liveWar: CocCurrentWar) => {
    if (setLiveApiCalled.current) return; // Hanya panggil sekali
    setLiveApiCalled.current = true;

    // 1. Update state parent (untuk UI)
    onSetLive(liveWar);
    
    // 2. Panggil API di background (untuk update DB)
    try {
      await fetch(
        `/api/tournaments/${tournamentId}/match/${match.id}/set-live`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ liveWarData: liveWar }),
        },
      );
      // Fire-and-forget, tidak perlu handle response
    } catch (err) {
      console.error("Failed to set match status to 'live':", err);
      // Jika gagal, state UI sudah 'live', tapi DB tidak.
      // Polling berikutnya akan mencoba lagi jika user me-refresh.
      setLiveApiCalled.current = false; // Izinkan retry jika API call gagal
    }
  };


  useEffect(() => {
    // Update status internal jika prop match berubah (misal: dari check-in)
    setMatchStatus(match.status);
    
    // Hanya jalankan jika kedua tim sudah check-in
    if (!team1ClanTag || !team2ClanTag) {
      setIsLoading(false);
      return;
    }

    // Jangan fetch jika match sudah selesai
    if (match.status === 'completed' || match.status === 'reported') {
      // Jika ada liveWarData (misal: dari refresh), tampilkan
      if (match.liveWarData) {
        setWarData(match.liveWarData as CocCurrentWar); // [FIX] Type casting di sini juga
        setError(null);
      }
      setIsLoading(false);
      return;
    }

    // Jika status sudah 'live' dan warData sudah ada, tampilkan saja
    if (match.status === 'live' && warData) {
       setIsLoading(false);
       setError(null);
       // Tidak perlu polling lagi jika war sudah selesai
       if (warData.state === 'warEnded') {
         return;
       }
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const fetchWarData = async () => {
      // Jika status sudah 'live' di DB, tidak perlu set loading
      if (matchStatus !== 'live') {
         setIsLoading(true);
      }
     
      try {
        const response = await fetch(
          `/api/coc/get-current-war/${encodeURIComponent(team1ClanTag)}`,
        );
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || `Gagal fetch war (Status ${response.status})`);
        }

        const data: CocCurrentWar | { war: null; message: string } =
          await response.json();

        if (!isMounted) return;

        if ('war' in data && data.war === null) {
          setWarData(null);
          setError('Menunggu Friendly War dimulai oleh kedua klan...');
        } else if ('state' in data) {
          const liveWar = data as CocCurrentWar;

          if (liveWar.opponent.tag === team2ClanTag) {
            // Ini adalah war yang benar!
            setWarData(liveWar);
            setError(null);

            // [LOGIC BARU DITAMBAHKAN]
            // Jika status di DB masih 'scheduled', update menjadi 'live'
            if (matchStatus === 'scheduled') {
              callSetLiveApi(liveWar);
              setMatchStatus('live'); // Update status internal
            }
            
            // Jika war sudah selesai, hentikan polling
            if (liveWar.state === 'warEnded') {
              if (isMounted) setIsLoading(false);
              return; // Hentikan timer
            }
            
          } else {
            setWarData(null);
            setError(
              `Klan ${team1ClanTag} sedang war, tapi lawannya bukan ${team2ClanTag}.`,
            );
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Polling error:', err);
        setError(err.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          // Set timer untuk polling berikutnya (jika war belum berakhir)
          if(warData?.state !== 'warEnded') {
            timer = setTimeout(fetchWarData, 30000); // Poll setiap 30 detik
          }
        }
      }
    };

    // Panggil fetch pertama kali
    fetchWarData();

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  // [EDIT] 'matchStatus' ditambahkan sebagai dependensi
  }, [team1ClanTag, team2ClanTag, match.status, match.id, tournamentId, onSetLive, warData, matchStatus]); 

  // Tampilan Loading Awal
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-8 text-center">
        <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold" />
        <p className="mt-2 text-coc-font-secondary">Mencari Live War...</p>
      </div>
    );
  }

  // Tampilan Error atau Menunggu
  if (error && !warData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-yellow-700 bg-yellow-900/30 p-8 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-yellow-400" />
        <p className="mt-2 font-semibold text-yellow-300">{error}</p>
        <p className="text-sm text-yellow-500">
          Data akan diperbarui otomatis setiap 30 detik.
        </p>
      </div>
    );
  }

  // Tampilan Sukses: Tampilkan Komponen Live War
  if (warData && team1ClanTag) {
    return <CurrentWarDisplay currentWar={warData} ourClanTag={team1ClanTag} />;
  }

  // Fallback jika tidak loading, tidak error, tapi belum ada warData (misal: belum check-in)
  return null;
};
// --- [AKHIR EDIT FASE 6 (Tambahan)] ---


/**
 * @component MatchDetailClient
 * Komponen Client utama yang menggabungkan semua bagian.
 */
const MatchDetailClient: React.FC<MatchDetailClientProps> = ({
  tournament,
  initialMatchData,
}) => {
  // State untuk data match, agar bisa di-update setelah check-in
  const [matchData, setMatchData] = useState<FullMatchData>(initialMatchData);

  // Callback untuk mengupdate state setelah check-in berhasil
  const handleCheckInSuccess = (updatedMatch: FullMatchData) => {
    setMatchData((prev) => ({ ...prev, ...updatedMatch })); // Gabungkan data
  };

  // --- [BARU FASE 6 (Tambahan)] ---
  // Callback untuk mengupdate state saat LiveWarTracker menemukan war
  const handleSetLive = (liveWar: CocCurrentWar) => {
    setMatchData((prevData) => ({
      ...prevData,
      status: 'live',
      liveWarData: liveWar,
    }));
  };
  // --- [AKHIR BARU FASE 6 (Tambahan)] ---


  // Cek apakah kedua tim sudah check-in
  const allCheckedIn = !!matchData.team1ClanTag && !!matchData.team2ClanTag;
  const isLiveOrScheduled =
    matchData.status === 'live' || matchData.status === 'scheduled';

  return (
    <div className="space-y-6">
      {/* 1. Header (Tim vs Tim) */}
      <MatchHeader match={matchData} tournamentTitle={tournament.title} />

      {/* 2. Info Status, Jadwal, Ronde */}
      <MatchStatusInfo match={matchData} />

      {/* 3. Panel Live War (DIGANTI DENGAN LOGIC BARU) */}
      {(isLiveOrScheduled && allCheckedIn) || matchData.status === 'live' ? (
        <section className="rounded-lg border-2 border-coc-gold/50 bg-coc-dark-blue p-6 shadow-lg">
          <h2 className="mb-4 font-clash text-3xl font-bold text-coc-gold">
            Live War
          </h2>
          {/* Komponen tracker baru yang menangani polling dan tampilan */}
          {/* [EDIT FASE 6 (Tambahan)] Kirim props baru */}
          <LiveWarTracker
            match={matchData}
            tournamentId={tournament.id}
            onSetLive={handleSetLive}
          />
        </section>
      ) : null}

      {/* 4. Panel Check-in (Grid 2 kolom) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TeamCheckInCard
          team={matchData.team1}
          teamSide="team1"
          match={matchData}
          tournamentId={tournament.id}
          onCheckInSuccess={handleCheckInSuccess}
        />
        <TeamCheckInCard
          team={matchData.team2}
          teamSide="team2"
          match={matchData}
          tournamentId={tournament.id}
          onCheckInSuccess={handleCheckInSuccess}
        />
      </section>
    </div>
  );
};

export default MatchDetailClient;