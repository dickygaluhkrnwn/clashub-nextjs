// File: app/api/coc/verify-player/route.ts
// Deskripsi: API Route untuk memproses verifikasi Player Tag Clash of Clans
// menggunakan Token Verifikasi In-Game. (PERBAIKAN: API Flow, Tipe Data, Error Handling, Import Fix, Use Admin Function, Encoding Tag)

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Import fungsi Client SDK untuk read dan fungsi Admin SDK untuk write
// FIX: Menggunakan getManagedClanByTag dari lib/firestore untuk auto-sync member
import { getUserProfile, getManagedClanByTag } from '@/lib/firestore'; 
import { createOrLinkManagedClan } from '@/lib/firestore-admin'; // <<<--- IMPORT FUNGSI ADMIN DARI SINI
import { adminFirestore } from '@/lib/firebase-admin'; // Import adminFirestore untuk update user profile
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import {
  PlayerVerificationRequest,
  UserProfile,
  ClanRole,
  CocPlayer,
} from '@/lib/types'; // Import tipe data ClanRole dan CocPlayer


// --- HELPER BARU: Map Role CoC API string ke Clashub Role string ---
const mapCocRoleToClashubRole = (cocRole: ClanRole): UserProfile['role'] => {
      switch (cocRole) {
        case ClanRole.LEADER:
          return 'Leader';
        case ClanRole.CO_LEADER:
          return 'Co-Leader';
        case ClanRole.ELDER: // ClanRole.ELDER adalah 'admin'
          return 'Elder';
        case ClanRole.MEMBER:
          return 'Member';
        case ClanRole.NOT_IN_CLAN:
        default:
          return 'Free Agent'; // Jika tidak di klan atau role tidak dikenal
      }
};
// --- END HELPER ---


/**
 * @function POST
 * Menangani permintaan POST untuk memverifikasi token pemain.
 */
