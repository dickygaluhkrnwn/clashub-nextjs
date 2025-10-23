// File: app/api/coc/verify-player/route.ts
// Deskripsi: API Route untuk memproses verifikasi Player Tag Clash of Clans
// menggunakan Token Verifikasi In-Game.

import { NextRequest, NextResponse } from 'next/server';
import { verifyPlayerToken } from '@/lib/coc-api'; // Import fungsi API verifikasi
import { createOrLinkManagedClan, updateUserProfile, getUserProfile } from '@/lib/firestore'; // Import fungsi Firestore
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import { PlayerVerificationRequest, UserProfile } from '@/lib/types'; // Import tipe data

/**
 * @function POST
 * Menangani permintaan POST untuk memverifikasi token pemain.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Otorisasi Pengguna
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const uid = authUser.uid;
    
    // 2. Ambil dan Validasi Payload
    const { playerTag, apiToken } = (await request.json()) as PlayerVerificationRequest;

    if (!playerTag || !apiToken) {
      return NextResponse.json({ message: 'Player tag dan token verifikasi wajib diisi.' }, { status: 400 });
    }

    // 3. Verifikasi Token melalui API CoC
    const cocPlayerData = await verifyPlayerToken(playerTag, apiToken);

    // 4. Update UserProfile dengan Data Verifikasi
    const updateData: Partial<UserProfile> = {
      isVerified: true,
      playerTag: cocPlayerData.tag, // Pastikan tag bersih dan benar
      inGameName: cocPlayerData.name,
      thLevel: cocPlayerData.townHallLevel,
      lastVerified: new Date(), // Simpan timestamp verifikasi
      // Default jika tidak ada klan
      clanTag: null,
      clanRole: 'not in clan', 
      teamId: null,
      teamName: null,
    };

    if (cocPlayerData.clan) {
      updateData.clanTag = cocPlayerData.clan.tag;
      updateData.clanRole = cocPlayerData.role; // Role di klan CoC (leader/coLeader/admin/member)

      // 5. Logika Pendaftaran/Penautan Klan Otomatis (Jika Leader/Co-Leader)
      if (cocPlayerData.role === 'leader' || cocPlayerData.role === 'coLeader') {
        
        // Panggil fungsi createOrLinkManagedClan
        const managedClanId = await createOrLinkManagedClan(
          cocPlayerData.clan.tag,
          cocPlayerData.clan.name,
          uid // UID pengguna yang diverifikasi adalah Owner/Manager
        );

        // Update UserProfile dengan ID ManagedClan
        updateData.teamId = managedClanId;
        updateData.teamName = cocPlayerData.clan.name;
        // Role internal Clashub juga diset
        updateData.role = cocPlayerData.role === 'leader' ? 'Leader' : 'Co-Leader';

        console.log(`[VERIFIKASI] User ${uid} berhasil menautkan klan ${cocPlayerData.clan.tag} ke ManagedClan ${managedClanId}`);
      } else {
        // Jika hanya Member/Admin, update teamId/teamName berdasarkan data API
        updateData.teamId = cocPlayerData.clan.tag; // Gunakan tag klan sebagai ID tim sementara jika bukan manager
        updateData.teamName = cocPlayerData.clan.name;
        updateData.role = cocPlayerData.role === 'admin' ? 'Elder' : 'Member'; // Map CoC role ke Clashub role
      }
    }
    
    // 6. Simpan Pembaruan ke Firestore
    await updateUserProfile(uid, updateData);

    // 7. Berikan respons yang sukses
    // Ambil UserProfile yang diperbarui untuk dikirimkan ke klien
    const updatedProfile = await getUserProfile(uid);

    return NextResponse.json({ 
      message: 'Verifikasi sukses! Profil Clash of Clans Anda telah ditautkan.',
      profile: updatedProfile,
      clan: cocPlayerData.clan || null,
    }, { status: 200 });

  } catch (error: any) {
    console.error('API Verifikasi Error:', error);
    // Tangani error spesifik dari coc-api atau firestore
    return NextResponse.json({ 
      message: error.message || 'Terjadi kesalahan server saat memproses verifikasi.' 
    }, { status: 500 });
  }
}
