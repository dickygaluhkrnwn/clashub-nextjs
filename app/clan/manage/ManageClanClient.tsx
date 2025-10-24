'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { ManagedClan, ClanApiCache, UserProfile } from '@/lib/types';
import { UserCircleIcon, ShieldIcon, AlertTriangleIcon, CogsIcon, ClockIcon, InfoIcon, TrophyIcon, UserIcon, XIcon, GlobeIcon } from '@/app/components/icons'; 
import Notification, { NotificationProps } from '@/app/components/ui/Notification';

interface ClanManagementData {
    clan: ManagedClan;
    cache: ClanApiCache | null;
}

interface ManageClanClientProps {
    initialData: ClanManagementData | null;
    serverError: string | null;
    profile: UserProfile | null;
}

// Helper untuk menampilkan status partisipasi dengan warna
const getParticipationStatusClass = (status: ClanApiCache['members'][number]['participationStatus']) => {
    switch (status) {
        case 'Promosi':
            return 'text-coc-gold bg-coc-gold/20 font-bold';
        case 'Demosi':
            return 'text-coc-red bg-coc-red/20 font-bold';
        case 'Leader/Co-Leader':
            return 'text-coc-blue bg-coc-blue/20';
        case 'Aman':
        default:
            return 'text-coc-green bg-coc-green/20';
    }
}

/**
 * @component ManageClanClient
 * Menangani tampilan manajemen klan (Leader/Co-Leader yang terverifikasi).
 * Menyediakan tombol sinkronisasi manual dan tabel Partisipasi.
 */
