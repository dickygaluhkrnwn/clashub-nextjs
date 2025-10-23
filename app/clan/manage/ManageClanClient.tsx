'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { ManagedClan, ClanApiCache, UserProfile } from '@/lib/types';
import { CrownIcon, ShieldCheckIcon, AlertTriangleIcon, CogsIcon, ClockIcon, UsersIcon, SyncIcon, ArrowRightIcon } from '@/app/components/icons';
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

/**
 * @component ManageClanClient
 * Menangani tampilan manajemen klan (Leader/Co-Leader yang terverifikasi).
 * Menyediakan tombol sinkronisasi manual.
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
    const isCacheStale = !cache || (cache.lastSynced.getTime() < Date.now() - 3600000); // Dianggap 'stale' jika > 1 jam
    const syncStatusClass = isCacheStale ? 'text-coc-red' : 'text-coc-green';
    const syncMessage = isCacheStale ? 'Perlu Sinkronisasi' : 'Data Fresh';
    
    const lastSyncTime = cache?.lastSynced 
        ? cache.lastSynced.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : 'Belum Pernah';

    // --- FUNGSI SINKRONISASI MANUAL (Fase 2.2) ---
    const handleSyncManual = async () => {
        setIsSyncing(true);
        showNotification(`Memulai sinkronisasi klan ${clan.name}. Harap tunggu...`, 'info');
        
        try {
            const response = await fetch('/api/coc/sync-managed-clan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: clan.id }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Sinkronisasi gagal. Cek API Key atau status klan.');
            }

            showNotification(`Sinkronisasi berhasil! Data terakhir diambil: ${new Date(result.lastSynced).toLocaleTimeString('id-ID')}`, 'success');
            router.refresh(); // Memaksa Server Component memuat ulang data terbaru

        } catch (err) {
            const errorMessage = (err as Error).message || "Terjadi kesalahan saat memanggil API sinkronisasi.";
            showNotification(errorMessage, 'error');
        } finally {
            setIsSyncing(false);
        }
    };
    // --- END FUNGSI SINKRONISASI MANUAL ---

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <Notification notification={notification ?? undefined} />

            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header Klan */}
                <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center gap-4">
                        <CrownIcon className="h-10 w-10 text-coc-gold flex-shrink-0" />
                        <div>
                            <h1 className="text-3xl font-clash text-white">{clan.name} <span className="text-coc-gold text-2xl font-sans font-bold">({clan.tag})</span></h1>
                            <p className="text-sm text-gray-400 font-sans">Level Klan: {cache?.cocClanData?.clanLevel || 'N/A'}</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Kolom Kiri: Aksi & Info */}
                    <aside className="lg:col-span-1 space-y-8">
                        {/* Panel Sinkronisasi */}
                        <div className="card-stone p-6 space-y-4">
                            <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                                <SyncIcon className="h-5 w-5" /> Kontrol Sinkronisasi
                            </h3>
                            <p className="text-sm text-gray-300 font-sans">
                                Sinkronisasi akan menarik data Anggota dan Log War terbaru dari API Clash of Clans ke cache privat klan Anda.
                            </p>
                            <Button 
                                onClick={handleSyncManual} 
                                variant={isCacheStale ? 'primary' : 'secondary'}
                                disabled={isSyncing}
                                className={`w-full ${isSyncing ? 'animate-pulse' : ''}`}
                            >
                                <SyncIcon className={`inline h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronisasi Manual Sekarang'}
                            </Button>
                        </div>

                        {/* Panel Data Internal */}
                        <div className="card-stone p-6 space-y-3">
                            <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                                <InfoIcon className="h-5 w-5" /> Data Internal
                            </h3>
                            <p className="text-sm text-gray-300"><span className="font-bold">UID Owner:</span> {clan.ownerUid}</p>
                            <p className="text-sm text-gray-300"><span className="font-bold">Status Rekrutmen:</span> <span className="text-coc-green">{clan.recruitingStatus}</span></p>
                            <Button href={`/team/${clan.id}`} variant="tertiary" className="w-full mt-4">
                                Lihat Profil Tim <ArrowRightIcon className="inline h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </aside>
                    
                    {/* Kolom Kanan: Detail Anggota Cache */}
                    <section className="lg:col-span-2 card-stone p-6 space-y-6">
                        <h2 className="font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                            <UsersIcon className="h-6 w-6 text-coc-gold" /> Anggota Klan (Cache Privat)
                        </h2>

                        {!cache?.currentMembers || cache.currentMembers.length === 0 ? (
                            <div className="p-4 text-center bg-coc-red/10 border border-coc-red/30 rounded-md">
                                <p className="text-gray-300">Belum ada data anggota di cache. Silakan lakukan **Sinkronisasi Manual**.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-coc-gold-dark/20">
                                    <thead className="bg-coc-stone/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-clash text-coc-gold uppercase tracking-wider">Nama</th>
                                            <th className="px-3 py-2 text-left text-xs font-clash text-coc-gold uppercase tracking-wider">TH</th>
                                            <th className="px-3 py-2 text-left text-xs font-clash text-coc-gold uppercase tracking-wider">Role</th>
                                            <th className="px-3 py-2 text-left text-xs font-clash text-coc-gold uppercase tracking-wider">Trofi</th>
                                            <th className="px-3 py-2 text-left text-xs font-clash text-coc-gold uppercase tracking-wider">Donasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-coc-gold-dark/10">
                                        {cache.currentMembers.map((member) => (
                                            <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                                <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">{member.name}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">{member.townHallLevel}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-xs uppercase font-medium text-coc-green">{member.role}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">{member.trophies?.toLocaleString() || 'N/A'}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">{member.donations.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {/* Catatan */}
                        <div className="mt-4 pt-4 border-t border-coc-gold-dark/20">
                            <p className="text-xs text-gray-500 font-sans">
                                Catatan: Data di atas adalah **cache privat** klan Anda, disinkronkan dari API CoC oleh Clashub. Data ini digunakan untuk kalkulasi Partisipasi.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default ManageClanClient;
