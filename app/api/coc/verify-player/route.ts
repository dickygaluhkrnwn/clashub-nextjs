// File: app/api/coc/verify-player/route.ts
// Deskripsi: API Route untuk memproses verifikasi Player Tag Clash of Clans
// menggunakan Token Verifikasi In-Game. (PERBAIKAN: API Flow dan Tipe Data)

import { NextRequest, NextResponse } from 'next/server';
import { verifyPlayerToken, getPlayerData } from '@/lib/coc-api'; // Import getPlayerData
import { createOrLinkManagedClan, updateUserProfile, getUserProfile } from '@/lib/firestore'; // Import fungsi Firestore
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import { PlayerVerificationRequest, UserProfile, ClanRole, CocPlayer } from '@/lib/types'; // Import tipe data ClanRole dan CocPlayer

/**
 * @function POST
 * Menangani permintaan POST untuk memverifikasi token pemain.
 */
export async function POST(request: NextRequest) {
  // PENTING: Inisialisasi di sini untuk memastikan variabel selalu memiliki nilai
  // (misalnya string kosong) jika terjadi error saat parsing request.json().
  let playerTag: string = ''; 
  
  try {
    // 1. Otorisasi Pengguna
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const uid = authUser.uid;
    
    // 2. Ambil dan Validasi Payload
    const payload = (await request.json()) as PlayerVerificationRequest;
    
    // Assignment playerTag dilakukan di sini
    playerTag = payload.playerTag;
    const apiToken = payload.apiToken;

    if (!playerTag || !apiToken) {
      return NextResponse.json({ message: 'Player tag dan token verifikasi wajib diisi.' }, { status: 400 });
    }

    // --- LOGIKA API ---

    // 3. Verifikasi Token melalui API CoC (Hanya cek status, mengembalikan boolean)
    const isVerified = await verifyPlayerToken(playerTag, apiToken);

    if (!isVerified) {
        // Ini seharusnya ditangkap oleh Error di coc-api.ts, tapi sebagai fallback
        throw new Error("Verifikasi token gagal tanpa error spesifik dari API.");
    }

    // 4. Ambil Data Pemain yang baru saja terverifikasi (data CocPlayer lengkap)
    const cocPlayerData: CocPlayer = await getPlayerData(playerTag);

    // 5. Update UserProfile dengan Data Verifikasi
    // Pastikan data yang dimasukkan ke Firestore sesuai dengan tipe UserProfile
    const updateData: Partial<UserProfile> = {
      isVerified: true,
      playerTag: cocPlayerData.tag, 
      inGameName: cocPlayerData.name,
      thLevel: cocPlayerData.townHallLevel,
      trophies: cocPlayerData.trophies,
      lastVerified: new Date(), 
      clanTag: null,
      clanRole: ClanRole.NOT_IN_CLAN, // Default: not in clan
      teamId: null,
      teamName: null,
    };

    if (cocPlayerData.clan) {
      updateData.clanTag = cocPlayerData.clan.tag;
      
      // Map role CoC API ('member', 'admin', 'coLeader', 'leader') ke ClanRole Enum
      const cocApiRole = cocPlayerData.role.toLowerCase() as ClanRole;

      // Set ClanRole (CoC Role)
      updateData.clanRole = cocApiRole;

      // Set Clashub Internal Role (Leader, Co-Leader, Elder, Member)
      switch (cocApiRole) {
        case ClanRole.LEADER:
          updateData.role = 'Leader';
          break;
        case ClanRole.CO_LEADER:
          updateData.role = 'Co-Leader';
          break;
        case ClanRole.ELDER: // CoC API role 'admin'
          updateData.role = 'Elder'; 
          break;
        default:
          updateData.role = 'Member';
      }

      // 6. Logika Pendaftaran/Penautan Klan Otomatis (Jika Leader/Co-Leader)
      if (cocApiRole === ClanRole.LEADER || cocApiRole === ClanRole.CO_LEADER) {
        
        // Panggil fungsi createOrLinkManagedClan
        const managedClanId = await createOrLinkManagedClan(
          cocPlayerData.clan.tag,
          cocPlayerData.clan.name,
          uid // UID pengguna yang diverifikasi adalah Owner/Manager
        );

        // Update UserProfile dengan ID ManagedClan
        updateData.teamId = managedClanId;
        updateData.teamName = cocPlayerData.clan.name;
        
        console.log(`[VERIFIKASI] User ${uid} berhasil menautkan klan ${cocPlayerData.clan.tag} ke ManagedClan ${managedClanId}`);
      } else if (cocPlayerData.clan.tag) {
        // Jika Member/Elder/Admin di klan, gunakan tag klan sebagai ID tim sementara
        updateData.teamId = cocPlayerData.clan.tag;
        updateData.teamName = cocPlayerData.clan.name;
      }
    }
    
    // 7. Simpan Pembaruan ke Firestore
    await updateUserProfile(uid, updateData);

    // 8. Berikan respons yang sukses
    // Ambil UserProfile yang diperbarui untuk dikirimkan ke klien
    const updatedProfile = await getUserProfile(uid);

    return NextResponse.json({ 
      message: 'Verifikasi sukses! Profil Clash of Clans Anda telah ditautkan.',
      profile: updatedProfile,
      clan: cocPlayerData.clan || null,
    }, { status: 200 });

  } catch (error: any) {
    // Penggunaan playerTag di sini aman karena sudah diinisialisasi
    console.error(`API Verifikasi Error untuk PlayerTag: ${playerTag}. Detail:`, error.message);
    // Tangani error spesifik dari coc-api atau firestore
    return NextResponse.json({ 
      message: error.message || 'Terjadi kesalahan server yang tidak diketahui saat memproses verifikasi.' 
    }, { status: 500 });
  }
}
