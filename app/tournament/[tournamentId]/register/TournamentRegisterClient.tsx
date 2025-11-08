'use client';

import React, { useState } from 'react';
import {
  Tournament,
  UserProfile,
  ManagedClan,
  EsportsTeam,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
// [PERBAIKAN] Impor Notification dan tipenya
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  AlertTriangleIcon,
  // [PERBAIKAN] CheckCircleIcon dihapus, karena sudah di-handle oleh Notification.tsx
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
  // [PERBAIKAN] Mengganti state error/success menjadi satu state notification
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  /**
   * Menangani proses submit pendaftaran tim ke API.
   */
  const handleRegister = async () => {
    // [PERBAIKAN] Menggunakan setNotification untuk error
    if (!selectedTeamId) {
      setNotification({
        message: 'Anda harus memilih satu tim untuk didaftarkan.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsLoading(true);
    // [PERBAIKAN] Reset notifikasi
    setNotification(null);

    try {
      // Panggil API endpoint yang akan kita buat selanjutnya
      // [PERBAIKAN] Path API diubah agar konsisten (jamak)
      const response = await fetch(
        `/api/tournaments/${tournament.id}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // [PERBAIKAN] Kirim data yang lebih lengkap untuk API
            selectedTeamId: selectedTeamId,
            selectedTeamName:
              esportsTeams.find((t) => t.id === selectedTeamId)?.teamName || '',
            clanId: managedClan?.id,
            clanTag: managedClan?.tag,
            clanName: managedClan?.name,
            clanBadgeUrl:
              managedClan?.logoUrl ||
              '/images/clan-badge-placeholder.png', // Fallback badge
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftarkan tim.');
      }

      // [PERBAIKAN] Menggunakan setNotification untuk sukses
      setNotification({
        message: `Tim Anda (${
          esportsTeams.find((t) => t.id === selectedTeamId)?.teamName
        }) berhasil didaftarkan!`,
        type: 'success',
        onClose: () => setNotification(null),
      });
    } catch (err: any) {
      console.error('Error mendaftar turnamen:', err);
      // [PERBAIKAN] Menggunakan setNotification untuk error
      setNotification({
        message: err.message || 'Terjadi kesalahan. Silakan coba lagi.',
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render kondisi jika user tidak di klan terkelola
  if (!managedClan) {
    return (
      <div className="card-stone p-6 text-center">
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
  // [PERBAIKAN] Cek juga apakah user adalah Team Leader atau Clan Owner
  const isClanLeader = userProfile.uid === managedClan.ownerUid;
  const userLedTeams = esportsTeams.filter(
    (team) => team.teamLeaderUid === userProfile.uid,
  );

  if (esportsTeams.length === 0 || (!isClanLeader && userLedTeams.length === 0)) {
    return (
      <div className="card-stone p-6 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold clash-font mb-2">
          Tim E-Sports Tidak Ditemukan
        </h3>
        <p className="text-muted-foreground">
          {isClanLeader
            ? `Klan Anda (${managedClan.name}) belum memiliki Tim E-Sports.`
            : `Anda bukan Pimpinan Tim E-Sports di klan ${managedClan.name}.`}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {isClanLeader
            ? 'Silakan buat tim di Halaman Manajemen Klan.'
            : 'Hanya Pimpinan Klan atau Pimpinan Tim E-Sports yang dapat mendaftarkan tim.'}
        </p>
        {isClanLeader && (
          <Button
            variant="secondary"
            className="mt-4"
            href="/clan/manage" // Arahkan ke halaman manajemen klan
          >
            Buka Manajemen Klan
          </Button>
        )}
      </div>
    );
  }

  // [PERBAIKAN] Tampilkan hanya tim yang bisa didaftarkan oleh user
  // (User adalah Clan Leader ATAU Team Leader dari tim tsb)
  const availableTeams = isClanLeader
    ? esportsTeams
    : userLedTeams;

  // Render form pendaftaran jika semua syarat terpenuhi
  return (
    <>
      {/* [BARU] Container untuk notifikasi (toast) */}
      {notification && <Notification notification={notification} />}

      <div className="card-stone p-6">
        <h3 className="text-lg font-semibold mb-4 border-b border-coc-gold-dark/20 pb-2 clash-font">
          Pilih Tim E-Sports dari {managedClan.name}
        </h3>

        <div className="space-y-3 mb-6">
          {availableTeams.map((team) => (
            <label
              key={team.id}
              className={`flex items-center p-4 rounded-lg border transition-all cursor-pointer ${
                selectedTeamId === team.id
                  ? 'bg-coc-primary-light/20 border-coc-primary-light ring-2 ring-coc-primary-light'
                  : 'bg-coc-dark-blue/30 border-coc-border hover:bg-coc-dark-blue/60'
              }`}
            >
              <input
                type="radio"
                name="esportsTeam"
                value={team.id}
                checked={selectedTeamId === team.id}
                onChange={() => setSelectedTeamId(team.id)}
                className="mr-4 h-5 w-5 text-coc-primary bg-coc-dark-blue border-coc-border focus:ring-coc-primary ring-offset-coc-dark-blue"
              />
              <div>
                <span className="font-semibold text-coc-font-primary">
                  {team.teamName}
                </span>
                <p className="text-xs text-coc-font-secondary">
                  {/* [PERBAIKAN] Tampilkan nama leader jika user adalah clan leader */}
                  {isClanLeader && team.teamLeaderUid !== userProfile.uid
                    ? `Leader: ${team.teamLeaderUid}` // Nanti ganti nama
                    : 'Tim Anda'}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* [PERBAIKAN] Area Notifikasi (Error/Success) dihapus dari sini */}

        <Button
          variant="primary"
          size="lg"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleRegister}
          disabled={isLoading || !selectedTeamId || !!notification?.message} // Nonaktifkan jika sedang loading, belum pilih tim, atau ada notifikasi
        >
          {isLoading ? (
            <>
              <Loader2Icon className="w-5 h-5 animate-spin" />
              <span>Mendaftarkan...</span>
            </>
          ) : !!notification?.message && notification.type === 'success' ? (
            'Berhasil Terdaftar'
          ) : (
            'Daftarkan Tim'
          )}
        </Button>
      </div>
    </>
  );
}