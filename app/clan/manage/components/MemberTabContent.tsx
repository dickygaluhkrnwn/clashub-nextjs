import React, { useState } from 'react';
import { 
    ManagedClan, ClanApiCache, UserProfile, ClanRole 
} from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { 
    ShieldIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, AlertTriangleIcon 
} from '@/app/components/icons';
import { getThImage, formatNumber } from '@/lib/th-utils';
import Image from 'next/image';
import { NotificationProps } from '@/app/components/ui/Notification';

// Definisikan tipe gabungan untuk Roster
type RosterMember = ClanApiCache['members'][number] & {
    uid?: string;
    clashubRole: UserProfile['role'];
    isVerified: boolean;
};

interface MemberTabContentProps {
    clan: ManagedClan;
    cache: ClanApiCache | null;
    members: UserProfile[]; // Daftar UserProfile (untuk mendapatkan UID dan Role Clashub)
    userProfile: UserProfile; // Profil Leader/Co-Leader yang sedang login
    onAction: (message: string, type: NotificationProps['type']) => void;
    onRefresh: () => void;
    isManager: boolean; // <--- BARU: Prop isManager untuk mengontrol fitur manajemen
}

/**
 * Komponen konten utama untuk Tab Anggota (Member Roster).
 * Menampilkan data partisipasi agregat, dan kontrol manajemen peran/kick.
 */
