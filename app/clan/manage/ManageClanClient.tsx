// File: app/clan/manage/ManageClanClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// FIX 1: Import ClanRole dari lib/types
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, ClanRole, CocWarLog } from '@/lib/types';
import { 
    UserCircleIcon, ShieldIcon, AlertTriangleIcon, CogsIcon, ClockIcon, InfoIcon, 
    TrophyIcon, UserIcon, XIcon, GlobeIcon, 
    // FIX 2: Import ikon yang hilang dari icons.tsx.
    RefreshCwIcon, ArrowRightIcon, MailOpenIcon, ThumbsUpIcon, ThumbsDownIcon, 
    TrashIcon, SettingsIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon 
} from '@/app/components/icons'; 
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { ClanManagementProps } from '@/app/clan/manage/page'; 

// Hapus interface lama ClanManagementData

interface ManageClanClientProps {
    initialData: ClanManagementProps | null; // Data lengkap dari Server Component
    serverError: string | null;
    profile: UserProfile | null;
}

type ActiveTab = 'summary' | 'members' | 'requests' | 'settings';

// --- HELPER COMPONENT: Roster/Member Management (Tab Anggota) ---

interface MemberRosterTabProps {
    clan: ManagedClan;
    cache: ClanApiCache | null;
    members: UserProfile[];
    userProfile: UserProfile; // Profil Leader/Co-Leader yang sedang login
    onAction: (message: string, type: NotificationProps['type']) => void;
    onRefresh: () => void;
}

