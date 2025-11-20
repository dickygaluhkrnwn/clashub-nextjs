// File: app/api/coc/verify-player/route.ts
// Deskripsi: API Route untuk memproses verifikasi Player Tag Clash of Clans
// menggunakan Token Verifikasi In-Game. 
// [PERBAIKAN CRITICAL]: Menggunakan Admin SDK sepenuhnya untuk menghindari isu Cache/Permission Client SDK.
// [PERBAIKAN TIPE]: Memperbaiki validasi token yang mengembalikan boolean (sesuai error log).

import { NextRequest, NextResponse } from 'next/server';
import cocApi from '@/lib/coc-api';
// [PERBAIKAN] Hapus import Client SDK (getManagedClanByTag, getUserProfile)
import { createOrLinkManagedClan } from '@/lib/firestore-admin'; 
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections'; // Pastikan import ini ada
import { getSessionUser } from '@/lib/server-auth';
import {
  PlayerVerificationRequest,
  UserProfile,
  ClanRole,
  CocPlayer,
} from '@/lib/types';

// --- HELPER: Map Role CoC API string ke Clashub Role string ---
const mapCocRoleToClashubRole = (cocRole: ClanRole): UserProfile['role'] => {
  switch (cocRole) {
    case ClanRole.LEADER:
      return 'Leader';
    case ClanRole.CO_LEADER:
      return 'Co-Leader';
    case ClanRole.ELDER:
      return 'Elder';
    case ClanRole.MEMBER:
      return 'Member';
    case ClanRole.NOT_IN_CLAN:
    default:
      return 'Free Agent';
  }
};

/**
 * @function POST
 * Menangani permintaan POST untuk memverifikasi token pemain.
 */