const ManageClanClient = ({ initialData, serverError, profile }: ManageClanClientProps) => {
    const router = useRouter();
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    // --- TAMPILAN ERROR / AKSES DITOLAK ---
    if (serverError) {
        return (
            <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
                <Notification notification={notification ?? undefined} />
                <div className="flex justify-center items-center">
                    <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
                        <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4"/>
                        <h2 className="text-2xl text-coc-red font-clash mb-4">Akses Ditolak</h2>
                        <p className="text-gray-300 mb-6 font-sans">
                            {serverError}
                        </p>
                        <Button href="/profile" variant="primary">
                            Kembali ke Profil
                        </Button>
                    </div>
                </div>
            </main>
        );
    }
    
    // Asumsi: Jika tidak ada serverError, initialData dijamin ada oleh Server Component
    const clan = initialData!.clan; 
    const cache = initialData!.cache;
    // Memastikan cache.lastUpdated adalah Date
    const lastSyncedDate = cache?.lastUpdated instanceof Date ? cache.lastUpdated : new Date(0); 

    // Dianggap 'stale' jika > 1 jam (3600000 ms)
    const isCacheStale = !cache || (lastSyncedDate.getTime() < Date.now() - 3600000); 
    const syncStatusClass = isCacheStale ? 'text-coc-red' : 'text-coc-green';
    const syncMessage = isCacheStale ? 'Perlu Sinkronisasi' : 'Data Fresh';
    
    const lastSyncTime = cache?.lastUpdated 
        ? new Date(cache.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : 'Belum Pernah';

    // --- FUNGSI SINKRONISASI MANUAL ---
    const handleSyncManual = async () => {
        setIsSyncing(true);
        showNotification(`Memulai sinkronisasi klan ${clan.name}. Harap tunggu...`, 'info');
        
        try {
            // PERBAIKAN #1: Menggunakan GET request sesuai API Route
            const response = await fetch(`/api/coc/sync-managed-clan?clanId=${clan.id}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    // PERBAIKAN #2: Mengirimkan UID untuk otorisasi manual
                    'X-Request-UID': profile!.uid, 
                },
            });

            const result = await response.json();

            if (!response.ok) {
                // Gunakan result.error dari API Route jika tersedia
                throw new Error(result.error || 'Sinkronisasi gagal. Cek API Key atau status klan.'); 
            }

            // Setelah sukses, kita refresh router untuk memuat data terbaru dari Server Component
            showNotification(`Sinkronisasi berhasil! Anggota disinkronkan: ${result.memberCount}`, 'success');
            router.refresh(); 

        } catch (err) {
            const errorMessage = (err as Error).message || "Terjadi kesalahan saat memanggil API sinkronisasi.";
            showNotification(errorMessage, 'error');
        } finally {
            setIsSyncing(false);
        }
    };
    // --- END FUNGSI SINKRONISASI MANUAL ---

    const memberCount = clan.memberCount || 0;
    const avgThLevel = clan.avgTh || 'N/A';

    // Mendefinisikan ArrowRightIcon lokal sebagai fallback jika import gagal
    const ArrowRightIconLocal = (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <Notification notification={notification ?? undefined} />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Klan */}
                <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center gap-4">
                        <UserCircleIcon className="h-10 w-10 text-coc-gold flex-shrink-0" />
                        <div>
                            <h1 className="text-3xl font-clash text-white">{clan.name} <span className="text-coc-gold text-2xl font-sans font-bold">({clan.tag})</span></h1>
                            <p className="text-sm text-gray-400 font-sans">Level Klan: {clan.clanLevel || 'N/A'} | Rata-rata TH: {avgThLevel}</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col items-end">
                        <div className={`flex items-center gap-2 font-bold text-sm ${syncStatusClass}`}>
                            <ClockIcon className="h-4 w-4" />
                            {syncMessage}
                        </div>
                        <p className="text-xs text-gray-500">Terakhir disinkronisasi: {lastSyncTime}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    
                    {/* Kolom Kiri: Aksi & Info */}
                    <aside className="lg:col-span-1 space-y-8">
                        {/* Panel Sinkronisasi */}
                        <div className="card-stone p-6 space-y-4">
                            <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                                <ClockIcon className="h-5 w-5" /> Kontrol Sinkronisasi
                            </h3>
                            <p className="text-sm text-gray-300 font-sans">
                                Sinkronisasi menarik data Anggota dan Log War terbaru. Gunakan ini untuk memperbarui Partisipasi War.
                            </p>
                            <Button 
                                onClick={handleSyncManual} 
                                variant={isCacheStale ? 'primary' : 'secondary'}
                                disabled={isSyncing}
                                className={`w-full ${isSyncing ? 'animate-pulse' : ''}`}
                            >
                                <ClockIcon className={`inline h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronisasi Manual Sekarang'}
                            </Button>
                        </div>

                        {/* Panel Data Internal */}
                        <div className="card-stone p-6 space-y-3">
                            <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                                <InfoIcon className="h-5 w-5" /> Data Internal
                            </h3>
                            <p className="text-sm text-gray-300"><span className="font-bold">ID Internal:</span> {clan.id}</p>
                            <p className="text-sm text-gray-300"><span className="font-bold">UID Owner:</span> {clan.ownerUid}</p>
                            <p className="text-sm text-gray-300"><span className="font-bold">Status Rekrutmen:</span> <span className="text-coc-green">{clan.recruitingStatus}</span></p>
                            <p className="text-sm text-gray-300"><span className="font-bold">Anggota Aktif:</span> {memberCount}</p>
                            <Button 
                                href={`/team/${clan.id}`} 
                                variant="link" 
                                className="w-full mt-4 text-coc-gold hover:text-white justify-center"
                            >
                                Lihat Profil Tim <ArrowRightIconLocal className="inline h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </aside>
                    
                    {/* Kolom Kanan: Tabel Partisipasi & Anggota Cache */}
                    <section className="lg:col-span-3 card-stone p-6 space-y-6">
                        <h2 className="font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                            <ShieldIcon className="h-6 w-6 text-coc-gold" /> Metrik Partisipasi War
                        </h2>

                        {!cache?.members || cache.members.length === 0 ? (
                            <div className="p-4 text-center bg-coc-red/10 border border-coc-red/30 rounded-md">
                                <p className="text-gray-300">Belum ada data anggota di cache. Silakan lakukan **Sinkronisasi Manual**.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                                    <thead className="bg-coc-stone/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain (Tag)</th>
                                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">TH</th>
                                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Sukses War</th>
                                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Gagal War</th>
                                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Status Partisipasi</th>
                                            <th className="px-3 py-2 text-right font-clash text-coc-gold uppercase tracking-wider">Trofi/Donasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-coc-gold-dark/10">
                                        {cache.members.map((member) => (
                                            <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                                <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                                                    {member.name} 
                                                    <span className="text-gray-500 block text-xs font-mono">{member.tag}</span>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-300">{member.townHallLevel}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-green">{member.warSuccessCount}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-red">{member.warFailCount}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-sans ${getParticipationStatusClass(member.participationStatus)}`}>
                                                        {member.participationStatus}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-300">
                                                    {member.trophies?.toLocaleString() || 0} 🏆
                                                    <span className="text-gray-500 block text-xs">Dns: {member.donations.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {/* Catatan */}
                        <div className="mt-4 pt-4 border-t border-coc-gold-dark/20">
                            <p className="text-xs text-gray-500 font-sans">
                                Catatan: Data Partisipasi dihitung ulang berdasarkan log War/CWL klan dan status peran (`Aggregators.js` blueprint). Partisipasi War Classic disetel ulang setelah **perubahan Role** (saat logic di Fase 6 diimplementasikan).
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default ManageClanClient;
