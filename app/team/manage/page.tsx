import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile, getTeamById, getJoinRequests, getTeamMembers } from '@/lib/firestore';
import ManageRosterClient from './ManageRosterClient';
import { Team, UserProfile, JoinRequest } from '@/lib/types';
import { CogsIcon } from '@/app/components/icons';

export const metadata: Metadata = {
    title: "Clashub | Kelola Tim",
    description: "Dasbor Kapten: Kelola Roster, Permintaan Bergabung, dan Jadwal Tim.",
};

// Data yang akan diteruskan ke Client Component
interface ManageRosterData {
    team: Team;
    requests: JoinRequest[];
    members: UserProfile[];
}

/**
 * @component ManageTeamPage (Server Component)
 * Memuat semua data manajemen tim yang diperlukan di sisi server.
 */
const ManageTeamPage = async () => {
    const sessionUser = await getSessionUser();
    
    // 1. Route Protection: Pastikan pengguna login
    if (!sessionUser) {
        redirect('/auth');
    }

    let managementData: ManageRosterData | null = null;
    let errorMessage: string | null = null;
    let userProfile: UserProfile | null = null;

    try {
        // 2. Ambil profil pengguna
        userProfile = await getUserProfile(sessionUser.uid);

        if (!userProfile || !userProfile.teamId) {
            errorMessage = "Anda bukan anggota tim atau E-Sports CV Anda belum lengkap.";
            // Tetap izinkan Client Component di bawah untuk menampilkan pesan error.
        } else {
            // 3. Ambil data tim (memastikan dia adalah kapten)
            const team = await getTeamById(userProfile.teamId);

            if (!team) {
                errorMessage = "Tim Anda tidak ditemukan dalam database.";
            } else if (team.captainId !== sessionUser.uid) {
                errorMessage = "Akses Ditolak: Anda harus menjadi Kapten Tim untuk mengakses halaman ini.";
            } else {
                // 4. Jika Kapten, ambil Requests dan Members
                const [requests, members] = await Promise.all([
                    getJoinRequests(team.id),
                    getTeamMembers(team.id)
                ]);

                managementData = { team, requests, members };
            }
        }

    } catch (err) {
        console.error("SERVER ERROR in ManageTeamPage:", err);
        errorMessage = "Gagal memuat data manajemen tim dari Firestore.";
    }


    if (errorMessage && (!userProfile || !userProfile.teamId || managementData === null)) {
         return (
            <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="text-center py-20 card-stone p-6 max-w-xl mx-auto">
                    <h1 className="text-3xl text-coc-red font-supercell mb-4">Akses Dibatasi</h1>
                    <p className="text-xl text-gray-300 mb-6">{errorMessage}</p>
                    {userProfile && !userProfile.teamId && (
                        <p className="text-sm text-gray-500">Anda tidak tergabung dalam tim. Silakan cari tim di Team Hub.</p>
                    )}
                </div>
            </main>
        );
    }
    
    // Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <ManageRosterClient 
            initialData={managementData!} // Kita yakin data ada karena sudah dicek di logic atas
            currentUserUid={sessionUser.uid} // UID pengguna yang sudah terautentikasi
        />
    );
};

export default ManageTeamPage;
