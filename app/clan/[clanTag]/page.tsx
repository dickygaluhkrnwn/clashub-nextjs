'use client'; 

import { useState, useEffect } from 'react'; 
import { NextPage } from 'next'; 
import { useParams } from 'next/navigation'; 
import { PublicClanIndex, CocMember } from '@/lib/types';
// Mengimpor semua ikon yang diperlukan
import { GlobeIcon, ShieldIcon, UserIcon, TrophyIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, RefreshCwIcon, StarIcon, ExternalLinkIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import Image from 'next/image'; 
import Link from 'next/link'; 
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

// Mendefinisikan Tipe Data Klan yang Diterima di Client
interface ClientClanData extends PublicClanIndex {
    memberList?: CocMember[]; 
    warLeague?: { id: number; name: string; };
    chatLanguage?: { id: number; name: string; };
    isFamilyFriendly?: boolean;
}

// Utility untuk memformat Tag
const formatTag = (tag: string) => tag.replace('%23', '#');

// =========================================================================
// MAIN COMPONENT (CLIENT COMPONENT)
// =========================================================================
const ClanPublicProfilePage: NextPage = () => {
    const { t } = useLanguage(); // [BARU]
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

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin; 
            const internalApiUrl = `${baseUrl}/api/coc/search-clan?clanTag=${encodedTag}`;
            console.log(`[ClanPublicProfilePage Client] Calling API route: ${internalApiUrl}`);

            try {
                const response = await fetch(internalApiUrl);
                console.log(`[ClanPublicProfilePage Client] API route response status: ${response.status}`);

                if (response.status === 404) {
                    console.log(`[ClanPublicProfilePage Client] Clan not found (404) for tag: ${encodedTag}`);
                    setError(t.clanPublicProfile.notFound);
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
                    console.error(`[ClanPublicProfilePage Client] Failed fetch. Status: ${response.status}, Message: ${errorMessage}`);
                    throw new Error(errorMessage);
                 }


                // Jika response OK, parse JSON
                const result = await response.json();
                console.log(`[ClanPublicProfilePage Client] Successfully fetched data for tag: ${encodedTag}. Source: ${result.source}`);
                if (result.clan) {
                    // result.clan sekarang bisa berupa PublicClanIndex (cache) atau CocClan (live)
                    setClan(result.clan as ClientClanData);
                } else {
                    console.warn("[ClanPublicProfilePage Client] API response OK but 'clan' data is missing:", result);
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
            <main className="max-w-7xl mx-auto p-4 md:p-8 mt-10 flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mx-auto mb-4" />
                    <p className="text-xl font-clash text-gray-400">{t.clanPublicProfile.loading}</p>
                </div>
            </main>
        );
    }

    // --- Error State ---
     if (error || !clan) { 
          return (
               <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
                   <div className="mb-6">
                       <Button href="/clan-hub" variant="secondary" size="md" className="flex items-center">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t.clanPublicProfile.backToHub}
                       </Button>
                   </div>
                   <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto rounded-lg">
                       <h1 className="text-3xl text-coc-red font-clash mb-4">
                           {error === t.clanPublicProfile.notFound ? `404 - ${t.clanPublicProfile.notFound}` : t.clanPublicProfile.errorTitle}
                       </h1>
                       <p className="text-xl text-gray-300">
                           {error || "Data klan tidak dapat ditampilkan."}
                       </p>
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
        <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
             {/* [MODIFIKASI] Tombol "Kembali ke Hub" di sini telah DIHAPUS agar sinkron dengan halaman lain */}

            {/* Konten utama */}
            <>
                {/* Header Klan Publik */}
                <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center rounded-lg">
                    <div className="flex items-center gap-6">
                        <ClanBadgeImage
                            src={clan.badgeUrls.large || '/images/clan-badge-placeholder.png'}
                            alt={`${clan.name} Badge`}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full border-4 border-coc-gold flex-shrink-0"
                        />
                        <div>
                            <h1 className="text-4xl font-clash text-white">{clan.name}</h1>
                            <p className="text-xl text-coc-gold font-sans font-bold">{decodedTag}</p>
                            <p className="text-sm text-gray-400 font-sans mt-1">Level {clan.clanLevel} Clan</p>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
                        <Button href={joinUrl} target="_blank" variant="primary" size="lg" className="flex items-center justify-center">
                            <ExternalLinkIcon className='w-5 h-5 mr-2'/> {t.clanPublicProfile.joinClan}
                        </Button>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3 inline" /> {t.clanPublicProfile.lastUpdated} {lastUpdatedTime}
                        </p>
                    </div>
                </div>

                {/* Ringkasan Statistik */}
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"> 
                    <StatCard icon={UserIcon} title={t.clanPublicProfile.stats.members} value={memberCountValue} color="text-coc-blue" />
                    <StatCard icon={TrophyIcon} title={t.clanPublicProfile.stats.clanPoints} value={clan.clanPoints.toLocaleString()} color="text-coc-gold" />
                    <StatCard icon={StarIcon} title={t.clanPublicProfile.stats.capitalPoints} value={clan.clanCapitalPoints?.toLocaleString() || 'N/A'} color="text-yellow-400" /> 
                    <StatCard icon={ShieldIcon} title={t.clanPublicProfile.stats.warWins} value={clan.warWins?.toLocaleString() || 'N/A'} color="text-coc-green" />
                    <StatCard icon={GlobeIcon} title={t.clanPublicProfile.stats.type} value={clan.type || 'N/A'} color="text-gray-400" />
                 </div>

                {/* Deskripsi & Detail */}
                <div className="card-stone p-6 space-y-4 rounded-lg">
                    <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">{t.clanPublicProfile.descriptionTitle}</h2>
                    <p className="text-gray-300 whitespace-pre-line font-sans">{clan.description || t.clanPublicProfile.noDescription}</p>
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                        <DetailItem icon={MapPinIcon} label={t.clanPublicProfile.details.location} value={clan.location?.name || 'Global'} />
                        <DetailItem icon={ClockIcon} label={t.clanPublicProfile.details.warFreq} value={clan.warFrequency || 'N/A'} />
                        <DetailItem icon={TrophyIcon} label={t.clanPublicProfile.details.requiredTrophies} value={clan.requiredTrophies?.toLocaleString() || '0'} />
                        <DetailItem icon={ShieldIcon} label={t.clanPublicProfile.details.winStreak} value={clan.warWinStreak?.toLocaleString() || '0'} />
                    </div>
                </div>

                {/* Daftar Anggota */}
                {memberList.length > 0 ? ( 
                    <div className="card-stone p-6 space-y-4 rounded-lg">
                        <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">{t.clanPublicProfile.memberListTitle} ({memberList.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                                <thead className="bg-coc-stone/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">{t.clanPublicProfile.table.player}</th>
                                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">{t.clanPublicProfile.table.role}</th>
                                        <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">{t.clanPublicProfile.table.trophies}</th>
                                        <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">{t.clanPublicProfile.table.donationsGiven}</th>
                                        <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">{t.clanPublicProfile.table.donationsReceived}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-coc-gold-dark/10">
                                    {memberList
                                    .sort((a, b) => {
                                            const rolePriority: { [key: string]: number } = { 'leader': 1, 'coLeader': 2, 'admin': 3, 'elder': 3, 'member': 4 };
                                            const priorityA = rolePriority[a.role.toLowerCase()] || 5;
                                            const priorityB = rolePriority[b.role.toLowerCase()] || 5;
                                            
                                            if (priorityA !== priorityB) return priorityA - priorityB;
                                            return b.townHallLevel - a.townHallLevel;
                                    })
                                    .map((member) => (
                                    <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold">
                                                <Link 
                                                    href={`/player/${encodeURIComponent(member.tag)}`} 
                                                    className="text-white hover:text-coc-gold transition-colors block"
                                                    title={`Lihat Profil Pemain: ${member.name}`}
                                                >
                                                    {member.name}
                                                </Link>
                                                <span className="text-gray-500 block text-xs">TH{member.townHallLevel} | {member.tag}</span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center text-xs uppercase font-medium text-coc-gold-light">{member.role}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-300">{member.trophies.toLocaleString()}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-coc-green">{member.donations.toLocaleString()}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-coc-red">{member.donationsReceived.toLocaleString()}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-500 font-sans pt-2">
                             {t.clanPublicProfile.disclaimer}
                        </p>
                    </div>
                ) : (
                    <div className="card-stone p-6 rounded-lg">
                          <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">{t.clanPublicProfile.memberListTitle}</h2>
                          <p className="text-gray-400 text-center py-5">{t.clanPublicProfile.memberListEmpty}</p>
                    </div>
                )}
            </>
        </main>
    );
};

// =========================================================================
// CLIENT COMPONENT FOR CLAN BADGE WITH FALLBACK
// =========================================================================
interface ClanBadgeImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
}

const ClanBadgeImage: React.FC<ClanBadgeImageProps> = ({ src: initialSrc, alt, width, height, className }) => {
    const [currentSrc, setCurrentSrc] = useState(initialSrc);
    const placeholderSrc = '/images/clan-badge-placeholder.png';

    useEffect(() => {
        setCurrentSrc(initialSrc || placeholderSrc);
    }, [initialSrc, placeholderSrc]);

    const handleError = () => {
        if (currentSrc !== placeholderSrc) {
            console.warn(`[ClanBadgeImage] Failed to load image: ${initialSrc}. Falling back to placeholder.`);
            setCurrentSrc(placeholderSrc);
        }
    };

    return (
        <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            className={className}
            onError={handleError} 
        />
    );
};

// =========================================================================
// HELPER COMPONENTS
// =========================================================================
const StatCard = ({ icon: Icon, title, value, color }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, title: string, value: string | undefined, color: string }) => ( 
    <div className="card-stone p-4 flex items-center space-x-3 bg-coc-stone/50 rounded-lg">
        <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
        <div>
            <p className="text-sm text-gray-400 font-sans">{title}</p>
            <p className="text-xl font-clash text-white">{value ?? 'N/A'}</p>
        </div>
    </div>
);


const DetailItem = ({ icon: Icon, label, value }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string, value: string | undefined }) => ( 
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-coc-gold flex-shrink-0" />
        <p>
            <span className="font-bold text-white">{label}:</span> {value ?? 'N/A'} 
        </p>
    </div>
);

export default ClanPublicProfilePage;