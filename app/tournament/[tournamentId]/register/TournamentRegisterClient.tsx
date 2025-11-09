'use client';

// [FASE 3] ROMBAK TOTAL
// File ini dirombak total untuk FASE 3 Peta Develop.
// - Menggunakan hooks (useAuth, useManagedClanCache) untuk mengambil data, bukan props.
// - Menghapus logika EsportsTeam yang lama.
// - Menambahkan form input 'teamName'.
// - Menambahkan UI multi-select member dari daftar 'clanCache.members'.
// - Menambahkan validasi TH (CEK 1, 2, 3) di sisi klien.

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Tournament,
  TournamentTeamMember,
  UserProfile,
} from '@/lib/clashub.types';
import { CocMember } from '@/lib/coc.types'; // Diperlukan untuk tipe member
import { ClanRole } from '@/lib/enums'; // Diperlukan untuk cek role
import { useAuth } from '@/app/context/AuthContext';
import { useManagedClanCache } from '@/lib/hooks/useManagedClan';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  AlertTriangleIcon,
  CheckIcon, // <-- [PERBAIKAN ERROR 2] Impor CheckIcon
} from '@/app/components/icons/ui-feedback';
import {
  UsersIcon,
  UserPlusIcon,
  CrownIcon,
} from '@/app/components/icons/ui-user';
// [PERBAIKAN ERROR 1] Memisahkan impor XIcon dan PlusIcon
import { PlusIcon } from '@/app/components/icons/ui-actions';
import { XIcon } from '@/app/components/icons/ui-general';
import { getThImage, validateTeamThRequirements } from '@/lib/th-utils'; // Impor validasi TH

// Tipe properti baru: Hanya menerima 'tournament'
interface TournamentRegisterClientProps {
  tournament: Tournament;
}

/**
 * Komponen Client-side untuk menangani logika pendaftaran turnamen (FASE 3).
 */
