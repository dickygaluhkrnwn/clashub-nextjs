'use client'; 

import { useState, useEffect } from 'react'; 
import { NextPage } from 'next'; 
import { useParams } from 'next/navigation'; 
import { PublicClanIndex, CocMember } from '@/lib/types';
// Mengimpor semua ikon yang diperlukan
import { GlobeIcon, ShieldIcon, UserIcon, TrophyIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, RefreshCwIcon, StarIcon, ExternalLinkIcon, AlertTriangleIcon, Loader2Icon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import Image from 'next/image'; 
import Link from 'next/link'; 
import { useLanguage } from '@/lib/hooks/useLanguage';

// Mendefinisikan Tipe Data Klan yang Diterima di Client
interface ClientClanData extends PublicClanIndex {
    memberList?: CocMember[]; 
    warLeague?: { id: number; name: string; };
    chatLanguage?: { id: number; name: string; };
    isFamilyFriendly?: boolean;
}

// Utility untuk memformat Tag
const formatTag = (tag: string) => tag.replace('%23', '#');

// Helper Component for Stats Card
const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string | number, color: string }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md hover:bg-white/5 transition-colors group">
        <div className={`p-2 rounded-full mb-2 ${color.replace('text-', 'bg-')}/10`}>
            <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <p className="text-xl md:text-2xl font-clash text-white mb-1 group-hover:scale-110 transition-transform">{value}</p>
        <p className="text-[10px] md:text-xs uppercase tracking-wider text-gray-400 font-bold text-center">{title}</p>
    </div>
);

// Helper Component for Detail Item
const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
        <div className="p-2 rounded-lg bg-black/20">
            <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{label}</p>
            <p className="text-sm font-medium text-gray-200">{value}</p>
        </div>
    </div>
);

