import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
// PERBAIKAN #1: Mengganti Team dengan ManagedClan dan menambahkan ClanApiCache
import { ManagedClan, UserProfile, ClanApiCache, ClanRole } from '@/lib/types';
// PERBAIKAN #2: Mengganti getTeamById dengan getManagedClanData dan menambahkan getClanApiCache
import { getManagedClanData, getTeamMembers, getClanApiCache } from '@/lib/firestore';
import {
    ArrowLeftIcon, StarIcon, ShieldIcon, UserIcon, GlobeIcon,
    DiscordIcon, ClockIcon, TrophyIcon, MapPinIcon, InfoIcon
} from '@/app/components/icons';
import { getSessionUser } from '@/lib/server-auth'; // Digunakan untuk tombol manajemen

// Definisikan tipe untuk parameter rute dinamis
interface TeamDetailPageProps {
    params: {
        teamId: string;
    };
}

// --- HELPER UNTUK KETERANGAN PARTISIPASI (Sesuai ManageClanClient) ---
const getParticipationStatusClass = (status: ClanApiCache['members'][number]['participationStatus'] | 'Aman') => {
    switch (status) {
        case 'Promosi':
            return 'bg-coc-gold/20 text-coc-gold border border-coc-gold/30';
        case 'Demosi':
            return 'bg-coc-red/20 text-coc-red border border-coc-red/30';
        case 'Leader/Co-Leader':
            return 'bg-coc-blue/20 text-coc-blue border border-coc-blue/30';
        case 'Aman':
        default:
            return 'bg-coc-green/20 text-coc-green border border-coc-green/30';
    }
}

// Tambahkan tipe untuk anggota yang diperkaya
type EnrichedMember = UserProfile & {
    warSuccessCount: number;
    warFailCount: number;
    participationStatus: ClanApiCache['members'][number]['participationStatus'] | 'Aman';
    trophies: number;
    donations: number;
};

// =========================================================================
// SERVER DATA FETCHING
// =========================================================================

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({ params }: TeamDetailPageProps): Promise<Metadata> {
    const teamId = decodeURIComponent(params.teamId);
    // PERBAIKAN #3: Menggunakan getManagedClanData
    const team = await getManagedClanData(teamId); 

    if (!team) {
        return { title: "Tim Tidak Ditemukan | Clashub" };
    }

    return {
        title: `Clashub | Profil Klan: ${team.name} (${team.tag})`,
        description: `Lihat profil klan internal ${team.name} di Clashub. Level klan: ${team.clanLevel}, Rata-rata TH: ${team.avgTh}.`,
    };
}

/**
 * @component TeamDetailPage (Server Component)
 * Menampilkan detail lengkap profil klan internal (ManagedClan).
 */
