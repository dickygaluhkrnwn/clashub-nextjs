import { TournamentCard } from "@/app/components/cards";
import TournamentFilter from "@/app/components/filters/TournamentFilter"; // Sekarang sudah dimodifikasi
import { Button } from "@/app/components/ui/Button";
import { Tournament } from '@/lib/types';
import { getTournaments } from '@/lib/firestore'; // Fungsi fetching data
import TournamentClient from "./TournamentClient"; // Import Client Component baru
import { Metadata } from "next";

// Metadata untuk SEO (Best practice Next.js)
export const metadata: Metadata = {
    title: "Clashub | Tournament & Liga",
    description: "Lihat daftar turnamen Clash of Clans yang akan datang, sedang berlangsung, dan klasemen liga kompetitif.",
};


// Mengubah komponen ini menjadi fungsi async menjadikannya Server Component
const TournamentPage = async () => {
    let initialTournaments: Tournament[] = [];
    let error: string | null = null;

    // Ambil data Turnamen di sisi Server (SSR)
    try {
        initialTournaments = await getTournaments();
    } catch (err) {
        console.error("Error fetching tournaments on server:", err);
        error = "Gagal memuat turnamen. Periksa koneksi atau database.";
    }


    // Jika ada error fatal, kita tampilkan pesan error yang di-render oleh server
    if (error) {
        return (
             <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
                    <h1 className="text-3xl text-coc-red font-supercell mb-4">Kesalahan Server</h1>
                    <h2 className="text-xl text-gray-300">{error}</h2>
                    <p className="text-sm text-gray-500 mt-4">Data turnamen tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.</p>
                </div>
            </main>
        );
    }
    
    // Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <TournamentClient 
                initialTournaments={initialTournaments} 
                error={error}
            />
        </main>
    );
};

export default TournamentPage;
