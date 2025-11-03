import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';

// HANYA import fungsi yang diperlukan untuk validasi awal
import {
  getUserProfileAdmin,
  getManagedClanDataAdmin,
} from '@/lib/firestore-admin';

// HANYA import tipe yang diperlukan
import { UserProfile, ManagedClan } from '@/lib/types';
import ManageClanClient from './ManageClanClient';
import React from 'react';

export const metadata: Metadata = {
  title: 'Clashub | Manajemen Klan',
  description:
    'Kelola data klan Anda, lihat status sinkronisasi, dan fitur admin lainnya.',
};

/**
 * Helper untuk mengubah objek Date di properti tingkat atas menjadi string ISO
 * untuk serialisasi yang aman saat meneruskan data dari Server ke Client Component.
 * @param obj Data input yang mungkin berisi objek Date.
 * @returns Objek yang identik dengan semua Date diubah menjadi string ISO.
 */
function serializeDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDates(item));
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value instanceof Date) {
        newObj[key] = value.toISOString(); // Konversi Date ke string ISO
      } else if (typeof value === 'object' && value !== null) {
        // Rekursif untuk objek bersarang
        newObj[key] = serializeDates(value);
      } else {
        newObj[key] = value;
      }
    }
  }
  return newObj;
}

// =========================================================================
// SERVER COMPONENT UTAMA (VERSI REFAKTOR V5)
// =========================================================================

/**
 * @component ClanManagementPage (Server Component)
 * Tugasnya HANYA memvalidasi autentikasi & otorisasi dasar,
 * lalu meneruskan data minimal (profile & clan) ke Client Component.
 */
const ClanManagementPage = async () => {
  const sessionUser = await getSessionUser();

  // 1. Route Protection (Authentication)
  if (!sessionUser) {
    redirect('/auth');
  }

  let userProfile: UserProfile | null = null;
  let clanData: ManagedClan | null = null;
  let serverError: string | null = null;

  try {
    // 2. Ambil Profil Pengguna
    userProfile = await getUserProfileAdmin(sessionUser.uid);

    const userClanId = userProfile?.clanId;

    // 3. Validasi Status Verifikasi dan Penautan Klan
    if (!userProfile?.isVerified || !userClanId) {
      serverError =
        'Akses Ditolak: Anda harus terverifikasi dan menautkan akun Clash of Clans Anda ke klan yang dikelola untuk mengakses halaman ini.';
    } else {
      // 4. Ambil Data Klan Minimal (HANYA ManagedClan)
      // Semua data lain (cache, members, requests, war, dll.) akan diambil
      // oleh Client Component di sisi client.
      clanData = (await getManagedClanDataAdmin(
        userClanId
      )) as ManagedClan | null;

      if (!clanData) {
        serverError =
          'Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.';
      }
    }
  } catch (error) {
    console.error(
      '[ClanPage Load] Server Error: Failed to load minimal clan data:',
      error
    );
    serverError =
      'Gagal memuat data dasar klan. (Detail: ' +
      (error instanceof Error ? error.message.split('\n')[0] : 'Unknown Error') +
      ')';

    // Jika profile gagal diambil, set ke object kosong untuk menghindari error render di client
    if (!userProfile) {
      // Buat UserProfile 'kosong' palsu jika terjadi error parah
      // Ini lebih aman daripada mengirim 'null' jika 'ManageClanClient' tidak menanganinya
      userProfile = {
        uid: sessionUser.uid,
        email: sessionUser.email || '',
        displayName: sessionUser.displayName || 'Error User',
        // Properti 'avatarUrl' opsional (?), jadi bisa diabaikan
        isVerified: false,
        clanId: null,
        playerTag: '', // Sesuai tipe 'string' (wajib)
        role: undefined, // Sesuai tipe '?' (opsional)
        thLevel: 0, // FIX BARU: Menambahkan properti 'thLevel' (wajib)
        trophies: 0, // FIX BARU: Menambahkan properti 'trophies' (wajib)
        // Properti opsional lain (inGameName, clanTag, clanRole, dll.) bisa diabaikan
      };
    }
  }

  // 5. Serialisasi data minimal sebelum dikirim ke Client Component
  // (Mengkonversi objek Date menjadi string ISO)
  const finalProfile = userProfile ? serializeDates(userProfile) : null;
  const finalClanData = clanData ? serializeDates(clanData) : null;

  // 6. Render Client Component dengan props yang BENAR
  return (
    <ManageClanClient
      clan={finalClanData}
      profile={finalProfile}
      serverError={serverError}
    />
  );
};

export default ClanManagementPage;