const TeamDetailPage = async ({ params }: TeamDetailPageProps) => {
    const teamId = decodeURIComponent(params.teamId);
    const sessionUser = await getSessionUser();

    // Mengambil data ManagedClan, Cache API, dan Anggota secara paralel
    const [managedClan, apiCache, members] = await Promise.all([
        getManagedClanData(teamId),
        getClanApiCache(teamId), // Mengambil data cache Partisipasi
        getTeamMembers(teamId) // Mengambil anggota (UserProfile yang teamId-nya cocok)
    ]);

    if (!managedClan) {
        notFound();
    }
    
    // Mengambil rating dummy (karena ManagedClan tidak punya field rating)
    const teamRating = 5.0; 

    const { name, tag, vision, avgTh, website, discordId, clanLevel, ownerUid } = managedClan;
    const isCompetitive = vision === 'Kompetitif';
    const isFull = members.length >= 50;
    const isClanOwner = sessionUser?.uid === ownerUid;
    
    // Temukan data Partisipasi anggota klan dari cache
    const enrichedMembers: EnrichedMember[] = members.map(member => {
        // Cari data cache klan (yang berisi metrik partisipasi) berdasarkan playerTag
        const cacheMember = apiCache?.members.find(cm => cm.tag === member.playerTag);

        return {
            ...member,
            // Partisipasi dikalkulasi dari cache
            warSuccessCount: cacheMember?.warSuccessCount || 0,
            warFailCount: cacheMember?.warFailCount || 0,
            participationStatus: cacheMember?.participationStatus || 'Aman',
            // Gunakan data CoC yang lebih baru dari cache/API jika ada
            trophies: cacheMember?.trophies || member.trophies, 
            // Tambahkan Donasi jika diperlukan (dari CocMember di cache)
            donations: cacheMember?.donations || 0,
            // Memastikan role klan dari cache API digunakan jika tersedia, fallback ke role Clashub
            clanRole: (cacheMember?.role as unknown as ClanRole) || member.clanRole || ClanRole.NOT_IN_CLAN,
        };
    });
    
    // Sort anggota berdasarkan TH level (Tertinggi ke Terendah)
    enrichedMembers.sort((a, b) => b.thLevel - a.thLevel);

    // Data dummy untuk Riwayat Kompetisi (dipertahankan)
    const competitionHistory = [
        { tournament: "ClashHub Liga Musim 2", rank: "Juara 3", date: "Sep 2025", prize: "Rp 5.000.000" },
        { tournament: "TH 15 Open Cup", rank: "Peringkat 9", date: "Mei 2025", prize: "-" },
    ];

    // Data dummy untuk Event Terdekat (dipertahankan)
    const upcomingEvent = {
        name: "War Clan Berikutnya",
        date: "7 Oktober",
        time: "20:00 WIB (Persiapan)",
    };

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Header Profil Tim */}
            <header className="flex justify-between items-center flex-wrap gap-4 mb-8 card-stone p-6 rounded-lg">
                <div className="flex items-center gap-4">
                    <Button href="/teamhub" variant="secondary" size="md" className="flex items-center flex-shrink-0">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali
                    </Button>

                    <div>
                        <h1 className="text-3xl lg:text-4xl text-white font-clash m-0">{name}</h1>
                        <p className="text-sm text-coc-gold font-bold mb-1">{tag}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isCompetitive ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
                            {vision} (TH Avg: {avgTh.toFixed(1)}) | Level Klan: {clanLevel}
                        </span>
                    </div>
                </div>

                {/* Tombol Aksi */}
                {isClanOwner ? (
                    <Button href={`/clan/manage?clanId=${teamId}`} variant="primary" size="lg">
                        <InfoIcon className="h-5 w-5 mr-2" /> Kelola Klan
                    </Button>
                ) : isFull ? (
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

                {/* Kolom Kiri: Statistik & Kontak */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 rounded-lg">
                    {/* Reputasi Tim */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <StarIcon className="h-5 w-5"/> Reputasi Tim
                    </h3>
                    <div className="text-center">
                        {/* Rating placeholder 5.0 */}
                        <p className="text-5xl font-clash text-coc-gold my-1">{teamRating.toFixed(1)} <StarIcon className="inline h-8 w-8"/></p>
                        <p className="text-xs text-gray-500">(Berdasarkan 120 Ulasan)</p>
                        <Link href={`/team/${teamId}/reviews`} className="text-xs text-coc-gold hover:underline mt-2 inline-block">Lihat Semua Ulasan</Link>
                    </div>

                    {/* Ringkasan Statistik */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ShieldIcon className="h-5 w-5"/> Ringkasan Statistik
                    </h3>
                    <ul className="text-sm space-y-3">
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><ShieldIcon className="h-4 w-4 text-coc-gold-dark"/> Level Klan:</span> <strong className='text-white font-clash text-base'>{clanLevel}</strong></li>
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><UserIcon className="h-4 w-4 text-coc-gold-dark"/> Anggota:</span> <strong className='text-white font-clash text-base'>{members.length}/50</strong></li>
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><TrophyIcon className="h-4 w-4 text-coc-gold-dark"/> Rata-rata TH:</span> <strong className='text-white font-clash text-base'>{avgTh.toFixed(1)}</strong></li>
                        <li className="flex justify-between items-center"><span className='font-medium text-gray-400 flex items-center gap-2'><TrophyIcon className="h-4 w-4 text-coc-gold-dark"/> War Winstreak:</span> <strong className='text-white font-clash text-base'>N/A</strong></li> {/* Placeholder */}
                    </ul>

                    {/* Event Terdekat */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ClockIcon className="h-5 w-5"/> Event Terdekat
                    </h3>
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
                    
                    {/* TAB ANGGOTA DENGAN PARTISIPASI */}
                    <div className="card-stone p-6 space-y-6">
                         <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                            <UserIcon className="h-6 w-6 text-coc-gold" /> Anggota Tim ({members.length}/50)
                         </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                                <thead className="bg-coc-stone/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Nama (TH)</th>
                                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Role</th>
                                        <th className="px-3 py-2 text-center font-clash text-coc-green uppercase tracking-wider">Sukses War</th>
                                        <th className="px-3 py-2 text-center font-clash text-coc-red uppercase tracking-wider">Gagal War</th>
                                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Status Partisipasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-coc-gold-dark/10">
                                    {enrichedMembers.map((member) => (
                                        <tr key={member.uid} className="hover:bg-coc-stone/20 transition-colors">
                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                                                <Link href={`/player/${member.uid}`} className="hover:text-coc-gold-light transition-colors">
                                                    {member.displayName}
                                                </Link>
                                                <span className="text-gray-500 block text-xs">TH{member.thLevel} | {member.playerTag}</span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center text-xs uppercase font-medium text-coc-gold-light">{member.clanRole}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-green font-bold">{member.warSuccessCount}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-red font-bold">{member.warFailCount}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-left">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-sans font-medium ${getParticipationStatusClass(member.participationStatus)}`}>
                                                    {member.participationStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* TAB RIWAYAT KOMPETISI */}
                    <div className="card-stone p-6 space-y-6">
                        <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                             <TrophyIcon className="h-6 w-6 text-coc-gold" /> Riwayat Kompetisi
                         </h2>
                        
                        <div className="space-y-4">
                            {competitionHistory.map((comp, index) => (
                                <div key={index} className="flex justify-between items-center p-4 bg-coc-stone/70 rounded-lg border border-coc-gold-dark/20">
                                    <div>
                                        <h3 className="font-clash text-lg text-white">{comp.tournament}</h3>
                                        <p className="text-xs text-gray-400">{comp.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${comp.rank.includes('Juara') ? 'text-coc-gold' : 'text-gray-300'}`}>{comp.rank}</p>
                                        {comp.prize !== '-' && <p className="text-sm text-coc-green">{comp.prize}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                </section>
            </section>
        </main>
    );
};

export default TeamDetailPage;