export async function POST(request: NextRequest) {
  let playerTag: string = ''; // Inisialisasi untuk logging error
  let encodedPlayerTag: string = ''; // Variabel untuk menyimpan tag yang sudah di-encode

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

    // 2. Ambil dan Validasi Payload Dasar
    const payload = (await request.json()) as PlayerVerificationRequest;
    playerTag = payload.playerTag; // Simpan tag MENTAH untuk logging error dan pesan
    const apiToken = payload.apiToken;

    if (!playerTag || !apiToken) {
      return NextResponse.json(
        { message: 'Player tag dan token verifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    // --- PERBAIKAN: Encode playerTag SEBELUM dikirim ke cocApi ---
    // Pastikan tag selalu diawali '#' sebelum encoding
    const cleanedTag = playerTag.trim().toUpperCase();
    const tagWithHash = cleanedTag.startsWith('#') ? cleanedTag : `#${cleanedTag}`;
    encodedPlayerTag = encodeURIComponent(tagWithHash);
    // --- AKHIR PERBAIKAN ---

    // --- LOGIKA API ---

    // 3. Verifikasi Token melalui API CoC (Gunakan encoded tag)
    await cocApi.verifyPlayerToken(encodedPlayerTag, apiToken);
    console.log(`[VERIFIKASI] Token valid untuk ${playerTag}`);

    // 4. Ambil Data Pemain yang baru saja terverifikasi (Gunakan encoded tag)
    const cocPlayerData: CocPlayer = await cocApi.getPlayerData(encodedPlayerTag);
    console.log(
      `[VERIFIKASI] Data pemain ${cocPlayerData.name} (${playerTag}) berhasil diambil.`
    );

    // Map role CoC API (string) ke Enum ClanRole
    const cocApiRole = cocPlayerData.clan 
        ? (cocPlayerData.role?.toLowerCase() as ClanRole) || ClanRole.MEMBER
        : ClanRole.NOT_IN_CLAN;

    // Tentukan Clashub Role internal
    let clashubRole: UserProfile['role'] = mapCocRoleToClashubRole(cocApiRole); 
    let managedClanId: string | null = null;
    let managedClanName: string | null = null;


    if (cocPlayerData.clan) {
      // 5. Logika Penentuan Penautan Klan (Leader/Co-Leader vs Anggota)
      
      if (cocApiRole === ClanRole.LEADER || cocApiRole === ClanRole.CO_LEADER) {
        // [SCENARIO 1]: MANAGER - CREATE OR LINK MANAGED CLAN
        try {
          managedClanId = await createOrLinkManagedClan(
            cocPlayerData.clan.tag, 
            cocPlayerData.clan.name,
            uid
          );
          managedClanName = cocPlayerData.clan.name;
          console.log(
            `[VERIFIKASI] User ${uid} menautkan klan ${cocPlayerData.clan.tag} ke ManagedClan ${managedClanId}`
          );
        } catch (clanLinkError) {
          console.error(
            `[VERIFIKASI] Gagal menautkan klan ${cocPlayerData.clan.tag} untuk user ${uid}:`,
            clanLinkError
          );
        }
      } else {
        // [SCENARIO 2]: ANGGOTA - AUTO-SYNC ROLE CLASHUB
        // Jika bukan Leader/Co-Leader, cek apakah klan mereka SUDAH dikelola.
        try {
             // Cari ManagedClan berdasarkan Clan Tag CoC menggunakan fungsi baru
             const managedClan = await getManagedClanByTag(cocPlayerData.clan.tag);
             
             if (managedClan) {
                  // Jika ditemukan, auto-sync role Clashub mereka dan set clanId
                  managedClanId = managedClan.id;
                  managedClanName = managedClan.name;
                  console.log(`[VERIFIKASI] User ${uid} (Member/Elder) auto-synced to ManagedClan ${managedClanId}.`);
             }
        } catch (clanSearchError) {
             console.warn(`[VERIFIKASI] Gagal mencari ManagedClan untuk auto-sync bagi ${uid}:`, clanSearchError);
             // Lanjutkan, ID dan Nama tetap null jika gagal atau tidak ditemukan
        }
        // Set nama klan dari CoC API untuk display
        managedClanName = cocPlayerData.clan.name;
        // Role Clashub sudah di set di awal berdasarkan cocApiRole (Elder/Member)
      }
    } else {
      // [SCENARIO 3]: FREE AGENT
      clashubRole = 'Free Agent';
    }

    // 6. Siapkan data update final untuk UserProfile
    const updateData: Partial<UserProfile> = {
      isVerified: true,
      playerTag: cocPlayerData.tag, 
      inGameName: cocPlayerData.name,
      thLevel: cocPlayerData.townHallLevel,
      trophies: cocPlayerData.trophies,
      lastVerified: new Date(),
      
      // Update data Clan Internal dan Role Clashub
      clanTag: cocPlayerData.clan?.tag || null,
      clanRole: cocApiRole,
      role: clashubRole,
      clanId: managedClanId,
      clanName: managedClanName,
    };
    
    // 7. Simpan Pembaruan ke Firestore User Profile (Gunakan Admin SDK langsung)
    const userRef = adminFirestore.doc(`users/${uid}`);
    // Hapus field undefined sebelum mengirim ke Admin SDK
    Object.keys(updateData).forEach((keyStr) => {
      const key = keyStr as keyof Partial<UserProfile>; // Assertion
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    await userRef.set(updateData, { merge: true });
    console.log(
      `[VERIFIKASI] Profil Firestore untuk ${uid} berhasil diperbarui via Admin SDK.`
    );

    // 8. Berikan respons yang sukses
    const updatedProfile = await getUserProfile(uid); // Baca ulang pakai Client SDK (aman)

    return NextResponse.json(
      {
        message: 'Verifikasi sukses! Profil Clash of Clans Anda telah ditautkan.',
        profile: updatedProfile,
        clan: cocPlayerData.clan || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Penanganan Error Spesifik (Gunakan playerTag mentah untuk pesan error)
    console.error(
      `API Verifikasi Error untuk PlayerTag: ${playerTag}. Detail:`,
      error.message
    );
    let errorMessage = 'Terjadi kesalahan tidak diketahui saat verifikasi.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Gunakan playerTag mentah dalam pesan error ke pengguna
      if (
        errorMessage.includes('Pemain tidak ditemukan') ||
        errorMessage.startsWith('notFound')
      ) {
        statusCode = 404;
        errorMessage = `Pemain dengan tag ${playerTag} tidak ditemukan. Pastikan tag benar.`;
      } else if (
        errorMessage.includes('Token tidak valid') ||
        errorMessage.includes('Player Tag salah')
      ) {
        statusCode = 400;
        errorMessage = `Token API atau Player Tag (${playerTag}) salah. Periksa kembali input Anda.`;
      } else if (
        errorMessage.includes('Akses API ditolak (403)') ||
        errorMessage.includes('Forbidden')
      ) {
        statusCode = 403;
        errorMessage = `Akses ke API CoC ditolak (403). Masalah pada API Key atau IP Whitelist. Hubungi admin.`;
      } else if (errorMessage.includes('Gagal menghubungi API CoC')) {
        statusCode = 503;
        errorMessage =
          'Tidak dapat menghubungi server Clash of Clans saat ini. Coba lagi nanti.';
      } else if (
        errorMessage.includes('Gagal membuat profil pengguna') ||
        errorMessage.includes('Gagal memperbarui profil pengguna') ||
        errorMessage.includes('Admin SDK')
      ) {
        statusCode = 500;
        errorMessage =
          'Verifikasi API CoC berhasil, tetapi gagal menyimpan data ke profil Anda. Hubungi admin.';
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
