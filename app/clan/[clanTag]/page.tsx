import { NextPage, Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicClanIndex, CocMember } from '@/lib/types';
import { GlobeIcon, ShieldIcon, UserIcon, TrophyIcon, MapPinIcon, ClockIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// Utility untuk memformat Tag
const formatTag = (tag: string) => tag.replace('%23', '#');

interface ClanPageProps {
    params: { clanTag: string };
}

// =========================================================================
// SERVER DATA FETCHING (Menggunakan API Route Pencarian Klan Publik)
// =========================================================================

/**
 * @function fetchPublicClanData
 * Memuat data klan publik (cache atau live) menggunakan API Route kita sendiri.
 * @param clanTag Tag klan yang di-encode dari URL.
 * @returns Data klan atau null.
 */
async function fetchPublicClanData(clanTag: string): Promise<PublicClanIndex | null> {
    const internalApiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/coc/search-clan?clanTag=${clanTag}`;
    
    // Karena ini Server Component, kita bisa memanggil API Route internal langsung
    try {
        const response = await fetch(internalApiUrl, {
            // Revalidate internal: agar data dijamin fresh
            next: { revalidate: 300 } // 5 menit revalidate
        });

        if (response.status === 404) {
            return null; 
        }

        if (!response.ok) {
            console.error(`Failed to fetch public clan data: ${response.status}`);
            return null;
        }

        const result = await response.json();
        return result.clan as PublicClanIndex;

    } catch (error) {
        console.error('Error fetching clan data in Server Component:', error);
        return null;
    }
}

// =========================================================================
// METADATA DINAMIS
// =========================================================================

export async function generateMetadata({ params }: ClanPageProps): Promise<Metadata> {
    const decodedTag = formatTag(params.clanTag);
    const clan = await fetchPublicClanData(params.clanTag);

    if (!clan) {
        return {
            title: `Klan Tidak Ditemukan | ${decodedTag}`,
        };
    }

    return {
        title: `${clan.name} | Level ${clan.clanLevel} | Clashub`,
        description: `Lihat profil publik klan ${clan.name} (${decodedTag}). Level klan: ${clan.clanLevel}, Anggota: ${clan.memberCount}.`,
    };
}


// =========================================================================
// MAIN COMPONENT
// =========================================================================

/**
 * @component ClanPublicProfilePage (Server Component)
 * Menampilkan profil klan publik dari data CocClan mentah/cache.
 */
const ClanPublicProfilePage: NextPage<ClanPageProps> = async ({ params }) => {
    const clanTag = params.clanTag;
    const clan = await fetchPublicClanData(clanTag);
    
    if (!clan) {
        notFound();
    }

    // Data dari PublicClanIndex
    const lastUpdatedTime = clan.lastUpdated 
        ? new Date(clan.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : 'N/A';
    
    // Ambil daftar anggota (hanya jika tersedia di PublicClanIndex, umumnya tidak ada)
    // Untuk tujuan tampilan, kita bisa asumsikan membersList kosong karena PublicClanIndex hanya menyimpan metadata klan.
    const memberList: CocMember[] = (clan as any).memberList || []; // Coba ambil jika API mengembalikannya
    
    const decodedTag = formatTag(clan.tag);

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Klan Publik */}
                <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center gap-6">
                        {/* Badge Klan */}
                        <img 
                            src={clan.badgeUrls.large || '/images/clan-badge-placeholder.png'} 
                            alt={`${clan.name} Badge`} 
                            className="w-20 h-20 rounded-full border-4 border-coc-gold flex-shrink-0"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/images/clan-badge-placeholder.png';
                            }}
                        />
                        <div>
                            <h1 className="text-4xl font-clash text-white">{clan.name}</h1>
                            <p className="text-xl text-coc-gold font-sans font-bold">{decodedTag}</p>
                            <p className="text-sm text-gray-400 font-sans mt-1">Level {clan.clanLevel} Klan</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
                        <Button variant="primary" size="lg" disabled>
                            Gabung Klan (In-Game)
                        </Button>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3 inline" /> Data terakhir di-cache: {lastUpdatedTime}
                        </p>
                    </div>
                </div>

                {/* Ringkasan Statistik */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Member Count */}
                    <StatCard icon={UserIcon} title="Anggota" value={`${clan.memberCount}/50`} color="text-coc-blue" />
                    {/* Clan Points */}
                    <StatCard icon={TrophyIcon} title="Poin Klan" value={clan.clanPoints.toLocaleString()} color="text-coc-gold" />
                    {/* War Wins */}
                    <StatCard icon={ShieldIcon} title="Kemenangan War" value={clan.warWins?.toLocaleString() || 'N/A'} color="text-coc-green" />
                    {/* Type */}
                    <StatCard icon={GlobeIcon} title="Tipe Klan" value={clan.type || 'N/A'} color="text-coc-stone" />
                </div>

                {/* Deskripsi & Detail */}
                <div className="card-stone p-6 space-y-4">
                    <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Deskripsi Klan</h2>
                    <p className="text-gray-300 whitespace-pre-line font-sans">{clan.description || 'Tidak ada deskripsi yang tersedia.'}</p>
                    
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                        <DetailItem icon={MapPinIcon} label="Lokasi" value={clan.location?.name || 'Global'} />
                        <DetailItem icon={ClockIcon} label="Frekuensi War" value={clan.warFrequency || 'N/A'} />
                        <DetailItem icon={TrophyIcon} label="Trofi Dibutuhkan" value={clan.requiredTrophies?.toLocaleString() || '0'} />
                        <DetailItem icon={ShieldIcon} label="Rekor War Winstreak" value={clan.warWinStreak?.toLocaleString() || '0'} />
                    </div>
                </div>

                {/* Daftar Anggota (Opsional, jika API mengembalikan) */}
                {memberList.length > 0 && (
                     <div className="card-stone p-6 space-y-4">
                        <h2 className="text-2xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Daftar Anggota ({memberList.length})</h2>
                        <p className="text-gray-400">Daftar anggota klan yang diambil langsung dari API Clash of Clans.</p>
                        {/* TODO: Tambahkan tabel anggota sederhana di sini */}
                     </div>
                )}
            </div>
        </main>
    );
};

export default ClanPublicProfilePage;

// =========================================================================
// HELPER COMPONENTS
// =========================================================================

// Component untuk kartu statistik
const StatCard = ({ icon: Icon, title, value, color }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, title: string, value: string, color: string }) => (
    <div className="card-stone p-4 flex items-center space-x-3 bg-coc-stone/50">
        <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
        <div>
            <p className="text-sm text-gray-400 font-sans">{title}</p>
            <p className="text-xl font-clash text-white">{value}</p>
        </div>
    </div>
);

// Component untuk item detail
const DetailItem = ({ icon: Icon, label, value }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string, value: string }) => (
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-coc-gold flex-shrink-0" />
        <p>
            <span className="font-bold text-white">{label}:</span> {value}
        </p>
    </div>
);