const MemberRosterTab: React.FC<MemberRosterTabProps> = ({ 
    clan, cache, members, userProfile, onAction, onRefresh 
}) => {
    const isLeader = userProfile.role === 'Leader';
    const rosterMembers = cache?.members || [];
    
    // FIX 3: Menangani openRoleDropdown dengan useState yang benar
    const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

    const getParticipationStatusClass = (status: ClanApiCache['members'][number]['participationStatus']) => {
        switch (status) {
            case 'Promosi': return 'text-coc-gold bg-coc-gold/20 font-bold';
            case 'Demosi': return 'text-coc-red bg-coc-red/20 font-bold';
            case 'Leader/Co-Leader': return 'text-coc-blue bg-coc-blue/20';
            case 'Aman':
            default: return 'text-coc-green bg-coc-green/20';
        }
    };
    
    // Map CoC role string ke ClanRole enum untuk mendapatkan old/new CoC role
    const mapClashubRoleToCocRole = (clashubRole: UserProfile['role']): ClanRole => {
        switch (clashubRole) {
            // FIX 4: Menggunakan ClanRole enum
            case 'Leader': return ClanRole.LEADER;
            case 'Co-Leader': return ClanRole.CO_LEADER;
            case 'Elder': return ClanRole.ELDER;
            case 'Member': 
            case 'Free Agent': // Jika kick/member baru, CoC role adalah member (default)
            default: return ClanRole.MEMBER;
        }
    };
    
    // Fungsi untuk memanggil API PUT Role
    const handleRoleChange = async (memberUid: string, newClashubRole: UserProfile['role']) => {
        // Cari profil target dan metrik cache untuk mendapatkan Tag dan Role CoC
        const targetProfile = members.find(m => m.uid === memberUid);
        const targetCacheMember = rosterMembers.find(m => m.tag === targetProfile?.playerTag);

        if (!targetProfile || !targetCacheMember) {
            onAction('Gagal: Profil atau data cache anggota tidak ditemukan.', 'error');
            return;
        }

        const oldRoleCoC = mapClashubRoleToCocRole(targetProfile.role);
        const newRoleCoC = mapClashubRoleToCocRole(newClashubRole);

        setOpenRoleDropdown(null); // Tutup dropdown
        onAction(`Mengubah peran ${targetProfile.displayName} ke ${newClashubRole}...`, 'info');

        try {
            const response = await fetch(`/api/clan/manage/member/${memberUid}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    newClashubRole, 
                    clanId: clan.id,
                    oldRoleCoC,
                    newRoleCoC
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mengubah peran.');

            onAction(result.message, 'success');
            onRefresh(); // Refresh data server untuk update UI
        } catch (err) {
            onAction((err as Error).message, 'error');
        }
    };

    // Fungsi untuk memanggil API DELETE (Kick)
    const handleKick = async (memberUid: string) => {
        const targetProfile = members.find(m => m.uid === memberUid);
        if (!targetProfile) return;

        // FIX: Mengganti window.confirm dengan confirm() (sesuai instruksi core)
        if (!confirm(`Yakin ingin mengeluarkan ${targetProfile.displayName} (${targetProfile.playerTag}) dari klan Clashub?`)) {
            return;
        }

        onAction(`Mengeluarkan ${targetProfile.displayName}...`, 'info');

        try {
            const response = await fetch(`/api/clan/manage/member/${memberUid}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clanId: clan.id }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mengeluarkan anggota.');

            onAction(result.message, 'success');
            onRefresh(); // Refresh data server
        } catch (err) {
            onAction((err as Error).message, 'error');
        }
    };

    // List of roles that the current user CAN set for others
    const availableClashubRoles: UserProfile['role'][] = isLeader 
        ? ['Leader', 'Co-Leader', 'Elder', 'Member']
        : ['Elder', 'Member'];

    if (!cache?.members || cache.members.length === 0) {
        return (
            <div className="p-4 text-center bg-coc-red/10 border border-coc-red/30 rounded-md">
                <p className="text-gray-300">Belum ada data anggota di cache. Silakan lakukan **Sinkronisasi Manual** di Ringkasan.</p>
            </div>
        );
    }
    
    // Gabungkan data cache (partisipasi) dengan data profil (UID, role Clashub)
    const combinedRoster = rosterMembers.map(cacheMember => {
        const profileData = members.find(p => p.playerTag === cacheMember.tag);
        return {
            ...cacheMember,
            uid: profileData?.uid, // UID untuk aksi manajemen
            clashubRole: profileData?.role || 'Free Agent', // Role Clashub internal
            isVerified: profileData?.isVerified || false,
            // Status Keterangan ditambahkan di agregator baru
            statusKeterangan: (cacheMember as any).statusKeterangan || 'N/A', 
        };
    });

    return (
        <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                <thead className="bg-coc-stone/50 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain (TH/Role CoC)</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Status Partisipasi</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Rincian Partisipasi</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Trophies</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Role Clashub</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-coc-gold-dark/10">
                    {combinedRoster.map((member) => {
                        // Tidak bisa mengubah Leader dan diri sendiri (kecuali Leader untuk transfer, yang tidak diimplementasikan di sini)
                        const canModify = member.clashubRole !== 'Leader' && member.uid !== userProfile.uid;
                        // Co-Leader tidak bisa mengubah Co-Leader lain
                        const isCoLeaderModifyingCoLeader = userProfile.role === 'Co-Leader' && member.clashubRole === 'Co-Leader';
                        const isActionDisabled = !canModify || isCoLeaderModifyingCoLeader;

                        return (
                            <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                {/* Kolom 1: Pemain */}
                                <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                                    <span className={member.isVerified ? 'text-coc-green' : 'text-coc-red'} title={member.isVerified ? "Akun Clashub Terverifikasi" : "Akun Clashub Belum Terverifikasi"}>
                                        <ShieldIcon className="h-4 w-4 inline mr-1" />
                                    </span>
                                    {member.name} 
                                    <span className="text-gray-500 block text-xs font-mono">{member.tag}</span>
                                    <span className="text-gray-500 block text-xs font-sans capitalize">{member.role} CoC | TH {member.townHallLevel}</span>
                                </td>
                                
                                {/* Kolom 2: Status Partisipasi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-sans ${getParticipationStatusClass(member.participationStatus)}`}>
                                        {member.participationStatus}
                                    </span>
                                </td>
                                
                                {/* Kolom 3: Rincian Partisipasi */}
                                <td className="px-3 py-3 text-center text-gray-300 text-xs max-w-[150px] leading-relaxed">
                                    <p title={member.statusKeterangan || 'N/A'}>{member.statusKeterangan}</p>
                                    <p className="text-gray-500 text-[10px] mt-1">W-S: {member.warSuccessCount} | W-F: {member.warFailCount} | C-S: {member.cwlSuccessCount} | C-F: {member.cwlFailCount}</p>
                                </td>
                                
                                {/* Kolom 4: Trofi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-300">
                                    {member.trophies?.toLocaleString() || 0} 🏆
                                </td>
                                
                                {/* Kolom 5: Role Clashub Internal */}
                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-semibold text-coc-blue">
                                    {member.clashubRole}
                                </td>
                                
                                {/* Kolom 6: Aksi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center space-y-1">
                                    {member.uid && (
                                        <div className="relative inline-block text-left">
                                            <Button 
                                                type="button" 
                                                // FIX 3: Ganti size="sm"
                                                size="sm" 
                                                variant="secondary"
                                                // FIX 1: setOpenRoleDropdown dapat menerima string atau null
                                                onClick={() => setOpenRoleDropdown(openRoleDropdown === member.uid ? null : member.uid)}
                                                disabled={isActionDisabled}
                                                className="w-28 justify-center"
                                            >
                                                {member.clashubRole} 
                                                {openRoleDropdown === member.uid ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>}
                                            </Button>
                                            
                                            {/* Dropdown Role */}
                                            {openRoleDropdown === member.uid && (
                                                <div className="absolute right-0 z-10 w-32 mt-1 origin-top-right rounded-md bg-coc-stone/90 shadow-lg ring-1 ring-coc-gold-dark/50 focus:outline-none">
                                                    <div className="py-1">
                                                        {availableClashubRoles.map(role => (
                                                            <a 
                                                                key={role}
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleRoleChange(member.uid!, role);
                                                                }}
                                                                className={`block px-4 py-2 text-sm text-white hover:bg-coc-gold-dark/30 ${member.clashubRole === role ? 'bg-coc-gold-dark/50' : ''}`}
                                                                title={`Ubah role menjadi ${role}`}
                                                            >
                                                                {role}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Tombol Kick */}
                                    <Button 
                                        type="button" 
                                        // FIX 3: Ganti size="sm" dan variant="secondary" (dengan custom color)
                                        size="sm" 
                                        variant="secondary" 
                                        onClick={() => member.uid && handleKick(member.uid)}
                                        disabled={isActionDisabled}
                                        className="w-28 justify-center bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-1"/> Kick
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


// --- HELPER COMPONENT: Join Requests (Tab Permintaan) ---

interface JoinRequestTabProps {
    clan: ManagedClan;
    joinRequests: JoinRequest[];
    userProfile: UserProfile;
    onAction: (message: string, type: NotificationProps['type']) => void;
    onRefresh: () => void;
}

const JoinRequestTab: React.FC<JoinRequestTabProps> = ({ clan, joinRequests, userProfile, onAction, onRefresh }) => {
    
    const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected', requesterName: string) => {
        onAction(`Memproses permintaan dari ${requesterName}...`, 'info');
        
        try {
            const response = await fetch(`/api/clan/manage/request/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, clanId: clan.id }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal ${action === 'approved' ? 'menyetujui' : 'menolak'} permintaan.`);

            let message = result.message;
            if (action === 'approved' && result.clanLink) {
                // Tambahkan catatan tentang link yang dikirim (sesuai catatan sebelumnya)
                message += ` (Link Klan: ${result.clanLink}) telah dikirim ke requester.`;
            }

            onAction(message, 'success');
            onRefresh(); // Refresh data server
        } catch (err) {
            onAction((err as Error).message, 'error');
        }
    };
    
    if (joinRequests.length === 0) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <MailOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Ada Permintaan Bergabung yang Tertunda</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Semua permintaan sudah diproses atau klan Anda belum menerima permintaan baru.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {joinRequests.map(request => (
                <div key={request.id} className="card-stone p-4 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 border-l-4 border-coc-gold">
                    <div className="text-left flex-grow space-y-1">
                        <p className="text-lg font-clash text-white">{request.requesterName} (TH {request.requesterThLevel})</p>
                        <p className="text-sm text-gray-300 font-sans italic">"{request.message || 'Tidak ada pesan.'}"</p>
                        <p className="text-xs text-gray-500 mt-1">Diajukan: {new Date(request.timestamp).toLocaleDateString('id-ID')}</p>
                    </div>
                    
                    <div className="flex space-x-3 flex-shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'approved', request.requesterName)}
                        >
                            <ThumbsUpIcon className="h-4 w-4 mr-1" /> Terima
                        </Button>
                        <Button 
                            // FIX 3: Ganti variant="secondary" (dengan custom color)
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'rejected', request.requesterName)}
                            className="bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
                        >
                            <ThumbsDownIcon className="h-4 w-4 mr-1" /> Tolak
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- FUNGSI UTAMA CLIENT ---

/**
 * @component ManageClanClient
 * Menangani tampilan manajemen klan (Leader/Co-Leader yang terverifikasi).
 * Menyediakan tombol sinkronisasi manual dan tampilan multi-tab.
 */
const ManageClanClient = ({ initialData, serverError, profile }: ManageClanClientProps) => {
    const router = useRouter();
    
    // State untuk tab aktif dan sinkronisasi
    const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
    const [isSyncing, setIsSyncing] = useState(false);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };
    
    // Fungsi refresh untuk Client Component (memuat ulang Server Component)
    const handleRefreshData = () => {
        router.refresh();
        showNotification('Memuat ulang data dari server...', 'info');
    };

    // --- TAMPILAN ERROR / AKSES DITOLAK ---
    if (serverError) {
        // ... (Kode error tetap sama) ...
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
    const data = initialData!;
    const clan = data.clan; 
    const cache = data.cache;
    
    // Sinkronisasi status
    const lastSyncedDate = cache?.lastUpdated instanceof Date ? cache.lastUpdated : new Date(0); 
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
            const response = await fetch(`/api/coc/sync-managed-clan?clanId=${clan.id}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Request-UID': data.profile.uid, 
                },
            });

            const result = await response.json();

            if (!response.ok) {
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
    
    // Utility: Tombol untuk Tab
    const TabButton: React.FC<{ tabName: ActiveTab, icon: React.ReactNode, label: string }> = ({ tabName, icon, label }) => (
        <Button
            variant={activeTab === tabName ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tabName)}
            size="sm"
            className="w-full justify-start md:w-auto md:min-w-[150px]"
        >
            {icon}
            <span className="ml-2">{label}</span>
        </Button>
    );

    const memberCount = clan.memberCount || 0;
    const avgThLevel = clan.avgTh || 'N/A';
    
    // Komponen Ringkasan (Summary Tab)
    const SummaryTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel Sinkronisasi */}
                <div className="card-stone p-6 space-y-4">
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" /> Kontrol Sinkronisasi
                    </h3>
                    <p className="text-sm text-gray-300 font-sans">
                        Sinkronisasi menarik data Anggota, War Log, CWL Archive, dan Raid Log terbaru. Tekan tombol di bawah untuk memperbarui Partisipasi War.
                    </p>
                    <Button 
                        onClick={handleSyncManual} 
                        variant={isCacheStale ? 'primary' : 'secondary'}
                        disabled={isSyncing}
                        className={`w-full ${isSyncing ? 'animate-pulse' : ''}`}
                    >
                        <RefreshCwIcon className={`inline h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronisasi Manual Sekarang'}
                    </Button>
                </div>
                
                {/* Panel Data Internal */}
                <div className="card-stone p-6 space-y-3">
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <InfoIcon className="h-5 w-5" /> Info Internal
                    </h3>
                    <p className="text-sm text-gray-300"><span className="font-bold">ID Internal:</span> {clan.id}</p>
                    <p className="text-sm text-gray-300"><span className="font-bold">UID Owner:</span> {clan.ownerUid}</p>
                    <p className="text-sm text-gray-300"><span className="font-bold">Status Rekrutmen:</span> <span className="text-coc-green">{clan.recruitingStatus}</span></p>
                    <p className="text-sm text-gray-300"><span className="font-bold">Anggota Clashub:</span> {data.members.length}</p>
                </div>
            </div>

            {/* Status War/Raid Cepat (Placeholder) */}
            <div className="card-stone p-6">
                 <h3 className="text-xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                     <TrophyIcon className="h-5 w-5 text-coc-gold" /> Status Aktivitas Cepat
                 </h3>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                     <div className="bg-coc-stone/50 p-4 rounded-lg">
                         <p className="text-sm text-gray-400 font-sans">War Aktif</p>
                         {/* FIX: Mengatasi CocWarLog type issue (currentWar harusnya CocWarLog) */}
                         <p className="text-lg font-clash text-coc-red">
                            {/* CocWarLog hanya berisi 'items' di root. War aktif punya 'state' di root. Kita harus membedakannya. */}
                            {/* Kita asumsikan currentWar yang sukses dari API memiliki properti state. */}
                            {cache?.currentWar && 'state' in cache.currentWar ? (cache.currentWar as any).state.toUpperCase() : 'NO WAR'}
                         </p>
                     </div>
                     <div className="bg-coc-stone/50 p-4 rounded-lg">
                         <p className="text-sm text-gray-400 font-sans">Raid Weekend</p>
                         <p className="text-lg font-clash text-coc-green">N/A (API)</p>
                     </div>
                     <div className="bg-coc-stone/50 p-4 rounded-lg">
                         <p className="text-sm text-gray-400 font-sans">Anggota Partisipasi (Cache)</p>
                         <p className="text-lg font-clash text-coc-gold">{cache?.members?.length || 0}</p>
                     </div>
                 </div>
            </div>
        </div>
    );
    
    // Komponen Konten Tab
    const renderContent = () => {
        switch (activeTab) {
            case 'summary':
                return <SummaryTab />;
            case 'members':
                return (
                    <MemberRosterTab
                        clan={clan}
                        cache={cache}
                        members={data.members}
                        userProfile={data.profile}
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'requests':
                return (
                    <JoinRequestTab
                        clan={clan}
                        joinRequests={data.joinRequests}
                        userProfile={data.profile}
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'settings':
                return (
                    <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                         <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                         <p className="text-lg font-clash text-white">Pengaturan Klan</p>
                         <p className="text-sm text-gray-400 font-sans mt-1">Implementasi pengaturan rekrutmen dan transfer kepemilikan akan hadir di Fase 3.</p>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <Notification notification={notification ?? undefined} />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Klan */}
                <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center gap-4">
                        <CogsIcon className="h-10 w-10 text-coc-gold flex-shrink-0" />
                        <div>
                            <h1 className="text-3xl font-clash text-white">Dashboard Manajemen</h1>
                            <p className="text-sm text-gray-400 font-sans">Kelola **{clan.name}** ({clan.tag}) | Role Clashub Anda: {data.profile.role}</p>
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

                {/* Navigasi Tab */}
                <div className="flex flex-wrap gap-3 border-b border-coc-gold-dark/30 pb-4">
                    <TabButton tabName="summary" icon={<InfoIcon className="h-5 w-5"/>} label="Ringkasan & Sinkronisasi" />
                    <TabButton tabName="members" icon={<UserIcon className="h-5 w-5"/>} label={`Anggota (${data.members.length})`} />
                    <TabButton tabName="requests" icon={<MailOpenIcon className="h-5 w-5"/>} label={`Permintaan Gabung (${data.joinRequests.length})`} />
                    <TabButton tabName="settings" icon={<SettingsIcon className="h-5 w-5"/>} label="Pengaturan Klan" />
                </div>
                
                {/* Konten Tab */}
                <section className="card-stone p-6 min-h-[50vh] rounded-lg">
                    {renderContent()}
                </section>
                
            </div>
        </main>
    );
};

export default ManageClanClient;
