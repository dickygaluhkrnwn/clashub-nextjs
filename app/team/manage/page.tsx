import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';
// PERBAIKAN #1: Mengganti getTeamById dengan getManagedClanData
// getJoinRequests dan getTeamMembers masih valid (menggunakan teamId lama)
import { getUserProfile, getManagedClanData, getJoinRequests, getTeamMembers } from '@/lib/firestore';
// PERBAIKAN #2: Mengganti Team dengan ManagedClan
import { ManagedClan, UserProfile, JoinRequest } from '@/lib/types';
import { CogsIcon } from '@/app/components/icons';
// PERBAIKAN #3: Mengimpor ManageRosterClient dari path yang benar
import ManageRosterClient from './ManageRosterClient'; 

export const metadata: Metadata = {
    title: "Clashub | Kelola Tim (Roster)", // Judul disesuaikan
    description: "Dasbor Kapten: Kelola Roster, Permintaan Bergabung, dan Jadwal Tim.",
};

// Data yang akan diteruskan ke Client Component
interface ManageRosterData {
    team: ManagedClan; // PERBAIKAN #4: Menggunakan ManagedClan
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
        } else {
            // 3. Ambil data klan terkelola (ManagedClan)
            const managedClan = await getManagedClanData(userProfile.teamId); 

            if (!managedClan) {
                errorMessage = "Klan yang dikelola Anda tidak ditemukan dalam database.";
            // PERBAIKAN #5: Mengganti captainId dengan ownerUid dan role 'leader'/'coLeader'
            } else if (managedClan.ownerUid !== sessionUser.uid || 
                       (userProfile.clanRole !== 'leader' && userProfile.clanRole !== 'coLeader')) {
                // Catatan: Halaman ini untuk Manajemen Roster (Kapten Tim lama). 
                // Kita membatasinya hanya untuk Leader/Co-Leader terverifikasi di ManagedClan.
                errorMessage = "Akses Ditolak: Anda harus menjadi Leader/Co-Leader yang terverifikasi dan menautkan klan untuk mengakses halaman ini.";
            } else {
                // 4. Jika Leader/Co-Leader, ambil Requests dan Members
                const [requests, members] = await Promise.all([
                    getJoinRequests(managedClan.id),
                    getTeamMembers(managedClan.id) 
                ]);

                managementData = { 
                    team: managedClan, // PERBAIKAN #6: Menggunakan ManagedClan
                    requests, 
                    members 
                };
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
                     <h1 className="text-3xl text-coc-red font-clash mb-4">Akses Dibatasi</h1>
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
            initialData={managementData!}
            currentUserUid={sessionUser.uid}
        />
    );
};

export default ManageTeamPage;
