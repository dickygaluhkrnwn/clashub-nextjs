'use client';

// File: app/tournament/[tournamentId]/manage/StaffManager.tsx
// Deskripsi: [BARU - FASE 5] Komponen untuk mengelola staf (panitia) turnamen.

import React, { useState, useEffect } from 'react';
import {
  FirestoreDocument,
  Tournament,
  UserProfile,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
// [PERBAIKAN 1] Hapus ekstensi .tsx dari impor Input
import { Input } from '@/app/components/ui/Input';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  UserPlusIcon,
  TrashIcon,
  Loader2Icon,
  CrownIcon,
  AlertTriangleIcon,
} from '@/app/components/icons';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';

interface StaffManagerProps {
  tournament: FirestoreDocument<Tournament>;
  isOrganizer: boolean; // Diterima dari page.tsx (Server Component)
}

type StaffProfile = Pick<
  UserProfile,
  'uid' | 'displayName' | 'avatarUrl' | 'email'
>;

const StaffManager: React.FC<StaffManagerProps> = ({
  tournament,
  isOrganizer,
}) => {
  const { currentUser } = useAuth(); // Untuk mengecek UID diri sendiri
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null); // Menyimpan UID yang sedang dihapus
  
  // [PERBAIKAN 2] Tipe state harus NotificationProps | null, bukan mengambil properti 'notification'
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // 1. Fungsi untuk Fetch Profil Staf
  const fetchStaffProfiles = async () => {
    setIsLoading(true);
    const uidsToFetch = [
      tournament.organizerUid,
      ...tournament.committeeUids,
    ];

    try {
      // Kita perlu API route baru untuk mengambil data user berdasarkan array UID
      // Sesuai roadmap, kita akan buat API ini nanti.
      // Untuk sekarang, kita buat call-nya:
      const response = await fetch('/api/users/profiles-by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids: uidsToFetch }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengambil data staf.');
      }

      setStaffProfiles(result.profiles || []);
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. useEffect untuk fetch data saat komponen dimuat
  useEffect(() => {
    fetchStaffProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.organizerUid, tournament.committeeUids]); // <-- Dijalankan jika daftar staf berubah

  // 3. Handler untuk Mengundang Panitia
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !isOrganizer) return;

    setIsInviting(true);
    showNotification('Mengundang panitia...', 'info');

    try {
      // Kita perlu API route baru untuk ini (ROADMAP FASE 5)
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengundang panitia.');
      }

      showNotification(result.message, 'success');
      setInviteEmail(''); // Kosongkan input
      fetchStaffProfiles(); // Refresh daftar staf
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsInviting(false);
    }
  };

  // 4. Handler untuk Mengeluarkan Panitia
  const handleRemove = async (uidToRemove: string) => {
    if (!isOrganizer || uidToRemove === tournament.organizerUid) return;

    setIsRemoving(uidToRemove);
    showNotification('Mengeluarkan panitia...', 'info');

    try {
      // Kita perlu API route baru untuk ini (ROADMAP FASE 5)
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/remove`,
        {
          method: 'POST', // Menggunakan POST agar bisa kirim body
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uidToRemove: uidToRemove }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengeluarkan panitia.');
      }

      showNotification(result.message, 'success');
      fetchStaffProfiles(); // Refresh daftar staf
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* [PERBAIKAN] Ganti 'notification={notification}' 
        menjadi 'notification={notification ?? undefined}'
        Ini akan mengubah 'null' menjadi 'undefined' agar sesuai 
        dengan tipe props komponen <Notification>.
      */}
      <Notification notification={notification ?? undefined} />

      {/* Bagian 1: Form Undangan (Hanya untuk Organizer) */}
      {isOrganizer && (
        <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30">
          <h3 className="font-clash text-xl text-white mb-4">
            Undang Panitia Baru
          </h3>
          <p className="text-sm text-gray-400 mb-4 font-sans">
            Panitia yang diundang akan mendapatkan hak akses yang sama
            (kecuali mengeluarkan organizer) untuk mengelola turnamen ini.
          </p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Masukkan email user Clashub..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isInviting}
              className="flex-grow"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isInviting || !inviteEmail}
              className="w-full sm:w-auto"
            >
              {isInviting ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlusIcon className="h-5 w-5" />
              )}
              <span className="ml-2">{isInviting ? 'Mengundang...' : 'Undang'}</span>
            </Button>
          </form>
        </div>
      )}

      {/* Bagian 2: Daftar Staf Saat Ini */}
      <div>
        <h3 className="font-clash text-xl text-white mb-4">
          Staf & Panitia Saat Ini
        </h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold" />
          </div>
        ) : staffProfiles.length === 0 ? (
          <div className="card-stone p-8 text-center rounded-lg border border-coc-gold-dark/20">
             <AlertTriangleIcon className="h-10 w-10 text-coc-yellow/70 mx-auto mb-3" />
            <p className="text-gray-400">Gagal memuat data staf.</p>
            <Button variant="secondary" size="sm" onClick={fetchStaffProfiles} className="mt-3">Coba Lagi</Button>
          </div>
        ) : (
          <div className="card-stone rounded-lg overflow-hidden border border-coc-gold-dark/30">
            <ul className="divide-y divide-coc-gold-dark/30">
              {staffProfiles.map((staff) => {
                const isOrg = staff.uid === tournament.organizerUid;
                const isSelf = staff.uid === currentUser?.uid;

                return (
                  <li
                    key={staff.uid}
                    className="flex items-center justify-between p-4 bg-coc-dark/40 hover:bg-coc-dark/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={
                          staff.avatarUrl || '/images/placeholder-avatar.png'
                        }
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div>
                        <p className="text-base font-semibold text-white">
                          {staff.displayName}{' '}
                          {isSelf && (
                            <span className="text-xs text-coc-gold/80">(Anda)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400 font-mono">
                          {staff.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isOrg && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-coc-gold/10 text-coc-gold text-xs font-bold">
                          <CrownIcon className="h-4 w-4" />
                          <span>Organizer</span>
                        </div>
                      )}
                      
                      {/* Tombol Hapus (Hanya Organizer, tidak bisa hapus diri sendiri/organizer) */}
                      {isOrganizer && !isOrg && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemove(staff.uid)}
                          disabled={isRemoving === staff.uid}
                          className="px-2 py-1 h-8 w-8" // Tombol ikon kecil
                        >
                          {isRemoving === staff.uid ? (
                             <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                             <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;