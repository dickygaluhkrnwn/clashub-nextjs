import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { logRoleChange, updateJoinRequestStatus, updateMemberRole } from '@/lib/firestore-admin'; // Tambahkan logRoleChange (walaupun tidak dipakai di sini, lebih aman)
// FIX 1 & FIX 2: Ganti getManagedClan/getJoinRequest menjadi nama fungsi yang benar.
import { getManagedClanData, getJoinRequest, getUserProfile } from '@/lib/firestore'; // getManagedClanData, getJoinRequest (baru)
// FIX 3: Tambahkan UserProfile
import { ClanRole, UserProfile } from '@/lib/types';
import cocApi from '@/lib/coc-api';

/**
 * Endpoint PUT untuk Menyetujui atau Menolak Permintaan Bergabung Klan.
 * PATH: /api/clan/manage/request/[requestId]
 * Diakses oleh Leader/Co-Leader dari ManagedClan.
 */
export async function PUT(
    request: Request,
    { params }: { params: { requestId: string } }
) {
    const { requestId } = params;
    
    // 1. Dapatkan Sesi Pengguna dan Otorisasi
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return NextResponse.json({ message: 'Tidak Terotentikasi.' }, { status: 401 });
    }
    const changerUid = sessionUser.uid;

    try {
        const body = await request.json();
        const { action, clanId } = body as { action: 'approved' | 'rejected', clanId: string };

        if (!action || !clanId) {
            return NextResponse.json({ message: 'Aksi (approved/rejected) dan ID Klan wajib diisi.' }, { status: 400 });
        }

        // 2. Dapatkan data ManagedClan dan Permintaan
        const [managedClan, joinRequest] = await Promise.all([
            // FIX: Ganti getManagedClan menjadi getManagedClanData
            getManagedClanData(clanId), 
            getJoinRequest(clanId, requestId)
        ]);

        if (!managedClan) {
            return NextResponse.json({ message: 'Klan yang dikelola tidak ditemukan.' }, { status: 404 });
        }
        if (!joinRequest || joinRequest.id !== requestId) {
            return NextResponse.json({ message: 'Permintaan bergabung tidak ditemukan.' }, { status: 404 });
        }
        
        // 3. Validasi Otorisasi
        // FIX: UserProfile sudah diimpor, error hilang
        const leaderOrCoLeaderRoles: UserProfile['role'][] = ['Leader', 'Co-Leader'];
        const userProfile = await getUserProfile(changerUid);
        const userIsAuthorized = userProfile?.clanId === clanId && leaderOrCoLeaderRoles.includes(userProfile.role);

        if (!userIsAuthorized) {
            return NextResponse.json({ message: 'Anda tidak memiliki izin (Leader/Co-Leader) untuk mengelola klan ini.' }, { status: 403 });
        }

        // 4. Proses Aksi (Approved atau Rejected)
        if (action === 'approved') {
            
            // a. Update status permintaan di Firestore
            // Fungsi ini sekarang membutuhkan clanId juga
            await updateJoinRequestStatus(clanId, requestId, 'approved');

            // b. Tambahkan pemohon ke roster Clashub (set clanId, clanName, role: 'Member')
            const requesterUid = joinRequest.requesterId;
            await updateMemberRole(
                requesterUid,
                clanId,
                managedClan.name,
                'Member' // Role Clashub default untuk anggota baru
            );
            
            // c. Dapatkan Clan Tag CoC yang sebenarnya (untuk link undangan)
            const cocClanTag = managedClan.tag;
            const linkUndangan = `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${cocClanTag.replace('#', '')}`;

            // d. Implementasi Notifikasi Link Undangan (PLACEHOLDER)
            console.log(`[JoinRequest Approved] User ${requesterUid} approved by ${changerUid}. Clan Link: ${linkUndangan}`);
            // TODO: Implementasikan fungsi pushNotification atau log notifikasi di sini
            // addNotification(requesterUid, `Permintaan bergabung ke ${managedClan.name} disetujui! Link undangan: ${linkUndangan}`);

            return NextResponse.json({ 
                message: `Permintaan dari ${joinRequest.requesterName} disetujui. Pemain ditambahkan sebagai Member.`,
                clanLink: linkUndangan
            }, { status: 200 });

        } else if (action === 'rejected') {
            
            // Update status permintaan di Firestore
            await updateJoinRequestStatus(clanId, requestId, 'rejected');

            return NextResponse.json({ 
                message: `Permintaan dari ${joinRequest.requesterName} ditolak.`,
            }, { status: 200 });

        } else {
            return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
        }

    } catch (error) {
        console.error('API Error /clan/manage/request:', error);
        return NextResponse.json({ message: 'Gagal memproses permintaan: ' + (error instanceof Error ? error.message : 'Kesalahan server') }, { status: 500 });
    }
}
