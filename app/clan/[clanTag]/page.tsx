'use client'; // Marking the whole file as client component is simpler for now to fix the immediate issue.
// Ideally, the image part should be its own client component if the rest needs to be server.

import { useState, useEffect } from 'react'; // Need useState, useEffect for client component
import { NextPage } from 'next'; // Removed Metadata as it's complex with client-side fetching
import { useParams } from 'next/navigation'; // Need useParams on client
import { PublicClanIndex, CocMember } from '@/lib/types';
// Added icons needed for new data points (e.g., StarIcon for Capital Points)
import { GlobeIcon, ShieldIcon, UserIcon, TrophyIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, RefreshCwIcon, StarIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import Image from 'next/image'; // Import Image component
import Link from 'next/link'; // Need Link on client

// Utility untuk memformat Tag (Tidak berubah)
const formatTag = (tag: string) => tag.replace('%23', '#');

// =========================================================================
// MAIN COMPONENT (NOW A CLIENT COMPONENT)
// =========================================================================
const ClanPublicProfilePage: NextPage = () => {
    const params = useParams();
    const encodedTag = params.clanTag as string; // Get tag from URL
    const [clan, setClan] = useState<PublicClanIndex | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // --- Client-side Data Fetching ---
    useEffect(() => {
        const fetchClanData = async () => {
            if (!encodedTag) return;

            setLoading(true);
            setError(null);
            setClan(null); // Reset clan state before fetching
            console.log(`[ClanPublicProfilePage Client] Fetching data for encoded tag: ${encodedTag}`);

            // Construct the internal API URL correctly
            // Assumes NEXT_PUBLIC_BASE_URL is set in your environment variables for deployment
            // Defaults to localhost:3000 for local development
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin; // Use window.location.origin as a fallback
            const internalApiUrl = `${baseUrl}/api/coc/search-clan?clanTag=${encodedTag}`;
            console.log(`[ClanPublicProfilePage Client] Calling API route: ${internalApiUrl}`);

            try {
                const response = await fetch(internalApiUrl);
                console.log(`[ClanPublicProfilePage Client] API route response status: ${response.status}`);

                if (response.status === 404) {
                    console.log(`[ClanPublicProfilePage Client] Clan not found (404) for tag: ${encodedTag}`);
                    setError("Klan tidak ditemukan.");
                    return; // Stop execution after setting error
                }

                 // Check for other non-OK statuses first
                 if (!response.ok) {
                    let errorMessage = `Gagal memuat data klan (Status: ${response.status})`;
                    try {
                        // Try to parse error message from API if available
                        const errorBody = await response.json();
                        errorMessage = errorBody.error || errorBody.message || errorMessage;
                    } catch (parseError) {
                        // If parsing fails, use the default message
                        console.error("[ClanPublicProfilePage Client] Failed to parse error response:", parseError);
                    }
                    console.error(`[ClanPublicProfilePage Client] Failed fetch. Status: ${response.status}, Message: ${errorMessage}`);
                    throw new Error(errorMessage);
                }


                // If response is OK, parse the JSON
                const result = await response.json();
                console.log(`[ClanPublicProfilePage Client] Successfully fetched data for tag: ${encodedTag}`);
                if (result.clan) {
                    setClan(result.clan);
                } else {
                    // This case should ideally not happen if API route is consistent
                    console.warn("[ClanPublicProfilePage Client] API response OK but 'clan' data is missing:", result);
                    throw new Error("Format data klan tidak valid dari server.");
                }

            } catch (err) {
                console.error(`[ClanPublicProfilePage Client] Error fetching clan data for tag ${encodedTag}:`, err);
                setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
                // Ensure clan is null on error
                setClan(null);
            } finally {
                setLoading(false);
            }
        };

        fetchClanData();
    }, [encodedTag]); // Re-fetch if tag changes

    // --- Loading State ---
    if (loading) {
        return (
            // PENYESUAIAN UI: Menggunakan wrapper standar, tapi dipusatkan untuk loading
            <main className="max-w-7xl mx-auto p-4 md:p-8 mt-10 flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mx-auto mb-4" />
                    <p className="text-xl font-clash text-gray-400">Memuat data klan...</p>
                </div>
            </main>
        );
    }

    // --- Error State (Includes Not Found Logic Now) ---
     if (error || !clan) { // Show error if error state is set OR if clan is null after loading
         return (
              <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10"> {/* PENYESUAIAN UI: Wrapper standar */}
                   <div className="mb-6">
                        <Button href="/teamhub" variant="secondary" size="md" className="flex items-center">
                             <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                        </Button>
                   </div>
                   <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto rounded-lg">
                       <h1 className="text-3xl text-coc-red font-clash mb-4">
                           {error === "Klan tidak ditemukan." ? "404 - Klan Tidak Ditemukan" : "Error"}
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

    // Safely access memberList, defaulting to empty array if undefined/null
    const memberList: CocMember[] = (clan as any).memberList || [];
    const decodedTag = formatTag(clan.tag);

    return (
        // PENYESUAIAN UI: Menggunakan layout wrapper standar
        <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
             {/* Tombol Kembali */}
              <div className="mb-6">
                   <Button href="/teamhub" variant="secondary" size="md" className="flex items-center">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                   </Button>
              </div>

            {/* Konten utama sekarang di dalam wrapper standar */}
            <>
                {/* Header Klan Publik */}
                <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center rounded-lg">
                    <div className="flex items-center gap-6">
                        {/* Menggunakan Client Component Badge */}
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
                            <p className="text-sm text-gray-400 font-sans mt-1">Level {clan.clanLevel} Klan</p>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
                        <Button variant="primary" size="lg" disabled title="Gabung melalui game Clash of Clans">
                            Gabung Klan (In-Game)
                        </Button>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3 inline" /> Data terakhir di-cache: {lastUpdatedTime}
                        </p>
                    </div>
                </div>

                {/* Ringkasan Statistik */}
                 {/* PENYESUAIAN UI: Menambah clanCapitalPoints */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"> {/* Adjusted grid cols */}
                    <StatCard icon={UserIcon} title="Anggota" value={`${clan.memberCount}/50`} color="text-coc-blue" />
                    <StatCard icon={TrophyIcon} title="Poin Klan" value={clan.clanPoints.toLocaleString()} color="text-coc-gold" />
                    <StatCard icon={StarIcon} title="Poin Ibu Kota" value={clan.clanCapitalPoints?.toLocaleString() || 'N/A'} color="text-yellow-400" /> {/* BARU */}
                    <StatCard icon={ShieldIcon} title="Kemenangan War" value={clan.warWins?.toLocaleString() || 'N/A'} color="text-coc-green" />
                    <StatCard icon={GlobeIcon} title="Tipe Klan" value={clan.type || 'N/A'} color="text-gray-400" />
                </div>

                {/* Deskripsi & Detail */}
                <div className="card-stone p-6 space-y-4 rounded-lg">
                    <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Deskripsi Klan</h2>
                    <p className="text-gray-300 whitespace-pre-line font-sans">{clan.description || 'Tidak ada deskripsi yang tersedia.'}</p>
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                        {/* Data yang sudah ada */}
                        <DetailItem icon={MapPinIcon} label="Lokasi" value={clan.location?.name || 'Global'} />
                        <DetailItem icon={ClockIcon} label="Frekuensi War" value={clan.warFrequency || 'N/A'} />
                        <DetailItem icon={TrophyIcon} label="Trofi Dibutuhkan" value={clan.requiredTrophies?.toLocaleString() || '0'} />
                        <DetailItem icon={ShieldIcon} label="Rekor War Winstreak" value={clan.warWinStreak?.toLocaleString() || '0'} />
                        {/* Bisa tambahkan detail lain di sini jika ada */}
                    </div>
                </div>

                {/* Daftar Anggota (Opsional) */}
                {memberList.length > 0 ? ( // Added check for length > 0
                    <div className="card-stone p-6 space-y-4 rounded-lg">
                        <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Daftar Anggota ({memberList.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                                <thead className="bg-coc-stone/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain (TH)</th>
                                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Role</th>
                                        <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">Trofi</th>
                                        <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">Donasi Diberikan</th>
                                        <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">Donasi Diterima</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-coc-gold-dark/10">
                                    {memberList.map((member) => (
                                        <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                                                {member.name}
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
                             *Daftar anggota mungkin tidak selalu tersedia di profil publik karena batasan API CoC.
                        </p>
                    </div>
                ) : (
                     // Optional: Show a message if memberList is empty or undefined
                     <div className="card-stone p-6 rounded-lg">
                          <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Daftar Anggota</h2>
                          <p className="text-gray-400 text-center py-5">Informasi daftar anggota tidak tersedia untuk klan ini saat ini.</p>
                     </div>
                )}
            </>
        </main>
    );
};

// =========================================================================
// CLIENT COMPONENT FOR CLAN BADGE WITH FALLBACK (Tidak Berubah)
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

    // Reset src if initialSrc changes
    useEffect(() => {
        setCurrentSrc(initialSrc || placeholderSrc);
    }, [initialSrc, placeholderSrc]);

    const handleError = () => {
        // Prevent infinite loop if placeholder also fails (unlikely but safe)
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
            onError={handleError} // Event handler is now in a Client Component
        />
    );
};

// =========================================================================
// HELPER COMPONENTS (Tidak Berubah)
// =========================================================================
const StatCard = ({ icon: Icon, title, value, color }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, title: string, value: string | undefined, color: string }) => ( // Value can be undefined
    <div className="card-stone p-4 flex items-center space-x-3 bg-coc-stone/50 rounded-lg">
        <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
        <div>
            <p className="text-sm text-gray-400 font-sans">{title}</p>
            {/* Handle potentially undefined value */}
            <p className="text-xl font-clash text-white">{value ?? 'N/A'}</p>
        </div>
    </div>
);


const DetailItem = ({ icon: Icon, label, value }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string, value: string | undefined }) => ( // Value can be undefined
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-coc-gold flex-shrink-0" />
        <p>
            <span className="font-bold text-white">{label}:</span> {value ?? 'N/A'} {/* Handle potentially undefined value */}
        </p>
    </div>
);


export default ClanPublicProfilePage; // Export the main component