export async function POST(request: NextRequest) {
  let playerTag: string = ''; 
  let encodedPlayerTag: string = '';

  try {
    // 1. Otorisasi Pengguna
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthorized: Sesi pengguna tidak ditemukan.' },
        { status: 401 }
      );
    }
    const uid = authUser.uid;

    // 2. Ambil dan Validasi Payload
    const payload = (await request.json()) as PlayerVerificationRequest;
    playerTag = payload.playerTag;
    const apiToken = payload.apiToken;

    if (!playerTag || !apiToken) {
      return NextResponse.json(
        { message: 'Player tag dan token verifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    // Encode Tag
    const cleanedTag = playerTag.trim().toUpperCase();
    const tagWithHash = cleanedTag.startsWith('#') ? cleanedTag : `#${cleanedTag}`;
    encodedPlayerTag = encodeURIComponent(tagWithHash);

    // --- LOGIKA API ---

    // 3. Verifikasi Token
    // [PERBAIKAN FIX ERROR TS 2339] verifyPlayerToken mengembalikan boolean (true/false)
    // Error log: Property 'status' does not exist on type 'boolean'.
    const isTokenValid = await cocApi.verifyPlayerToken(encodedPlayerTag, apiToken);
    
    if (!isTokenValid) {
       throw new Error('Token tidak valid');
    }
    
    console.log(`[VERIFIKASI] Token valid untuk ${playerTag}`);

    // 4. Ambil Data Pemain
    const cocPlayerData: CocPlayer = await cocApi.getPlayerData(encodedPlayerTag);
    
    // Map role
    const cocApiRole = cocPlayerData.clan 
        ? (cocPlayerData.role?.toLowerCase() as ClanRole) || ClanRole.MEMBER
        : ClanRole.NOT_IN_CLAN;

    let clashubRole: UserProfile['role'] = mapCocRoleToClashubRole(cocApiRole); 
    let managedClanId: string | null = null;
    let managedClanName: string | null = null;

    if (cocPlayerData.clan) {
      // Cek apakah klan ini sudah terdaftar di sistem kita (Managed Clan)
      // [PERBAIKAN UTAMA]: Query menggunakan Admin SDK, bukan Client SDK
      const clanQuery = await adminFirestore
        .collection(COLLECTIONS.MANAGED_CLANS)
        .where('tag', '==', cocPlayerData.clan.tag)
        .limit(1)
        .get();

      const existingClanDoc = !clanQuery.empty ? clanQuery.docs[0] : null;

      if (cocApiRole === ClanRole.LEADER || cocApiRole === ClanRole.CO_LEADER) {
        // [SCENARIO 1]: MANAGER
        try {
          // Jika klan sudah ada, kita hanya ambil ID-nya. 
          // Jika belum, createOrLinkManagedClan akan membuatnya.
          managedClanId = await createOrLinkManagedClan(
            cocPlayerData.clan.tag, 
            cocPlayerData.clan.name,
            uid
          );
          managedClanName = cocPlayerData.clan.name;
          console.log(`[VERIFIKASI] Manager ${uid} linked to Clan ${managedClanId}`);
        } catch (clanLinkError) {
          console.error(`[VERIFIKASI] Error linking clan:`, clanLinkError);
        }
      } else {
        // [SCENARIO 2]: ANGGOTA (MEMBER/ELDER)
        if (existingClanDoc) {
          managedClanId = existingClanDoc.id;
          managedClanName = existingClanDoc.data().name;
          console.log(`[VERIFIKASI] Member ${uid} found existing ManagedClan ${managedClanId}`);
        } else {
          console.log(`[VERIFIKASI] Member ${uid} verified, but clan ${cocPlayerData.clan.tag} is not managed yet.`);
        }
        
        // Nama klan tetap di-set dari data CoC agar tampilan UI bagus
        if (!managedClanName) managedClanName = cocPlayerData.clan.name;
      }
    } else {
      // [SCENARIO 3]: FREE AGENT
      clashubRole = 'Free Agent';
      managedClanName = null;
      managedClanId = null;
    }

    // 6. Siapkan data update
    const updateData: Partial<UserProfile> = {
      isVerified: true,
      playerTag: cocPlayerData.tag, 
      inGameName: cocPlayerData.name,
      thLevel: cocPlayerData.townHallLevel,
      trophies: cocPlayerData.trophies,
      lastVerified: new Date(), // Akan dikonversi Firestore Admin secara otomatis
      
      // Data Clan & Role
      clanTag: cocPlayerData.clan?.tag || null,
      clanRole: cocApiRole,
      role: clashubRole,
      clanId: managedClanId, // Pastikan field ini tersimpan!
      clanName: managedClanName,
    };
    
    // 7. Simpan ke Firestore (Admin SDK)
    const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
    
    // Bersihkan undefined
    const cleanedData = JSON.parse(JSON.stringify(updateData)); 
    // Note: JSON.parse/stringify menghapus undefined, tapi mengubah Date jadi string. 
    // Kita perlu kembalikan Date object untuk lastVerified.
    if (updateData.lastVerified) cleanedData.lastVerified = updateData.lastVerified;

    await userRef.set(cleanedData, { merge: true });
    
    console.log(`[VERIFIKASI] Profil diperbarui untuk UID: ${uid}. Role: ${clashubRole}, ClanId: ${managedClanId}`);

    // 8. Ambil Data Terbaru untuk Respon (Admin SDK Read)
    // Menggunakan Client SDK 'getUserProfile' di sini bisa menyebabkan race condition pembacaan.
    // Kita gunakan data yang baru saja kita tulis + data lama yang diambil via Admin SDK.
    const freshUserSnap = await userRef.get();
    const freshUserData = freshUserSnap.exists ? { id: freshUserSnap.id, ...freshUserSnap.data() } : null;

    return NextResponse.json(
      {
        message: 'Verifikasi sukses! Profil Clash of Clans Anda telah ditautkan.',
        profile: freshUserData, // Kembalikan data fresh dari Admin SDK
        clan: cocPlayerData.clan || null,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(
      `API Verifikasi Error untuk PlayerTag: ${playerTag}. Detail:`,
      error
    );
    
    let errorMessage = 'Terjadi kesalahan tidak diketahui saat verifikasi.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('404') || errorMessage.includes('notFound')) {
        statusCode = 404;
        errorMessage = `Pemain dengan tag ${playerTag} tidak ditemukan.`;
      } else if (errorMessage.includes('invalid') || errorMessage.includes('400') || errorMessage.includes('Token tidak valid')) {
        statusCode = 400;
        errorMessage = `Token API atau Player Tag salah.`;
      } else if (errorMessage.includes('403')) {
        statusCode = 403;
        errorMessage = `Akses ke API CoC ditolak (Maintenance/IP blocked).`;
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}