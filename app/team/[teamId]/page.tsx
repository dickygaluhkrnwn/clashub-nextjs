import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
import { Team, UserProfile } from '@/lib/types';
import { getTeamById, getTeamMembers } from '@/lib/firestore';
// Menggunakan ikon-ikon yang sudah diperbarui: ArrowLeftIcon, ShieldIcon, ClockIcon, dan UserIcon
import { ArrowLeftIcon, StarIcon, ShieldIcon, UserIcon, GlobeIcon, DiscordIcon, ClockIcon, TrophyIcon } from '@/app/components/icons'; 
// PERBAIKAN: Import komponen Client Component yang baru
import TeamProfileTabs from '../components/TeamProfileTabs'; 

// Definisikan tipe untuk parameter rute dinamis
interface TeamDetailPageProps {
    params: {
        teamId: string;
    };
}

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({ params }: TeamDetailPageProps): Promise<Metadata> {
    // PERBAIKAN: Decode teamId untuk memastikan spasi dan karakter lain benar
    const teamId = decodeURIComponent(params.teamId);
    const team = await getTeamById(teamId); 

    if (!team) {
        return { title: "Tim Tidak Ditemukan | Clashub" };
    }

    return {
        title: `Clashub | Profil Tim: ${team.name} (${team.tag})`,
        description: `Lihat profil publik, reputasi ${team.rating} ★, dan persyaratan rekrutmen tim ${team.name} di Clash of Clans.`,
    };
}

/**
 * @component TeamDetailPage (Server Component)
 * Menampilkan detail lengkap profil tim.
 */
const TeamDetailPage = async ({ params }: TeamDetailPageProps) => {
    // PERBAIKAN: Decode teamId untuk memastikan spasi dan karakter lain benar
    const teamId = decodeURIComponent(params.teamId);

    // Mengambil data tim dan anggota secara paralel
    const [team, members] = await Promise.all([
        getTeamById(teamId),
        getTeamMembers(teamId)
    ]);

    if (!team) {
        notFound(); 
    }

    // Penyiapan Data
    const { name, tag, rating, vision, avgTh, website, discordId } = team; 
    const isCompetitive = vision === 'Kompetitif';
    const isFull = members.length >= 50; 

    // Data dummy untuk Riwayat Kompetisi (sesuai prototipe HTML)
    const competitionHistory = [
        { tournament: "ClashHub Liga Musim 2", rank: "Juara 3", date: "Sep 2025", prize: "Rp 5.000.000" },
        { tournament: "TH 15 Open Cup", rank: "Peringkat 9", date: "Mei 2025", prize: "-" },
    ];
    
    // Data dummy untuk Event Terdekat (sesuai prototipe HTML)
    const upcomingEvent = {
        name: "War Clan Berikutnya",
        date: "7 Oktober",
        time: "20:00 WIB (Persiapan)",
    };

    // Hapus getRankColor dari sini, karena akan dipindahkan ke TeamProfileTabs.tsx
    // const getRankColor = (rank: string) => {
    //     if (rank.includes('Juara')) return 'text-coc-gold';
    //     return 'text-gray-400';
    // };

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Header Profil Tim */}
            <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6">
                <div className="flex items-center gap-4">
                    <Button href="/teamhub" variant="secondary" size="md" className="flex items-center flex-shrink-0">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali
                    </Button>
                    
                    <div>
                        {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                        <h1 className="text-3xl md:text-4xl text-white font-clash m-0">{name}</h1>
                        <p className="text-sm text-gray-400 font-bold mb-1">{tag}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isCompetitive ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
                            {vision} (TH Avg: {avgTh.toFixed(1)})
                        </span>
                    </div>
                </div>
                
                {/* Tombol Aksi - Kondisional */}
                {isFull ? (
                    <span className="px-4 py-2 bg-coc-red/50 text-coc-red border border-coc-red rounded-lg text-sm font-bold">Roster Penuh</span>
                ) : (
                    <Button href={`/team/${teamId}/join`} variant="primary" size="lg">
                        Kirim Permintaan Bergabung
                    </Button>
                )}
            </header>

            {/* Layout Utama Profil */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Kolom Kiri: Statistik & Kontak */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6">
                    {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <StarIcon className="h-5 w-5"/> Reputasi Tim
                    </h3>
                    <div className="text-center">
                        {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                        <p className="text-5xl font-clash text-coc-gold my-1">{rating.toFixed(1)} <StarIcon className="inline h-8 w-8"/></p>
                        <p className="text-sm text-gray-400">(Berdasarkan 120 Ulasan)</p>
                        <Link href={`/team/${teamId}/reviews`} className="text-sm text-coc-gold hover:underline mt-2 inline-block">Lihat Semua Ulasan</Link>
                    </div>

                    {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ShieldIcon className="h-5 w-5"/> Ringkasan Statistik
                    </h3>
                    <ul className="text-sm space-y-2">
                        <li className="flex justify-between text-gray-300"><span className='font-bold flex items-center gap-2'><ShieldIcon className="h-4 w-4 text-coc-gold-dark"/> Rata-rata TH:</span> <strong className='text-white'>{avgTh.toFixed(1)}</strong></li>
                        <li className="flex justify-between text-gray-300"><span className='font-bold flex items-center gap-2'><UserIcon className="h-4 w-4 text-coc-gold-dark"/> Anggota:</span> <strong className='text-white'>{members.length}/50</strong></li> 
                        <li className="flex justify-between text-gray-300"><span className='font-bold flex items-center gap-2'><TrophyIcon className="h-4 w-4 text-coc-gold-dark"/> Trofi Tim:</span> <strong className='text-white'>45.000</strong></li>
                    </ul>

                    {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ClockIcon className="h-5 w-5"/> Event Terdekat
                    </h3>
                    <div className="bg-coc-stone/50 p-4 rounded-lg text-center border border-coc-gold-dark/20">
                        <p className="font-bold text-gray-300 mb-1">{upcomingEvent.name}:</p>
                        {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                        <p className="font-clash text-2xl text-coc-gold">{upcomingEvent.date}</p>
                        <p className="text-xs text-gray-400">{upcomingEvent.time}</p>
                    </div>

                    {/* PERBAIKAN FONT: Ganti font-supercell menjadi font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        Kontak & Sosial
                    </h3>
                    <ul className="text-sm space-y-2">
                        {website ? (
                            <li className="flex items-center gap-2"><GlobeIcon className="h-4 w-4 text-coc-gold-dark"/> <a href={website} target="_blank" rel="noopener noreferrer" className='text-coc-gold hover:underline'>{website}</a></li>
                        ) : (
                            <li className="text-gray-500 flex items-center gap-2"><GlobeIcon className="h-4 w-4 text-gray-500"/> Website belum diatur</li>
                        )}
                        {discordId ? (
                            <li className="flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-coc-gold-dark"/> <span className='text-gray-300'>{discordId}</span></li>
                        ) : (
                            <li className="text-gray-500 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-gray-500"/> Discord belum diatur</li>
                        )}
                    </ul>
                </aside>

                {/* Kolom Kanan: Detail Visi, Riwayat & Anggota */}
                <section className="lg:col-span-3 space-y-8">
                    
                    {/* Tab Navigation (Client Side Interactivity) */}
                    <div className="card-stone p-6">
                        <TeamProfileTabs 
                            team={team} 
                            members={members} 
                            competitionHistory={competitionHistory}
                            // HAPUS PROP getRankColor
                        />
                    </div>
                </section>
            </section>
        </main>
    );
};

export default TeamDetailPage;
