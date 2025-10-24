// File: app/teamhub/page.tsx
import TeamHubClient from "./TeamHubClient";
// PERBAIKAN #1: Mengganti getTeams dengan getManagedClans
// KITA JUGA MEMBUTUHKAN getPublicClanIndex dari firestore untuk cache klan publik
import { getManagedClans, getPlayers, getPublicClanIndex } from '@/lib/firestore'; 
// PERBAIKAN #2: Menggunakan tipe data ManagedClan dan PublicClanIndex yang baru
import { ManagedClan, Player, PublicClanIndex } from '@/lib/types'; // Import PublicClanIndex
import { Metadata } from "next";

// Metadata untuk SEO (Best practice Next.js)
export const metadata: Metadata = {
    title: "Clashub | Hub Tim & Pencarian Klan", 
    description: "Cari tim kompetitif Clashub atau cari klan publik CoC. Filter berdasarkan Level TH, reputasi, dan visi tim.",
};

// Mengubah komponen ini menjadi fungsi async menjadikannya Server Component
const TeamHubPage = async () => {
    // PERBAIKAN #3: Inisialisasi array untuk Klan Publik
    let initialClans: ManagedClan[] = []; 
    let initialPlayers: Player[] = [];
    let initialPublicClans: PublicClanIndex[] = []; // BARU: Menampung cache klan publik
    let loadError: string | null = null;
    
    // Menggunakan Promise.all untuk mengambil semua data secara paralel
    try {
        // PERBAIKAN #4: Menambahkan getPublicClanIndex ke Promise.all
        const [clans, players, publicClans] = await Promise.all([
            getManagedClans(), // Mengambil daftar ManagedClan (Tim Internal)
            getPlayers(), // Mengambil daftar Player
            getPublicClanIndex(), // BARU: Mengambil daftar PublicClanIndex (Cache Klan Publik)
        ]);

        // PERBAIKAN #5: Menyimpan hasil ke initialClans dan initialPublicClans
        initialClans = clans; 
        initialPlayers = players;
        initialPublicClans = publicClans; // BARU: Simpan data klan publik
    } catch (err) {
        console.error("Error fetching data on server:", err);
        loadError = "Gagal memuat daftar hub klan. Silakan coba lagi.";
    }

    // Jika ada error fatal, tampilkan pesan error yang di-render oleh server
    if (loadError) {
        return (
             <main className="container mx-auto p-4 md:p-8 mt-10">
                 <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
                     {/* Menggunakan font-clash untuk judul error */}
                     <h1 className="text-3xl text-coc-red font-clash mb-4">Kesalahan Server</h1>
                     <h2 className="text-xl text-gray-300">{loadError}</h2>
                     <p className="text-sm text-gray-500 mt-4">Data tim dan pemain tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.</p>
                 </div>
             </main>
        );
    }

    // Meneruskan SEMUA data yang sudah di-fetch ke Client Component
    // PERBAIKAN #6: Mengirim initialPublicClans ke Client Component
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <TeamHubClient
                initialClans={initialClans}
                initialPlayers={initialPlayers}
                initialPublicClans={initialPublicClans} // BARU: Data untuk tab Pencarian Klan Publik
            />
        </main>
    );
};

export default TeamHubPage;