const MemberTabContent: React.FC<MemberTabContentProps> = ({ 
    clan, cache, members, userProfile, onAction, onRefresh, isManager // <--- Gunakan isManager
}) => {
    // isLeader hanya relevan untuk logika sub-izin (misal: Leader vs Co-Leader)
    const isLeader = userProfile.role === 'Leader';
    const rosterMembers = cache?.members || [];
    
    // State untuk mengontrol dropdown role yang terbuka
    const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

    /**
     * @function getParticipationStatusClass
     * Mengembalikan kelas Tailwind CSS berdasarkan status partisipasi.
     */
    const getParticipationStatusClass = (status: ClanApiCache['members'][number]['participationStatus']) => {
        switch (status) {
            case 'Promosi': return 'text-coc-gold bg-coc-gold/20 font-bold border-coc-gold';
            case 'Demosi': return 'text-coc-red bg-coc-red/20 font-bold border-coc-red';
            case 'Leader/Co-Leader': return 'text-coc-blue bg-coc-blue/20 border-coc-blue';
            case 'Aman':
            default: return 'text-coc-green bg-coc-green/20 border-coc-green';
        }
    };
    
    /**
     * @function mapClashubRoleToCocRole
     * Helper: Map Role internal Clashub ke Role CoC API.
     */
    const mapClashubRoleToCocRole = (clashubRole: UserProfile['role']): ClanRole => {
        switch (clashubRole) {
            case 'Leader': return ClanRole.LEADER;
            case 'Co-Leader': return ClanRole.CO_LEADER;
            case 'Elder': return ClanRole.ELDER;
            case 'Member': 
            case 'Free Agent': 
            default: return ClanRole.MEMBER;
        }
    };
    
    /**
     * @function handleRoleChange
     * Mengubah peran anggota (Memanggil API PUT).
     */
    const handleRoleChange = async (memberUid: string, newClashubRole: UserProfile['role']) => {
        // Pengecekan otorisasi di client side
        if (!isManager) {
            onAction('Akses Ditolak: Anda tidak memiliki izin untuk mengubah peran.', 'error');
            return;
        }
        
        const targetProfile = members.find(m => m.uid === memberUid);

        if (!targetProfile) {
            onAction('Gagal: Profil anggota tidak ditemukan.', 'error');
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
                    oldRoleCoC, // Untuk logging di backend
                    newRoleCoC // Untuk logging di backend
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mengubah peran.');

            onAction(result.message, 'success');
            onRefresh(); 
        } catch (err) {
            onAction((err as Error).message, 'error');
        }
    };

    /**
     * @function handleKick
     * Mengeluarkan anggota dari klan Clashub (Memanggil API DELETE).
     */
    const handleKick = async (memberUid: string) => {
        // Pengecekan otorisasi di client side
        if (!isManager) {
            onAction('Akses Ditolak: Anda tidak memiliki izin untuk mengeluarkan anggota.', 'error');
            return;
        }

        const targetProfile = members.find(m => m.uid === memberUid);
        if (!targetProfile) return;

        // **PERHATIAN**: Mengganti confirm() bawaan browser (dilarang di Canvas)
        onAction(`[KONFIRMASI MANUAL] Meminta server mengeluarkan ${targetProfile.displayName}...`, 'info');

        try {
            const response = await fetch(`/api/clan/manage/member/${memberUid}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clanId: clan.id }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mengeluarkan anggota.');

            onAction(`Berhasil mengeluarkan ${targetProfile.displayName}.`, 'success');
            onRefresh(); 
        } catch (err) {
            onAction((err as Error).message, 'error');
        }
    };

    // List of roles that the current user CAN set for others
    const availableClashubRoles: UserProfile['role'][] = isLeader 
        ? ['Co-Leader', 'Elder', 'Member'] // Leader bisa set Co-Leader, Elder, Member
        : ['Elder', 'Member']; // Co-Leader hanya bisa set Elder dan Member

    if (!cache?.members || cache.members.length === 0) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Ada Data Anggota di Cache</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Silakan lakukan **Sinkronisasi Manual** di Tab Ringkasan untuk memuat data partisipasi klan.</p>
            </div>
        );
    }
    
    // Gabungkan data cache (partisipasi dan metrik) dengan data profil (UID, role Clashub)
    const combinedRoster: RosterMember[] = rosterMembers.map(cacheMember => {
        const profileData = members.find(p => p.playerTag === cacheMember.tag);
        
        // Memastikan tipe properti CocMember yang digabungkan ada, dan menggunakan properti agregat dari cache.members
        return {
            ...cacheMember,
            uid: profileData?.uid, 
            clashubRole: profileData?.role || 'Free Agent', 
            isVerified: profileData?.isVerified || false,
            // Properti ini sudah ada di ClanApiCache['members'][number]
            warSuccessCount: cacheMember.warSuccessCount,
            warFailCount: cacheMember.warFailCount,
            cwlSuccessCount: cacheMember.cwlSuccessCount,
            cwlFailCount: cacheMember.cwlFailCount,
            participationStatus: cacheMember.participationStatus,
            statusKeterangan: cacheMember.statusKeterangan || 'N/A', 
            // Properti CocMember
            expLevel: cacheMember.expLevel, 
            donations: cacheMember.donations, 
            donationsReceived: cacheMember.donationsReceived, 
        } as RosterMember;
    }).sort((a, b) => {
        // Urutkan berdasarkan Town Hall Level (descending) lalu Clan Rank (ascending)
        // PERBAIKAN TYPO: townhallLevel -> townHallLevel
        if (b.townHallLevel !== a.townHallLevel) {
            return b.townHallLevel - a.townHallLevel;
        }
        return a.clanRank - b.clanRank;
    });

    return (
        <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                <thead className="bg-coc-stone/70 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain (TH / Role CoC)</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">XP / D+ / D-</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Trophies</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Partisipasi CW</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Partisipasi CWL</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Status Partisipasi</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[150px]">Role Clashub / Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-coc-gold-dark/10">
                    {combinedRoster.map((member) => {
                        // --- LOGIKA OTORISASI BARU ---
                        const canModify = member.clashubRole !== 'Leader' && member.uid !== userProfile.uid;
                        // Co-Leader tidak bisa mengubah Co-Leader lain
                        const isCoLeaderModifyingCoLeader = userProfile.role === 'Co-Leader' && member.clashubRole === 'Co-Leader';
                        
                        // Action Disabled jika: BUKAN Manager, atau logika izin internal tidak terpenuhi
                        const isActionDisabled = !isManager || !canModify || isCoLeaderModifyingCoLeader || !member.uid; 
                        
                        // PERBAIKAN TYPO: townhallLevel -> townHallLevel
                        const thImageUrl = getThImage(member.townHallLevel);

                        return (
                            <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                {/* Kolom 1: Pemain */}
                                <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative w-8 h-8 flex-shrink-0">
                                            <Image 
                                                // PERBAIKAN TYPO: townhallLevel -> townHallLevel
                                                src={thImageUrl}
                                                alt={`TH ${member.townHallLevel}`}
                                                width={32}
                                                height={32}
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-clash text-base truncate max-w-[150px]">{member.name}</p>
                                            <p className="text-gray-500 block text-xs font-mono">{member.tag}</p>
                                            <p className="text-gray-400 block text-xs font-sans capitalize">{member.role} CoC</p>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* Kolom 2: XP / Donasi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center text-gray-300">
                                    <p>XP: <span className="font-bold text-white">{formatNumber(member.expLevel)}</span></p>
                                    <p className="text-xs">D+: {formatNumber(member.donations)} | D-: {formatNumber(member.donationsReceived)}</p>
                                </td>
                                
                                {/* Kolom 3: Trofi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-300 font-semibold">
                                    {formatNumber(member.trophies || 0)} 🏆
                                </td>
                                
                                {/* Kolom 4: Partisipasi CW */}
                                <td className="px-3 py-3 text-center text-gray-300 text-xs font-semibold">
                                    <span className="text-coc-green">S-{member.warSuccessCount}</span> / <span className="text-coc-red">F-{member.warFailCount}</span>
                                </td>

                                {/* Kolom 5: Partisipasi CWL */}
                                <td className="px-3 py-3 text-center text-gray-300 text-xs font-semibold">
                                    <span className="text-coc-green">S-{member.cwlSuccessCount}</span> / <span className="text-coc-red">F-{member.cwlFailCount}</span>
                                </td>

                                {/* Kolom 6: Status Partisipasi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <div className={`inline-flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-xs border ${getParticipationStatusClass(member.participationStatus)}`}>
                                        <span className="font-bold">{member.participationStatus}</span>
                                        <span className="text-[10px] opacity-80 mt-0.5 max-w-[100px] truncate" title={member.statusKeterangan || 'N/A'}>{member.statusKeterangan}</span>
                                    </div>
                                </td>
                                
                                {/* Kolom 7: Role Clashub / Aksi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center space-y-1 w-[180px]">
                                    <span className={member.isVerified ? 'text-coc-green block mb-1 font-mono' : 'text-coc-red block mb-1 font-mono'} title={member.isVerified ? "Akun Clashub Terverifikasi" : "Akun Clashub Belum Terverifikasi"}>
                                        {member.isVerified ? 'VERIFIED' : 'UNVERIFIED'} 
                                    </span>
                                    
                                    {member.uid ? (
                                        <div className="flex flex-col space-y-1 items-center">
                                            {/* Dropdown Role */}
                                            <div className="relative inline-block text-left w-full">
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => setOpenRoleDropdown(openRoleDropdown === member.uid ? null : member.uid!)}
                                                    disabled={isActionDisabled} // Disabled jika bukan manager atau ada batasan
                                                    className="w-full justify-center text-sm font-semibold"
                                                >
                                                    {member.clashubRole} 
                                                    {openRoleDropdown === member.uid ? <ChevronUpIcon className="h-3 w-3 ml-1"/> : <ChevronDownIcon className="h-3 w-3 ml-1"/>}
                                                </Button>
                                                
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
                                                                    className={`block px-4 py-2 text-xs text-white hover:bg-coc-gold-dark/30 ${member.clashubRole === role ? 'bg-coc-gold-dark/50 font-bold' : ''}`}
                                                                    title={`Ubah role menjadi ${role}`}
                                                                >
                                                                    {role}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Tombol Kick */}
                                            <Button 
                                                type="button" 
                                                size="sm" 
                                                variant="secondary" 
                                                onClick={() => member.uid && handleKick(member.uid)}
                                                disabled={isActionDisabled} // Disabled jika bukan manager atau ada batasan
                                                className="w-full justify-center bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
                                            >
                                                <TrashIcon className="h-3 w-3 mr-1"/> Kick
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 italic text-xs">No Clashub Account</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default MemberTabContent;