export default function TournamentRegisterClient({
  tournament,
}: TournamentRegisterClientProps) {
  const { userProfile } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<CocMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  // FASE 3 - Step 1: Muat Data
  // Ambil data clan yang di-manage user menggunakan hook
  // [PERBAIKAN ERROR 3] Destrukturisasi payload baru (clanData dan clanCache)
  const {
    clanData,
    clanCache,
    isLoading: isLoadingClan,
  } = useManagedClanCache(userProfile?.clanId || '');

  // Ambil data ManagedClan dari UserProfile dan hook
  const managedClan = useMemo(() => {
    if (!userProfile || !userProfile.clanId) return null;
    return {
      id: userProfile.clanId,
      tag: userProfile.clanTag!,
      name: userProfile.clanName!,
      // [PERBAIKAN ERROR 3] Ambil logoUrl dari clanData (dokumen induk)
      badgeUrl:
        clanData?.logoUrl || '/images/clan-badge-placeholder.png',
    };
  }, [userProfile, clanData]); // [PERBAIKAN ERROR 3] Ganti dependensi ke clanData

  // Cek apakah user adalah Leader atau Co-Leader
  const isUserLeaderOrCo =
    userProfile?.clanRole === ClanRole.LEADER ||
    userProfile?.clanRole === ClanRole.CO_LEADER;

  // Tentukan daftar member yang bisa didaftarkan
  const availableMembers = useMemo(() => {
    // [PERBAIKAN ERROR 3] Ambil members dari clanCache
    const allMembers = clanCache?.members || [];

    // Jika user adalah Leader/Co, dia bisa mendaftarkan siapa saja
    if (isUserLeaderOrCo) {
      return allMembers;
    }

    // Jika user adalah member biasa, dia hanya bisa mendaftarkan dirinya sendiri
    // (jika profilnya ditemukan di cache)
    if (userProfile?.playerTag) {
      const self = allMembers.find((m) => m.tag === userProfile.playerTag);
      return self ? [self] : [];
    }

    return [];
  }, [clanCache?.members, userProfile?.playerTag, isUserLeaderOrCo]);

  /**
   * Menangani pemilihan member.
   */
  const handleMemberSelect = (member: CocMember) => {
    // Cek duplikat
    if (selectedMembers.find((m) => m.tag === member.tag)) return;

    // Cek batas ukuran tim
    if (selectedMembers.length >= tournament.teamSize) {
      setNotification({
        message: `Anda hanya dapat memilih ${tournament.teamSize} pemain untuk format ${tournament.format}.`,
        type: 'warning',
        onClose: () => setNotification(null),
      });
      return;
    }

    setSelectedMembers((prev) => [...prev, member]);
  };

  /**
   * Menangani pembatalan pemilihan member.
   */
  const handleMemberDeselect = (memberTag: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.tag !== memberTag));
  };

  /**
   * Menangani proses submit pendaftaran tim ke API.
   */
  const handleRegister = async () => {
    setIsLoading(true);
    setNotification(null);

    // --- FASE 3 - Step 3: Validasi (Sisi Klien) ---

    // 1. Validasi Nama Tim
    if (!teamName.trim()) {
      setNotification({
        message: 'Nama Tim tidak boleh kosong.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    // 2. CEK 1: Validasi Jumlah Pemain
    if (selectedMembers.length !== tournament.teamSize) {
      setNotification({
        message: `Jumlah pemain tidak sesuai. Turnamen ini memerlukan ${tournament.teamSize} pemain.`,
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    // 3. Format data member untuk validasi TH
    const teamToValidate: TournamentTeamMember[] = selectedMembers.map(
      (member) => ({
        playerTag: member.tag,
        playerName: member.name,
        townHallLevel: member.townHallLevel,
      }),
    );

    // 4. CEK 2 & 3: Validasi Aturan TH
    const thValidation = validateTeamThRequirements(
      teamToValidate,
      tournament.thRequirement,
    );

    if (!thValidation.isValid) {
      setNotification({
        message: thValidation.message, // Tampilkan pesan error spesifik dari validator
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    // --- Panggil API (FASE 3 - Step 2) ---
    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Data baru yang dikirim ke API
            teamName: teamName.trim(),
            members: teamToValidate, // Kirim array member yang sudah divalidasi
            originClanTag: managedClan?.tag,
            originClanBadgeUrl: managedClan?.badgeUrl,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftarkan tim.');
      }

      setNotification({
        message: `Tim "${teamName.trim()}" berhasil didaftarkan! Menunggu persetujuan panitia.`,
        type: 'success',
        onClose: () => setNotification(null),
      });
      // Nonaktifkan form setelah berhasil
      setTeamName('');
      setSelectedMembers([]);
    } catch (err: any) {
      console.error('Error mendaftar turnamen:', err);
      setNotification({
        message: err.message || 'Terjadi kesalahan. Silakan coba lagi.',
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Kondisi Loading dan Error ---

  if (isLoadingClan) {
    return (
      <div className="card-stone p-6 text-center flex items-center justify-center gap-2">
        <Loader2Icon className="w-6 h-6 animate-spin" />
        <span className="text-muted-foreground">Memuat data klan...</span>
      </div>
    );
  }

  if (!userProfile || !managedClan) {
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

  if (availableMembers.length === 0) {
    return (
      <div className="card-stone p-6 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold clash-font mb-2">
          Tidak Memenuhi Syarat
        </h3>
        <p className="text-muted-foreground">
          Anda tidak dapat mendaftar. Hanya Leader/Co-Leader yang dapat
          mendaftarkan tim, atau Anda harus mendaftarkan diri sendiri (dan akun
          Anda harus terverifikasi di klan ini).
        </p>
      </div>
    );
  }

  // --- Render Form Pendaftaran (FASE 3 - Step 2) ---
  return (
    <>
      {notification && <Notification notification={notification} />}

      <div className="card-stone p-6">
        <h3 className="text-lg font-semibold mb-4 border-b border-coc-gold-dark/20 pb-2 clash-font">
          Daftarkan Tim Baru (dari {managedClan.name})
        </h3>

        {/* Step 1: Input Nama Tim */}
        <div className="mb-4">
          <label
            htmlFor="teamName"
            className="block text-sm font-medium text-coc-font-secondary mb-1"
          >
            Nama Tim
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Masukkan nama tim Anda..."
            className="input-base" // Asumsi 'input-base' dari globals.css
            maxLength={30}
          />
        </div>

        {/* Step 2: Pilih Member */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-coc-font-secondary mb-2">
            Pilih Pemain ({selectedMembers.length} / {tournament.teamSize})
          </label>

          {/* Container untuk member yang dipilih */}
          <div className="mb-4 rounded-lg bg-coc-dark-blue/30 p-3 min-h-[60px]">
            {selectedMembers.length === 0 ? (
              <p className="text-sm text-center text-coc-font-secondary/50 py-2">
                Pilih {tournament.teamSize} pemain dari daftar di bawah...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.tag}
                    className="flex items-center gap-2 bg-coc-primary-light/20 text-coc-primary-light py-1 px-3 rounded-full text-sm font-medium"
                  >
                    <Image
                      src={getThImage(member.townHallLevel)}
                      alt={`TH${member.townHallLevel}`}
                      width={20}
                      height={20}
                    />
                    <span>{member.name}</span>
                    <button
                      onClick={() => handleMemberDeselect(member.tag)}
                      className="text-coc-primary-light/70 hover:text-white"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daftar member yang tersedia */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {availableMembers.map((member) => {
              const isSelected = selectedMembers.some(
                (m) => m.tag === member.tag,
              );
              const isFull =
                selectedMembers.length >= tournament.teamSize;
              const isLeaderOrCo =
                member.role === 'leader' || member.role === 'coLeader';

              return (
                <div
                  key={member.tag}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-coc-dark-blue/80 border-coc-primary-light'
                      : 'bg-coc-dark-blue/30 border-coc-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={getThImage(member.townHallLevel)}
                      alt={`TH${member.townHallLevel}`}
                      width={32}
                      height={32}
                    />
                    <div>
                      <span
                        className={`font-semibold ${
                          isSelected
                            ? 'text-coc-font-primary'
                            : 'text-coc-font-secondary'
                        }`}
                      >
                        {member.name}
                      </span>
                      <p className="text-xs text-coc-font-secondary/70 flex items-center gap-1">
                        {isLeaderOrCo && (
                          <CrownIcon className="w-3 h-3 text-coc-gold" />
                        )}
                        <span>{member.role}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMemberSelect(member)}
                    disabled={isSelected || (isFull && !isSelected)}
                    className="px-2 py-1"
                  >
                    {isSelected ? (
                      <CheckIcon className="w-5 h-5 text-coc-green" />
                    ) : (
                      <PlusIcon className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Tombol Aksi */}
        <Button
          variant="primary"
          size="lg"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleRegister}
          disabled={
            isLoading ||
            selectedMembers.length !== tournament.teamSize ||
            !teamName.trim()
          }
        >
          {isLoading ? (
            <>
              <Loader2Icon className="w-5 h-5 animate-spin" />
              <span>Mendaftarkan...</span>
            </>
          ) : (
            <>
              <UserPlusIcon className="w-5 h-5" />
              <span>Daftarkan Tim</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}