// =========================================================================
// MAIN COMPONENT (CLIENT COMPONENT)
// =========================================================================
const ClanPublicProfilePage: NextPage = () => {
    const { t } = useLanguage(); 
    const params = useParams();
    const encodedTag = params.clanTag as string; 
    const [clan, setClan] = useState<ClientClanData | null>(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // --- Client-side Data Fetching ---
    useEffect(() => {
        const fetchClanData = async () => {
            if (!encodedTag) return;

            setLoading(true);
            setError(null);
            setClan(null); 
            console.log(`[ClanPublicProfilePage Client] Fetching data for encoded tag: ${encodedTag}`);

            const internalApiUrl = `/api/coc/search-clan?clanTag=${encodedTag}`;
            
            try {
                const response = await fetch(internalApiUrl);
                
                if (response.status === 404) {
                    setError(t.clanPublicProfile.notFound || "Klan tidak ditemukan.");
                    return;
                }

                 if (!response.ok) {
                    let errorMessage = `Gagal memuat data klan (Status: ${response.status})`;
                    try {
                        const errorBody = await response.json();
                        errorMessage = errorBody.error || errorBody.message || errorMessage;
                    } catch (parseError) {
                        console.error("[ClanPublicProfilePage Client] Failed to parse error response:", parseError);
                    }
                    throw new Error(errorMessage);
                 }

                // Jika response OK, parse JSON
                const result = await response.json();
                if (result.clan) {
                    setClan(result.clan as ClientClanData);
                } else {
                    throw new Error("Format data klan tidak valid dari server.");
                }

            } catch (err) {
                console.error(`[ClanPublicProfilePage Client] Error fetching clan data for tag ${encodedTag}:`, err);
                setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
                setClan(null);
            } finally {
                setLoading(false);
            }
        };

        fetchClanData();
    }, [encodedTag, t]); 

    // --- Loading State ---
    if (loading) {
        return (
            <main className="min-h-screen bg-coc-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-coc-gold/10 animate-pulse border border-coc-gold/20">
                        <Loader2Icon className="h-12 w-12 text-coc-gold animate-spin" />
                    </div>
                    <p className="text-lg font-clash text-gray-400 tracking-wide animate-pulse">
                        {t.clanPublicProfile.loading || "Memuat Profil Klan..."}
                    </p>
                </div>
            </main>
        );
    }

    // --- Error State ---
     if (error || !clan) { 
          return (
               <main className="min-h-screen bg-coc-dark pt-24 px-4 pb-20 flex flex-col items-center">
                   <div className="w-full max-w-lg text-center space-y-6">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                            <AlertTriangleIcon className="h-16 w-16 text-coc-red mx-auto mb-4 opacity-80" />
                            <h1 className="text-2xl text-white font-clash mb-2">
                                {t.clanPublicProfile.errorTitle || "Terjadi Kesalahan"}
                            </h1>
                            <p className="text-gray-400 mb-6">
                                {error || "Data klan tidak dapat ditampilkan."}
                            </p>
                            <Button href="/clan-hub" variant="secondary" size="md">
                                 <ArrowLeftIcon className="h-4 w-4 mr-2" /> 
                                 {t.clanPublicProfile.backToHub || "Kembali ke Clan Hub"}
                            </Button>
                        </div>
                   </div>
               </main>
           );
       }


    // --- Render Clan Data ---
    const lastUpdatedTime = clan.lastUpdated
        ? new Date(clan.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : 'N/A';

    const memberList: CocMember[] = clan.memberList || [];
    const decodedTag = formatTag(clan.tag);
    const rawTag = decodedTag.replace('#', ''); 

    const joinUrl = `https://link.clashofclans.com/en/?action=OpenClanProfile&tag=${rawTag}`;
    const memberCountValue = `${memberList.length || clan.memberCount || 0}/50`;

    return (
        <main className="min-h-screen bg-coc-dark pb-20 relative overflow-x-hidden">
             {/* 1. HERO BACKGROUND (REVISI STYLE) */}
             {/* Menggunakan Ambient Glow daripada blok hitam keras */}
             <div className="absolute top-0 left-0 w-full h-[500px] bg-radial-at-t from-coc-blue/10 via-coc-dark/50 to-coc-dark pointer-events-none z-0" />
             <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-coc-gold/5 rounded-full blur-3xl pointer-events-none z-0" />
             <div className="absolute top-[200px] left-[-100px] w-64 h-64 bg-coc-blue/5 rounded-full blur-3xl pointer-events-none z-0" />

            <div className="container mx-auto px-4 md:px-8 relative z-10 pt-24 md:pt-32">
                
                {/* 2. HEADER PROFILE KLAN */}
                <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-end mb-12">
                    {/* Logo Klan */}
                    <div className="relative shrink-0 group">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-black/40 border-2 border-white/10 p-3 shadow-2xl backdrop-blur-md transform group-hover:scale-105 transition-transform duration-300">
                            {/* Menggunakan img tag karena URL eksternal dinamis */}
                            <img 
                                src={clan.badgeUrls.large || '/images/clan-badge-placeholder.png'}
                                alt={`${clan.name} Badge`}
                                className="w-full h-full object-contain drop-shadow-xl"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/images/clan-badge-placeholder.png';
                                }}
                            />
                        </div>
                        <div className="absolute -bottom-3 -right-3 bg-coc-stone border border-coc-gold/30 text-coc-gold px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-black/50">
                            Level {clan.clanLevel}
                        </div>
                    </div>

                    {/* Info Utama */}
                    <div className="flex-grow w-full text-center lg:text-left space-y-4">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-clash text-white mb-2 drop-shadow-lg leading-tight tracking-tight">
                                {clan.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                <span className="font-mono text-gray-400 font-bold tracking-wide bg-white/5 px-3 py-1 rounded-lg border border-white/10 text-sm md:text-base">
                                    {decodedTag}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider border ${
                                    clan.type === 'inviteOnly' ? 'bg-coc-orange/10 text-coc-orange border-coc-orange/20' :
                                    clan.type === 'closed' ? 'bg-coc-red/10 text-coc-red border-coc-red/20' :
                                    'bg-coc-green/10 text-coc-green border-coc-green/20'
                                }`}>
                                    {clan.type === 'inviteOnly' ? 'Invite Only' : clan.type === 'closed' ? 'Closed' : 'Open'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                                <MapPinIcon className="h-4 w-4 text-coc-blue" />
                                {clan.location?.name || 'International'}
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                                <ClockIcon className="h-4 w-4 text-gray-500" />
                                Updated: {lastUpdatedTime}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0 min-w-[200px]">
                        <Button 
                            href={joinUrl} 
                            target="_blank" 
                            variant="primary" 
                            size="lg" 
                            className="w-full justify-center shadow-xl shadow-coc-gold/20"
                        >
                            <ExternalLinkIcon className='w-5 h-5 mr-2'/> 
                            {t.clanPublicProfile.joinClan || "Buka di CoC"}
                        </Button>
                        {/* Tombol Kembali ke Hub Dihapus */}
                    </div>
                </div>

                {/* 3. MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: STATS & DETAILS */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Summary Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard 
                                icon={UserIcon} 
                                title={t.clanPublicProfile.stats.members || "Anggota"} 
                                value={memberCountValue} 
                                color="text-coc-blue" 
                            />
                            <StatCard 
                                icon={TrophyIcon} 
                                title={t.clanPublicProfile.stats.clanPoints || "Poin Klan"} 
                                value={clan.clanPoints.toLocaleString()} 
                                color="text-coc-gold" 
                            />
                            <StatCard 
                                icon={StarIcon} 
                                title="Versus Poin" 
                                value={clan.clanVersusPoints?.toLocaleString() || '0'} 
                                color="text-purple-400" 
                            />
                            <StatCard 
                                icon={ShieldIcon} 
                                title={t.clanPublicProfile.stats.warWins || "War Won"} 
                                value={clan.warWins?.toLocaleString() || '0'} 
                                color="text-coc-green" 
                            />
                        </div>

                        {/* Description */}
                        <section className="bg-gradient-to-b from-[#252525] to-[#1a1a1a] rounded-3xl border border-white/5 p-6 md:p-8 shadow-xl">
                            <h2 className="text-xl font-clash text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <div className="p-2 rounded-lg bg-coc-gold/10 border border-coc-gold/20">
                                    <StarIcon className="h-5 w-5 text-coc-gold" />
                                </div>
                                {t.clanPublicProfile.descriptionTitle || "Tentang Klan"}
                            </h2>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line font-sans text-sm md:text-base">
                                {clan.description || t.clanPublicProfile.noDescription}
                            </p>
                        </section>

                        {/* Additional Details Grid */}
                        <section>
                            <h3 className="text-lg font-clash text-gray-400 mb-4 px-2 uppercase tracking-widest">Detail Informasi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem icon={ClockIcon} label={t.clanPublicProfile.details.warFreq || "Frekuensi War"} value={clan.warFrequency || 'N/A'} />
                                <DetailItem icon={ShieldIcon} label={t.clanPublicProfile.details.winStreak || "Win Streak"} value={clan.warWinStreak?.toString() || '0'} />
                                <DetailItem icon={TrophyIcon} label={t.clanPublicProfile.details.requiredTrophies || "Min. Trophy"} value={clan.requiredTrophies?.toLocaleString() || '0'} />
                                <DetailItem icon={StarIcon} label="Clan Capital" value={clan.clanCapitalPoints?.toLocaleString() || '0'} />
                                {clan.warLeague && (
                                    <DetailItem icon={TrophyIcon} label="War League" value={clan.warLeague.name} />
                                )}
                                {clan.chatLanguage && (
                                    <DetailItem icon={GlobeIcon} label="Bahasa Chat" value={clan.chatLanguage.name} />
                                )}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: MEMBER LIST */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden shadow-xl sticky top-24">
                            <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
                                <h2 className="text-xl font-clash text-white flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-coc-blue" />
                                    {t.clanPublicProfile.memberListTitle || "Daftar Anggota"}
                                </h2>
                                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-gray-300">
                                    {memberList.length}/50
                                </span>
                            </div>
                            
                            {memberList.length > 0 ? (
                                <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-2">
                                    <div className="space-y-1">
                                        {memberList
                                            .sort((a, b) => {
                                                const rolePriority: { [key: string]: number } = { 'leader': 1, 'coLeader': 2, 'admin': 3, 'elder': 3, 'member': 4 };
                                                const priorityA = rolePriority[a.role.toLowerCase()] || 5;
                                                const priorityB = rolePriority[b.role.toLowerCase()] || 5;
                                                return priorityA - priorityB || b.townHallLevel - a.townHallLevel;
                                            })
                                            .map((member) => (
                                                <div key={member.tag} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                                    {/* TH Badge */}
                                                    <div className="relative shrink-0 w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-coc-gold/30">
                                                        <span className="text-[10px] text-gray-500 font-bold absolute -top-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] px-1 rounded">TH</span>
                                                        <span className="text-lg font-bold text-white group-hover:text-coc-gold">{member.townHallLevel}</span>
                                                    </div>
                                                    
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-baseline justify-between">
                                                            <Link 
                                                                href={`/player/${encodeURIComponent(member.tag)}`}
                                                                className="text-sm font-bold text-gray-200 hover:text-white truncate block"
                                                            >
                                                                {member.name}
                                                            </Link>
                                                            <span className="text-[10px] text-coc-gold font-bold ml-2">
                                                                {member.league?.name || "Unranked"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-0.5">
                                                            <span className={`text-[10px] uppercase font-bold tracking-wide ${
                                                                member.role === 'leader' ? 'text-coc-gold' : 
                                                                member.role === 'coLeader' ? 'text-gray-300' : 
                                                                'text-gray-500'
                                                            }`}>
                                                                {member.role === 'admin' ? 'Elder' : member.role}
                                                            </span>
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                <span className="flex items-center gap-0.5 text-coc-green">
                                                                    ▲ {member.donations.toLocaleString()}
                                                                </span>
                                                                <span className="flex items-center gap-0.5 text-coc-red">
                                                                    ▼ {member.donationsReceived.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">{t.clanPublicProfile.memberListEmpty || "Data anggota tidak tersedia."}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};

export default ClanPublicProfilePage;