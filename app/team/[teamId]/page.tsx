import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
import { Team, UserProfile } from '@/lib/types';
import { getTeamById, getTeamMembers } from '@/lib/firestore';
import {
    ArrowLeftIcon, StarIcon, ShieldIcon, UserIcon, GlobeIcon,
    DiscordIcon, ClockIcon, TrophyIcon
} from '@/app/components/icons';
import TeamProfileTabs from '../components/TeamProfileTabs'; // Tetap import

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

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Header Profil Tim - Styling Disesuaikan */}
            <header className="flex justify-between items-center flex-wrap gap-4 mb-8 card-stone p-6 rounded-lg"> {/* Tambah mb-8 & rounded-lg */}
                <div className="flex items-center gap-4">
                    <Button href="/teamhub" variant="secondary" size="md" className="flex items-center flex-shrink-0">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali
                    </Button>

                    <div>
                        {/* Judul Tim dengan ukuran lebih besar di layar besar */}
                        <h1 className="text-3xl lg:text-4xl text-white font-clash m-0">{name}</h1>
                        {/* Tag tim dengan warna lebih soft */}
                        <p className="text-sm text-coc-gold-dark font-bold mb-1">{tag}</p>
                        {/* Badge Visi tetap sama */}
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isCompetitive ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
                            {vision} (TH Avg: {avgTh.toFixed(1)})
                        </span>
                    </div>
                </div>

                {/* Tombol Aksi - Kondisional - Styling Roster Penuh Ditingkatkan */}
                {isFull ? (
                     // Styling lebih tegas untuk Roster Penuh
                    <span className="px-4 py-2 bg-coc-red border-2 border-red-900 text-white rounded-lg text-sm font-bold shadow-md">
                        Roster Penuh
                    </span>
                ) : (
                    <Button href={`/team/${teamId}/join`} variant="primary" size="lg">
                        Kirim Permintaan Bergabung
                    </Button>
                )}
            </header>

            {/* Layout Utama Profil */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Kolom Kiri: Statistik & Kontak - Styling Disesuaikan */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 rounded-lg"> {/* Tambah rounded-lg */}
                    {/* Reputasi Tim */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <StarIcon className="h-5 w-5"/> Reputasi Tim
                    </h3>
                    <div className="text-center">
                        <p className="text-5xl font-clash text-coc-gold my-1">{rating.toFixed(1)} <StarIcon className="inline h-8 w-8"/></p>
                        <p className="text-xs text-gray-500">(Berdasarkan 120 Ulasan)</p> {/* Warna sedikit lebih gelap */}
                        <Link href={`/team/${teamId}/reviews`} className="text-xs text-coc-gold hover:underline mt-2 inline-block">Lihat Semua Ulasan</Link>
                    </div>

                    {/* Ringkasan Statistik */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ShieldIcon className="h-5 w-5"/> Ringkasan Statistik
                    </h3>
                    {/* Styling list lebih konsisten */}
                    <ul className="text-sm space-y-3">
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><ShieldIcon className="h-4 w-4 text-coc-gold-dark"/> Rata-rata TH:</span> <strong className='text-white font-clash text-base'>{avgTh.toFixed(1)}</strong></li>
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><UserIcon className="h-4 w-4 text-coc-gold-dark"/> Anggota:</span> <strong className='text-white font-clash text-base'>{members.length}/50</strong></li>
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><TrophyIcon className="h-4 w-4 text-coc-gold-dark"/> Trofi Tim:</span> <strong className='text-white font-clash text-base'>45.000</strong></li>
                    </ul>

                    {/* Event Terdekat */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ClockIcon className="h-5 w-5"/> Event Terdekat
                    </h3>
                    {/* Background sedikit lebih kontras */}
                    <div className="bg-coc-stone/70 p-4 rounded-lg text-center border border-coc-gold-dark/30 shadow-inner">
                        <p className="font-semibold text-gray-300 mb-1">{upcomingEvent.name}:</p>
                        <p className="font-clash text-2xl text-coc-gold">{upcomingEvent.date}</p>
                        <p className="text-xs text-gray-400">{upcomingEvent.time}</p>
                    </div>

                    {/* Kontak & Sosial */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        Kontak & Sosial
                    </h3>
                    <ul className="text-sm space-y-3">
                        {website ? (
                            <li className="flex items-center gap-2">
                                <GlobeIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0"/>
                                <a href={website} target="_blank" rel="noopener noreferrer" className='text-coc-gold hover:underline truncate' title={website}>{website.replace(/^(https?:\/\/)?(www\.)?/, '')}</a>
                            </li>
                        ) : (
                            <li className="text-gray-500 flex items-center gap-2"><GlobeIcon className="h-4 w-4 text-gray-500"/> Website belum diatur</li>
                        )}
                        {discordId ? (
                             <li className="flex items-center gap-2">
                                <DiscordIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0"/>
                                <span className='text-gray-300 truncate' title={discordId}>{discordId}</span>
                            </li>
                        ) : (
                            <li className="text-gray-500 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-gray-500"/> Discord belum diatur</li>
                        )}
                    </ul>
                </aside>

                {/* Kolom Kanan: Detail Visi, Riwayat & Anggota */}
                <section className="lg:col-span-3 space-y-8">
                    {/* Konten Tab di-handle oleh Client Component */}
                    <div className="w-full">
                        <TeamProfileTabs
                            team={team}
                            members={members}
                            competitionHistory={competitionHistory}
                            // getRankColor tidak lagi diteruskan
                        />
                    </div>
                </section>
            </section>
        </main>
    );
};

export default TeamDetailPage;
