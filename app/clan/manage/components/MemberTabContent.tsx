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
// FIX 1: Import NotificationProps dari file komponennya
import { NotificationProps } from '@/app/components/ui/Notification';

interface MemberTabContentProps {
    clan: ManagedClan;
    cache: ClanApiCache | null;
    members: UserProfile[]; // Daftar UserProfile (untuk mendapatkan UID dan Role Clashub)
    userProfile: UserProfile; // Profil Leader/Co-Leader yang sedang login
    onAction: (message: string, type: NotificationProps['type']) => void;
    onRefresh: () => void;
}

/**
 * Komponen konten utama untuk Tab Anggota (Member Roster).
 * Memindahkan logika MemberRosterTab dari ManageClanClient.tsx.
 */
const MemberTabContent: React.FC<MemberTabContentProps> = ({ 
    clan, cache, members, userProfile, onAction, onRefresh 
}) => {
    const isLeader = userProfile.role === 'Leader';
    const rosterMembers = cache?.members || [];
    
    // State untuk mengontrol dropdown role yang terbuka
    const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

    const getParticipationStatusClass = (status: ClanApiCache['members'][number]['participationStatus']) => {
        switch (status) {
            case 'Promosi': return 'text-coc-gold bg-coc-gold/20 font-bold border-coc-gold';
            case 'Demosi': return 'text-coc-red bg-coc-red/20 font-bold border-coc-red';
            case 'Leader/Co-Leader': return 'text-coc-blue bg-coc-blue/20 border-coc-blue';
            case 'Aman':
            default: return 'text-coc-green bg-coc-green/20 border-coc-green';
        }
    };
    
    // Helper: Map Role internal Clashub ke Role CoC API
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

        // Gunakan confirm() kustom (simulasi)
        const isConfirmed = confirm(`Yakin ingin mengeluarkan ${targetProfile.displayName} (${targetProfile.playerTag}) dari klan Clashub?`);
        if (!isConfirmed) return;

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
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Ada Data Anggota di Cache</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Silakan lakukan **Sinkronisasi Manual** di Tab Ringkasan untuk memuat data partisipasi klan.</p>
            </div>
        );
    }
    
    // Gabungkan data cache (partisipasi dan metrik) dengan data profil (UID, role Clashub)
    const combinedRoster = rosterMembers.map(cacheMember => {
        const profileData = members.find(p => p.playerTag === cacheMember.tag);
        return {
            ...cacheMember,
            uid: profileData?.uid, // UID untuk aksi manajemen
            clashubRole: profileData?.role || 'Free Agent', // Role Clashub internal
            isVerified: profileData?.isVerified || false,
            // Data tambahan dari cache/agregator
            warSuccessCount: cacheMember.warSuccessCount || 0,
            warFailCount: cacheMember.warFailCount || 0,
            cwlSuccessCount: cacheMember.cwlSuccessCount || 0,
            cwlFailCount: cacheMember.cwlFailCount || 0,
            statusKeterangan: (cacheMember as any).statusKeterangan || 'N/A', 
            xpLevel: (cacheMember as any).expLevel || 0, // Menggunakan XP Level dari cache
            donations: (cacheMember as any).donations || 0, // Menggunakan Donasi dari cache
            donationsReceived: (cacheMember as any).donationsReceived || 0, // Menggunakan Donasi Diterima dari cache
        };
    });

    return (
        <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                <thead className="bg-coc-stone/70 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain (TH / Role CoC)</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Level XP / Donasi</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Trophies</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Partisipasi (S/F)</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Status Partisipasi</th>
                        <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Role Clashub / Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-coc-gold-dark/10">
                    {combinedRoster.map((member) => {
                        // Tidak bisa mengubah Leader dan diri sendiri (kecuali Leader untuk transfer, yang tidak diimplementasikan di sini)
                        const canModify = member.clashubRole !== 'Leader' && member.uid !== userProfile.uid;
                        // Co-Leader tidak bisa mengubah Co-Leader lain
                        const isCoLeaderModifyingCoLeader = userProfile.role === 'Co-Leader' && member.clashubRole === 'Co-Leader';
                        const isActionDisabled = !canModify || isCoLeaderModifyingCoLeader;
                        const thImageUrl = getThImage(member.townHallLevel);

                        return (
                            <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
                                {/* Kolom 1: Pemain */}
                                <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative w-8 h-8 flex-shrink-0">
                                            <Image 
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
                                    <p>XP Level: <span className="font-bold text-white">{member.xpLevel}</span></p>
                                    <p className="text-xs">D+: {formatNumber(member.donations)} | D-: {formatNumber(member.donationsReceived)}</p>
                                </td>
                                
                                {/* Kolom 3: Trofi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-300 font-semibold">
                                    {formatNumber(member.trophies || 0)} 🏆
                                </td>
                                
                                {/* Kolom 4: Rincian Partisipasi */}
                                <td className="px-3 py-3 text-center text-gray-300 text-xs">
                                    <p className="text-gray-400 font-semibold">CW: S-{member.warSuccessCount} / F-{member.warFailCount}</p>
                                    <p className="text-gray-400 font-semibold">CWL: S-{member.cwlSuccessCount} / F-{member.cwlFailCount}</p>
                                </td>

                                {/* Kolom 5: Status Partisipasi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <div className={`inline-flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-xs border ${getParticipationStatusClass(member.participationStatus)}`}>
                                        <span className="font-bold">{member.participationStatus}</span>
                                        <span className="text-[10px] opacity-80 mt-0.5 max-w-[100px] truncate" title={member.statusKeterangan || 'N/A'}>{member.statusKeterangan}</span>
                                    </div>
                                </td>
                                
                                {/* Kolom 6: Role Clashub / Aksi */}
                                <td className="px-3 py-3 whitespace-nowrap text-center space-y-1 w-[150px]">
                                    <span className={member.isVerified ? 'text-coc-green block mb-1' : 'text-coc-red block mb-1'} title={member.isVerified ? "Akun Clashub Terverifikasi" : "Akun Clashub Belum Terverifikasi"}>
                                         {member.isVerified ? 'VERIFIED' : 'UNVERIFIED'} 
                                    </span>
                                    
                                    {member.uid ? (
                                        <div className="flex flex-col space-y-1 items-center">
                                            {/* Dropdown Role */}
                                            <div className="relative inline-block text-left w-full">
                                                <Button 
                                                    type="button" 
                                                    // FIX 2: Mengganti size="xs" menjadi size="sm" (atau size="md" jika ingin lebih besar)
                                                    size="sm" 
                                                    variant="secondary"
                                                    // FIX ERROR 2345: Gunakan non-null assertion (!) karena kita berada dalam blok if(member.uid)
                                                    onClick={() => setOpenRoleDropdown(openRoleDropdown === member.uid ? null : member.uid!)}
                                                    disabled={isActionDisabled}
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
                                                                        // FIX 3: Pastikan member.uid non-null sebelum memanggil handleRoleChange
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
                                                // FIX 2: Mengganti size="xs" menjadi size="sm"
                                                size="sm" 
                                                variant="secondary" 
                                                onClick={() => member.uid && handleKick(member.uid)}
                                                disabled={isActionDisabled}
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
