import TeamHubClient from "./TeamHubClient";
// PERBAIKAN #1: Mengganti getTeams dengan getManagedClans
// Kita juga memerlukan getPublicClanIndex (akan digunakan di Client/API Route nanti)
import { getManagedClans, getPlayers } from '@/lib/firestore'; 
// PERBAIKAN #2: Menggunakan tipe data ManagedClan yang baru dan menghapus Team
import { ManagedClan, Player } from '@/lib/types';
import { Metadata } from "next";

// Metadata untuk SEO (Best practice Next.js)
export const metadata: Metadata = {
    title: "Clashub | Hub Tim & Pencarian Klan", // Disesuaikan untuk mencakup Pencarian Klan
    description: "Cari tim kompetitif Clashub atau cari klan publik CoC. Filter berdasarkan Level TH, reputasi, dan visi tim.",
};

// Mengubah komponen ini menjadi fungsi async menjadikannya Server Component
const TeamHubPage = async () => {
    // PERBAIKAN #3: Menggunakan tipe ManagedClan
    let initialClans: ManagedClan[] = []; 
    let initialPlayers: Player[] = [];
    let loadError: string | null = null;
    
    // Menggunakan Promise.all untuk mengambil semua data secara paralel
    try {
        // PERBAIKAN #4: Memanggil getManagedClans()
        const [clans, players] = await Promise.all([
            getManagedClans(), // Mengambil daftar ManagedClan
            getPlayers()
        ]);

        // PERBAIKAN #5: Menyimpan hasil ke initialClans
        initialClans = clans; 
        initialPlayers = players;
    } catch (err) {
        console.error("Error fetching data on server:", err);
        // Pesan error diubah
        loadError = "Gagal memuat daftar tim Clashub atau pemain. Silakan coba lagi.";
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

    // Meneruskan data yang sudah di-fetch ke Client Component
    // PERBAIKAN #6: Mengganti initialTeams menjadi initialClans - INI ADALAH PERBAIKAN YANG ANDA MINTA, KARENA SEKARANG TEAMHUBCLIENT.TSX MENGHARAPKAN initialClans
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <TeamHubClient
                initialClans={initialClans}
                initialPlayers={initialPlayers}
            />
        </main>
    );
};

export default TeamHubPage;
