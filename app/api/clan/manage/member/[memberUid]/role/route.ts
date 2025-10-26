import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { updateMemberRole, logRoleChange } from '@/lib/firestore-admin';
import { getUserProfile } from '@/lib/firestore';
import { ClanRole, UserProfile } from '@/lib/types';

/**
 * Endpoint PUT untuk Mengubah Role Internal Clashub Anggota Klan.
 * PATH: /api/clan/manage/member/[memberUid]/role
 * Diakses oleh Leader/Co-Leader dari ManagedClan.
 */
export async function PUT(
    request: Request,
    { params }: { params: { memberUid: string } }
) {
    const { memberUid } = params;
    
    // 1. Dapatkan Sesi Pengguna (Changer) dan Otorisasi
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return NextResponse.json({ message: 'Tidak Terotentikasi.' }, { status: 401 });
    }
    const changerUid = sessionUser.uid;

    try {
        const body = await request.json();
        const { 
            newClashubRole, // Role Clashub Baru: 'Leader', 'Co-Leader', 'Elder', 'Member', 'Free Agent'
            clanId,
            oldRoleCoC,    // Role CoC LAMA (dari cache/profile target)
            newRoleCoC     // Role CoC BARU (yang disarankan/diminta)
        } = body as { 
            newClashubRole: UserProfile['role'], 
            clanId: string, 
            oldRoleCoC: ClanRole,
            newRoleCoC: ClanRole
        };

        if (!newClashubRole || !clanId || !oldRoleCoC || !newRoleCoC) {
            return NextResponse.json({ message: 'Data (role, clanId, oldRoleCoC, newRoleCoC) wajib diisi.' }, { status: 400 });
        }

        // 2. Dapatkan Profil Pengubah (Changer) dan Target (Member)
        const [changerProfile, memberProfile] = await Promise.all([
            getUserProfile(changerUid),
            getUserProfile(memberUid),
        ]);

        if (!memberProfile || !changerProfile) {
            return NextResponse.json({ message: 'Profil pengguna tidak ditemukan.' }, { status: 404 });
        }

        // 3. Validasi Otorisasi dan Integritas Klan
        const changerRole = changerProfile.role;
        const targetRole = memberProfile.role;

        // a. Cek apakah pengubah adalah Leader/Co-Leader dari klan yang sama
        const leaderOrCoLeaderRoles: UserProfile['role'][] = ['Leader', 'Co-Leader'];
        const isAuthorizedChanger = changerProfile.clanId === clanId && leaderOrCoLeaderRoles.includes(changerRole);
        
        if (!isAuthorizedChanger) {
            return NextResponse.json({ message: 'Anda tidak memiliki izin (Leader/Co-Leader) untuk mengelola klan ini.' }, { status: 403 });
        }
        
        // b. Cek apakah target adalah anggota klan yang sama
        if (memberProfile.clanId !== clanId) {
            return NextResponse.json({ message: 'Pemain target bukan anggota klan ini.' }, { status: 403 });
        }

        // c. Aturan Bisnis Kunci: Leader vs Co-Leader
        // Co-Leader TIDAK boleh mengubah Leader
        if (changerRole === 'Co-Leader' && targetRole === 'Leader') {
             return NextResponse.json({ message: 'Co-Leader tidak dapat mengubah peran Leader.' }, { status: 403 });
        }
        // Co-Leader TIDAK boleh mengubah Co-Leader (Kecuali dirinya sendiri, yang tidak diizinkan oleh UI)
        if (changerRole === 'Co-Leader' && targetRole === 'Co-Leader' && changerUid !== memberUid) {
             return NextResponse.json({ message: 'Co-Leader hanya dapat mengubah peran Elder atau Member.' }, { status: 403 });
        }

        // d. Leader TIDAK boleh mengubah dirinya sendiri menjadi non-Leader (kecuali transfer kepemilikan, yang merupakan endpoint terpisah)
        if (changerUid === memberUid && targetRole === 'Leader' && newClashubRole !== 'Leader') {
            return NextResponse.json({ message: 'Peran Leader hanya dapat diubah melalui fitur Transfer Kepemilikan.' }, { status: 403 });
        }
        
        // 4. Update Role di UserProfile (Clashub Role)
        await updateMemberRole(
            memberUid,
            clanId,
            memberProfile.clanName || 'Nama Klan', // Pertahankan nama klan internal
            newClashubRole
        );

        // 5. Catat Log Perubahan Role (CoC Role)
        // Log ini mencatat perubahan Role CoC (Leader, Co-Leader, Elder, Member)
        // yang relevan untuk logika Aggregators.js (reset penalti).
        const roleLogData = {
            playerTag: memberProfile.playerTag || 'N/A',
            playerName: memberProfile.inGameName || memberProfile.displayName,
            memberUid: memberUid,
            oldRoleCoC: oldRoleCoC,
            newRoleCoC: newRoleCoC,
            changedByUid: changerUid,
        };
        await logRoleChange(clanId, roleLogData);


        return NextResponse.json({ 
            message: `Peran ${memberProfile.displayName} berhasil diubah menjadi ${newClashubRole}.`,
        }, { status: 200 });

    } catch (error) {
        console.error('API Error /clan/manage/member/[memberUid]/role:', error);
        return NextResponse.json({ message: 'Gagal mengubah peran anggota: ' + (error instanceof Error ? error.message : 'Kesalahan server') }, { status: 500 });
    }
}
