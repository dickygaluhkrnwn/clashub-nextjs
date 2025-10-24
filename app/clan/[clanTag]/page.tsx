'use client'; // Marking the whole file as client component is simpler for now to fix the immediate issue.
// Ideally, the image part should be its own client component if the rest needs to be server.

import { useState, useEffect } from 'react'; // Need useState, useEffect for client component
import { NextPage, Metadata } from 'next';
import { notFound, useParams } from 'next/navigation'; // Need useParams on client
import { PublicClanIndex, CocMember } from '@/lib/types';
import { GlobeIcon, ShieldIcon, UserIcon, TrophyIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, RefreshCwIcon } from '@/app/components/icons'; // Added RefreshCwIcon
import { Button } from '@/app/components/ui/Button';
import Image from 'next/image'; // Import Image component
import Link from 'next/link'; // Need Link on client

// Utility untuk memformat Tag (Tidak berubah)
const formatTag = (tag: string) => tag.replace('%23', '#');

// We need to fetch data on the client side now or pass it down if part remains server
// For simplicity now, let's fetch on client side.
// Metadata generation needs separate handling (e.g., generateMetadata function needs refactoring or removal if purely client-side)

// interface ClanPageProps {
//     params: { clanTag: string }; // params are accessed via hook now
// }

// =========================================================================
// SERVER DATA FETCHING -> MOVED TO CLIENT SIDE FETCHING
// =========================================================================

// Removed generateMetadata as it's complex with client-side fetching setup for this fix.

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
            console.log(`[ClanPublicProfilePage Client] Fetching data for encoded tag: ${encodedTag}`);

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const internalApiUrl = `${baseUrl}/api/coc/search-clan?clanTag=${encodedTag}`;
            console.log(`[ClanPublicProfilePage Client] Calling API route: ${internalApiUrl}`);

            try {
                const response = await fetch(internalApiUrl);
                console.log(`[ClanPublicProfilePage Client] API route response status: ${response.status}`);

                if (response.status === 404) {
                    console.log(`[ClanPublicProfilePage Client] Clan not found (404) for tag: ${encodedTag}`);
                    setError("Klan tidak ditemukan.");
                    setClan(null); // Explicitly set clan to null on 404
                    // In a real app, you might redirect or show a proper not found UI here
                    // For now, setting error state is enough to stop rendering clan data
                    return; // Stop execution after setting error
                }

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`[ClanPublicProfilePage Client] Failed fetch. Status: ${response.status}, Body: ${errorBody}`);
                    throw new Error(`Gagal memuat data klan (Status: ${response.status})`);
                }

                const result = await response.json();
                console.log(`[ClanPublicProfilePage Client] Successfully fetched data for tag: ${encodedTag}`);
                if (result.clan) {
                    setClan(result.clan);
                } else {
                    throw new Error("Format data klan tidak valid dari server.");
                }

            } catch (err) {
                console.error(`[ClanPublicProfilePage Client] Error fetching clan data for tag ${encodedTag}:`, err);
                setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
                setClan(null); // Ensure clan is null on error
            } finally {
                setLoading(false);
            }
        };

        fetchClanData();
    }, [encodedTag]); // Re-fetch if tag changes

    // --- Loading State ---
    if (loading) {
        return (
            <main className="container mx-auto p-4 md:p-8 mt-10 flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mx-auto mb-4" />
                    <p className="text-xl font-clash text-gray-400">Memuat data klan...</p>
                </div>
            </main>
        );
    }

    // --- Error State ---
     if (error) {
         return (
             <main className="container mx-auto p-4 md:p-8 mt-10">
                 <div className="mb-6">
                     <Button href="/teamhub" variant="secondary" size="md" className="flex items-center">
                         <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                     </Button>
                 </div>
                 <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto rounded-lg">
                     <h1 className="text-3xl text-coc-red font-clash mb-4">Error</h1>
                     <p className="text-xl text-gray-300">{error}</p>
                 </div>
             </main>
         );
     }

    // --- Not Found State (handled by error state for now) ---
    if (!clan) {
         // This case should ideally be handled by the error state after 404,
         // but as a fallback, show not found.
         return (
              <main className="container mx-auto p-4 md:p-8 mt-10">
                  <div className="mb-6">
                      <Button href="/teamhub" variant="secondary" size="md" className="flex items-center">
                          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                      </Button>
                  </div>
                  <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto rounded-lg">
                      <h1 className="text-3xl text-coc-red font-clash mb-4">404 - Klan Tidak Ditemukan</h1>
                      <p className="text-xl text-gray-300">Klan dengan tag ini tidak dapat ditemukan.</p>
                  </div>
              </main>
          );
    }

    // --- Render Clan Data ---
    const lastUpdatedTime = clan.lastUpdated
        ? new Date(clan.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : 'N/A';

    const memberList: CocMember[] = (clan as any).memberList || [];
    const decodedTag = formatTag(clan.tag);

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Tombol Kembali */}
             <div className="mb-6">
                 <Button href="/teamhub" variant="secondary" size="md" className="flex items-center">
                     <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                 </Button>
             </div>

            <div className="max-w-7xl mx-auto space-y-8">

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={UserIcon} title="Anggota" value={`${clan.memberCount}/50`} color="text-coc-blue" />
                    <StatCard icon={TrophyIcon} title="Poin Klan" value={clan.clanPoints.toLocaleString()} color="text-coc-gold" />
                    <StatCard icon={ShieldIcon} title="Kemenangan War" value={clan.warWins?.toLocaleString() || 'N/A'} color="text-coc-green" />
                    <StatCard icon={GlobeIcon} title="Tipe Klan" value={clan.type || 'N/A'} color="text-gray-400" />
                </div>

                {/* Deskripsi & Detail */}
                <div className="card-stone p-6 space-y-4 rounded-lg">
                    <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Deskripsi Klan</h2>
                    <p className="text-gray-300 whitespace-pre-line font-sans">{clan.description || 'Tidak ada deskripsi yang tersedia.'}</p>
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                        <DetailItem icon={MapPinIcon} label="Lokasi" value={clan.location?.name || 'Global'} />
                        <DetailItem icon={ClockIcon} label="Frekuensi War" value={clan.warFrequency || 'N/A'} />
                        <DetailItem icon={TrophyIcon} label="Trofi Dibutuhkan" value={clan.requiredTrophies?.toLocaleString() || '0'} />
                        <DetailItem icon={ShieldIcon} label="Rekor War Winstreak" value={clan.warWinStreak?.toLocaleString() || '0'} />
                    </div>
                </div>

                {/* Daftar Anggota (Opsional) */}
                {memberList.length > 0 && (
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
                             *Daftar anggota mungkin tidak selalu tersedia di profil publik karena batasan API.
                        </p>
                     </div>
                )}
            </div>
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
// HELPER COMPONENTS (Unchanged)
// =========================================================================
const StatCard = ({ icon: Icon, title, value, color }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, title: string, value: string, color: string }) => (
    <div className="card-stone p-4 flex items-center space-x-3 bg-coc-stone/50 rounded-lg">
        <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
        <div>
            <p className="text-sm text-gray-400 font-sans">{title}</p>
            <p className="text-xl font-clash text-white">{value}</p>
        </div>
    </div>
);

const DetailItem = ({ icon: Icon, label, value }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string, value: string }) => (
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-coc-gold flex-shrink-0" />
        <p>
            <span className="font-bold text-white">{label}:</span> {value}
        </p>
    </div>
);

export default ClanPublicProfilePage; // Export the main component

