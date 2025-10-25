// File: app/api/coc/verify-player/route.ts
// Deskripsi: API Route untuk memproses verifikasi Player Tag Clash of Clans
// menggunakan Token Verifikasi In-Game. (PERBAIKAN: API Flow, Tipe Data, Error Handling, Import Fix, Use Admin Function, Encoding Tag)

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Import fungsi Client SDK untuk read dan fungsi Admin SDK untuk write
import { getUserProfile } from '@/lib/firestore'; // Hanya perlu read profile
import { createOrLinkManagedClan } from '@/lib/firestore-admin'; // <<<--- IMPORT FUNGSI ADMIN DARI SINI
import { adminFirestore } from '@/lib/firebase-admin'; // Import adminFirestore untuk update user profile
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import { PlayerVerificationRequest, UserProfile, ClanRole, CocPlayer } from '@/lib/types'; // Import tipe data ClanRole dan CocPlayer

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
            return NextResponse.json({ message: 'Unauthorized: Sesi pengguna tidak ditemukan.' }, { status: 401 });
        }
        const uid = authUser.uid;

        // 2. Ambil dan Validasi Payload Dasar
        const payload = (await request.json()) as PlayerVerificationRequest;
        playerTag = payload.playerTag; // Simpan tag MENTAH untuk logging error dan pesan
        const apiToken = payload.apiToken;

        if (!playerTag || !apiToken) {
            return NextResponse.json({ message: 'Player tag dan token verifikasi wajib diisi.' }, { status: 400 });
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
        console.log(`[VERIFIKASI] Data pemain ${cocPlayerData.name} (${playerTag}) berhasil diambil.`);

        // 5. Siapkan data update untuk UserProfile
        const updateData: Partial<UserProfile> = {
            isVerified: true,
            playerTag: cocPlayerData.tag, // Simpan tag asli dari API (sudah pasti benar)
            inGameName: cocPlayerData.name,
            thLevel: cocPlayerData.townHallLevel,
            trophies: cocPlayerData.trophies,
            lastVerified: new Date(),
            clanTag: null,
            clanRole: ClanRole.NOT_IN_CLAN,
            teamId: null,
            teamName: null,
        };

        let clashubRole: UserProfile['role'] = 'Free Agent'; // Default Clashub role

        if (cocPlayerData.clan) {
            updateData.clanTag = cocPlayerData.clan.tag;
            const cocApiRole = (cocPlayerData.role?.toLowerCase() || 'member') as ClanRole;
            updateData.clanRole = cocApiRole;

            // Map role CoC API ke Role Clashub Internal
            switch (cocApiRole) {
                case ClanRole.LEADER: clashubRole = 'Leader'; break;
                case ClanRole.CO_LEADER: clashubRole = 'Co-Leader'; break;
                case ClanRole.ELDER: clashubRole = 'Elder'; break;
                default: clashubRole = 'Member';
            }
            updateData.role = clashubRole; // Set role Clashub

            // 6. Logika Penautan Klan (Jika Leader/Co-Leader)
            if (cocApiRole === ClanRole.LEADER || cocApiRole === ClanRole.CO_LEADER) {
                try {
                     // createOrLinkManagedClan menerima tag MENTAH
                     const managedClanId = await createOrLinkManagedClan(
                        cocPlayerData.clan.tag, // Tag asli dari API
                        cocPlayerData.clan.name,
                        uid
                     );
                     updateData.teamId = managedClanId;
                     updateData.teamName = cocPlayerData.clan.name;
                     console.log(`[VERIFIKASI] User ${uid} menautkan klan ${cocPlayerData.clan.tag} ke ManagedClan ${managedClanId}`);
                } catch (clanLinkError) {
                     console.error(`[VERIFIKASI] Gagal menautkan klan ${cocPlayerData.clan.tag} untuk user ${uid}:`, clanLinkError);
                     // Mungkin tambahkan notifikasi error spesifik jika penautan gagal?
                     // Untuk saat ini, kita lanjutkan update profil user tanpa teamId
                }
            } else {
                 // Jika bukan Leader/Co, set teamName tapi teamId mungkin null (jika klan belum dikelola)
                 updateData.teamName = cocPlayerData.clan.name;
                 updateData.teamId = null; // Default null
                 // TODO: Cek apakah clanTag ini ada di managedClans, jika ya, set teamId
            }
        } else {
             // Jika tidak dalam klan CoC, pastikan role Clashub adalah Free Agent
             updateData.role = 'Free Agent';
        }

        // 7. Simpan Pembaruan ke Firestore User Profile (Gunakan Admin SDK langsung)
        const userRef = adminFirestore.doc(`users/${uid}`);
        // Hapus field undefined sebelum mengirim ke Admin SDK
        Object.keys(updateData).forEach(keyStr => {
            const key = keyStr as keyof Partial<UserProfile>; // Assertion
            if (updateData[key] === undefined) {
                 delete updateData[key];
            }
        });
        await userRef.set(updateData, { merge: true });
        console.log(`[VERIFIKASI] Profil Firestore untuk ${uid} berhasil diperbarui via Admin SDK.`);


        // 8. Berikan respons yang sukses
        const updatedProfile = await getUserProfile(uid); // Baca ulang pakai Client SDK (aman)

        return NextResponse.json({
            message: 'Verifikasi sukses! Profil Clash of Clans Anda telah ditautkan.',
            profile: updatedProfile,
            clan: cocPlayerData.clan || null,
        }, { status: 200 });

    } catch (error: any) {
        // Penanganan Error Spesifik (Gunakan playerTag mentah untuk pesan error)
        console.error(`API Verifikasi Error untuk PlayerTag: ${playerTag}. Detail:`, error.message);
        let errorMessage = 'Terjadi kesalahan tidak diketahui saat verifikasi.';
        let statusCode = 500;

        if (error instanceof Error) {
            errorMessage = error.message;
            // Gunakan playerTag mentah dalam pesan error ke pengguna
            if (errorMessage.includes('Pemain tidak ditemukan') || errorMessage.startsWith('notFound')) {
                statusCode = 404;
                errorMessage = `Pemain dengan tag ${playerTag} tidak ditemukan. Pastikan tag benar.`;
            } else if (errorMessage.includes('Token tidak valid') || errorMessage.includes('Player Tag salah')) {
                statusCode = 400;
                errorMessage = `Token API atau Player Tag (${playerTag}) salah. Periksa kembali input Anda.`;
            } else if (errorMessage.includes('Akses API ditolak (403)') || errorMessage.includes('Forbidden')) {
                 statusCode = 403;
                 errorMessage = `Akses ke API CoC ditolak (403). Masalah pada API Key atau IP Whitelist. Hubungi admin.`;
            } else if (errorMessage.includes('Gagal menghubungi API CoC')) {
                 statusCode = 503;
                 errorMessage = 'Tidak dapat menghubungi server Clash of Clans saat ini. Coba lagi nanti.';
            } else if (errorMessage.includes('Gagal membuat profil pengguna') || errorMessage.includes('Gagal memperbarui profil pengguna') || errorMessage.includes('Admin SDK')) {
                 statusCode = 500;
                 errorMessage = 'Verifikasi API CoC berhasil, tetapi gagal menyimpan data ke profil Anda. Hubungi admin.';
            }
        }

        return NextResponse.json({ message: errorMessage }, { status: statusCode });
    }
}
