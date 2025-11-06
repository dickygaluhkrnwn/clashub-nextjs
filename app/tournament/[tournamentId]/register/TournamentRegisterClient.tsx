'use client';

import React, { useState } from 'react';
import {
  Tournament,
  UserProfile,
  ManagedClan,
  EsportsTeam,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import {
  Loader2Icon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from '@/app/components/icons/ui-feedback'; // Menggunakan ikon dari file yang Anda berikan

// Tipe properti untuk komponen client ini
interface TournamentRegisterClientProps {
  tournament: Tournament;
  userProfile: UserProfile;
  managedClan: ManagedClan | null;
  esportsTeams: EsportsTeam[];
}

/**
 * Komponen Client-side untuk menangani logika pendaftaran turnamen.
 */
export default function TournamentRegisterClient({
  tournament,
  userProfile,
  managedClan,
  esportsTeams,
}: TournamentRegisterClientProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Menangani proses submit pendaftaran tim ke API.
   */
  const handleRegister = async () => {
    if (!selectedTeamId) {
      setError('Anda harus memilih satu tim untuk didaftarkan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Panggil API endpoint yang akan kita buat selanjutnya
      const response = await fetch(
        `/api/tournament/${tournament.id}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: selectedTeamId,
            clanId: managedClan?.id, // Kirim clanId untuk validasi
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mendaftarkan tim.');
      }

      setSuccess(
        `Tim Anda (${
          esportsTeams.find((t) => t.id === selectedTeamId)?.teamName
        }) berhasil didaftarkan!`,
      );
      // TODO: Kita mungkin ingin menonaktifkan form setelah berhasil
    } catch (err: any) {
      console.error('Error mendaftar turnamen:', err);
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render kondisi jika user tidak di klan terkelola
  if (!managedClan) {
    return (
      <div className="bg-background-card p-6 rounded-lg shadow-lg border border-gray-700 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold clash-font mb-2">
          Klan Tidak Terkelola
        </h3>
        <p className="text-muted-foreground">
          Anda harus menjadi anggota dari klan yang dikelola di Clashub untuk
          dapat mendaftarkan tim ke turnamen.
        </p>
      </div>
    );
  }

  // Render kondisi jika klan terkelola tapi tidak punya tim e-sports
  if (esportsTeams.length === 0) {
    return (
      <div className="bg-background-card p-6 rounded-lg shadow-lg border border-gray-700 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold clash-font mb-2">
          Tim E-Sports Tidak Ditemukan
        </h3>
        <p className="text-muted-foreground">
          Klan Anda ({managedClan.name}) tidak memiliki Tim E-Sports yang
          terkonfigurasi.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Silakan hubungi Leader klan Anda untuk membuat tim di halaman
          Manajemen Klan.
        </p>
      </div>
    );
  }

  // Render form pendaftaran jika semua syarat terpenuhi
  return (
    <div className="bg-background-card p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 border-b border-gray-600 pb-2 clash-font">
        Pilih Tim E-Sports dari {managedClan.name}
      </h3>

      <div className="space-y-3 mb-6">
        {esportsTeams.map((team) => (
          <label
            key={team.id}
            className={`flex items-center p-4 rounded-lg border transition-all cursor-pointer ${
              selectedTeamId === team.id
                ? 'bg-blue-900/50 border-blue-600 ring-2 ring-blue-500'
                : 'bg-coc-stone-light/10 border-gray-700 hover:bg-coc-stone-light/20'
            }`}
          >
            <input
              type="radio"
              name="esportsTeam"
              value={team.id}
              checked={selectedTeamId === team.id}
              onChange={() => setSelectedTeamId(team.id)}
              className="mr-4 h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-600 ring-offset-background-card"
            />
            <div>
              <span className="font-semibold text-white">
                {team.teamName}
              </span>
              <p className="text-xs text-gray-400">
                Leader: {team.teamLeaderUid} (Nanti kita ganti UID ini dengan
                nama)
              </p>
            </div>
          </label>
        ))}
      </div>

      {/* Area Notifikasi (Error/Success) */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm">
          <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-900/50 border border-green-700 text-green-300 p-3 rounded-md mb-4 text-sm">
          <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleRegister}
        disabled={isLoading || !selectedTeamId || !!success} // Nonaktifkan jika sedang loading, belum pilih tim, atau sudah berhasil
      >
        {isLoading ? (
          <>
            <Loader2Icon className="w-5 h-5 animate-spin" />
            <span>Mendaftarkan...</span>
          </>
        ) : (
          'Daftarkan Tim'
        )}
      </Button>
    </div>
  );
}