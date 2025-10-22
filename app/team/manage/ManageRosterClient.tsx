'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Team, UserProfile, JoinRequest } from '@/lib/types';
// PERBAIKAN 1: Import CheckIcon
import { ArrowLeftIcon, CheckIcon, XIcon, UserIcon, CogsIcon, ClockIcon } from '@/app/components/icons'; 
// PERBAIKAN 2: Tambahkan getUserProfile ke impor Firestore
import { updateJoinRequestStatus, updateMemberRole, getUserProfile } from '@/lib/firestore'; // Import fungsi aksi

interface ManageRosterData {
    team: Team;
    requests: JoinRequest[];
    members: UserProfile[];
}

interface ManageRosterClientProps {
    initialData: ManageRosterData;
    currentUserUid: string;
}

const ManageRosterClient = ({ initialData, currentUserUid }: ManageRosterClientProps) => {
    const router = useRouter();
    const { team: initialTeam, requests: initialRequests, members: initialMembers } = initialData;
    
    const [team] = useState(initialTeam);
    const [pendingRequests, setPendingRequests] = useState(initialRequests);
    const [activeMembers, setActiveMembers] = useState(initialMembers);
    const [isProcessing, setIsProcessing] = useState<string | null>(null); 
    const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null); 

    
    /**
     * @function handleProcessRequest
     * Menangani persetujuan atau penolakan permintaan bergabung.
     * @param request - Data permintaan.
     * @param action - 'approved' atau 'rejected' (sesuai tipe Firestore).
     */
    const handleProcessRequest = async (request: JoinRequest, action: 'approved' | 'rejected') => {
        setIsProcessing(request.id);
        
        try {
            // 1. Update status permintaan di Firestore
            await updateJoinRequestStatus(request.id, action);

            if (action === 'approved') {
                // 2. Update profil pengguna (jadikan member) di Firestore
                await updateMemberRole(
                    request.requesterId, 
                    team.id, 
                    team.name, 
                    'Member' // Default role anggota baru
                );
                
                // 3. AMBIL PROFIL LENGKAP untuk update UI
                const newMemberProfile = await getUserProfile(request.requesterId);

                if (newMemberProfile) {
                    // 4. Update daftar anggota aktif di UI dengan data profil LENGKAP
                    setActiveMembers(prev => [...prev, newMemberProfile]);
                    alert(`Pemain ${request.requesterName} berhasil disetujui sebagai anggota.`);
                } else {
                    // Jika gagal mengambil profil, tetap lanjutkan proses hapus request
                    console.warn(`[WARNING] Profil lengkap untuk ${request.requesterName} tidak ditemukan setelah persetujuan.`);
                    alert(`Pemain ${request.requesterName} berhasil disetujui, namun data di UI mungkin tidak lengkap. Refresh halaman diperlukan.`);
                }
            } else {
                 alert(`Permintaan dari ${request.requesterName} berhasil ditolak.`);
            }
            
            // 5. Hapus permintaan dari daftar pending
            setPendingRequests(prev => prev.filter(req => req.id !== request.id));
            
        } catch (error) {
            console.error(`Gagal memproses permintaan (${action}):`, error);
            alert(`Gagal memproses permintaan. Silakan coba lagi.`);
        } finally {
            setIsProcessing(null);
        }
    };

    /**
     * @function handleChangeRole
     * Menangani perubahan peran anggota (Kapten/Co-Leader/Member)
     */
    const handleChangeRole = async (member: UserProfile, newRole: UserProfile['role']) => {
        // Periksa apakah peran baru adalah "Leader" dan Kapten sedang mencoba merubah peran sendiri
        // Karena Leader tidak boleh diubah melalui dropdown ini (perlu logic transfer kepemilikan)
        if (newRole === 'Leader' && member.role === 'Leader') return; 

        if (!member.teamId || member.role === newRole) return;
        
        setRoleUpdateLoading(member.uid);
        try {
            await updateMemberRole(member.uid, team.id, team.name, newRole);

            // Update UI secara optimis
            setActiveMembers(prev => prev.map(m => 
                m.uid === member.uid ? { ...m, role: newRole } : m
            ));
            
            alert(`Peran ${member.displayName} berhasil diubah menjadi ${newRole}.`);
        } catch (error) {
            console.error("Gagal mengubah peran:", error);
            alert("Gagal mengubah peran. Pastikan koneksi Anda stabil.");
        } finally {
            setRoleUpdateLoading(null);
        }
    };

    /**
     * @function handleKickMember
     * Menangani pengeluaran anggota dari tim.
     */
    const handleKickMember = async (member: UserProfile) => {
        // Kapten tidak boleh mengeluarkan dirinya sendiri
        if (member.uid === currentUserUid) {
            alert("Kapten tidak dapat mengeluarkan dirinya sendiri. Anda harus mentransfer kepemimpinan terlebih dahulu.");
            return;
        }

        if (!window.confirm(`Anda yakin ingin mengeluarkan ${member.displayName} dari tim? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        setRoleUpdateLoading(member.uid);
        try {
            // Role di set ke Free Agent, teamId/teamName di set null
            await updateMemberRole(member.uid, null, null, 'Free Agent'); 

            // Hapus dari daftar anggota aktif di UI
            setActiveMembers(prev => prev.filter(m => m.uid !== member.uid));
            
            alert(`${member.displayName} berhasil dikeluarkan dari tim.`);
        } catch (error) {
            console.error("Gagal mengeluarkan anggota:", error);
            alert("Gagal mengeluarkan anggota. Silakan coba lagi.");
        } finally {
            setRoleUpdateLoading(null);
        }
    };

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Header Manajemen */}
            <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6">
                <h1 className="text-3xl md:text-4xl text-white font-supercell m-0 flex items-center gap-3">
                    <CogsIcon className='h-7 w-7 text-coc-gold-dark'/> Kelola Tim: {team.name}
                </h1>
                <Link href={`/team/${team.id}`}>
                    <Button variant="secondary" size="md" className="flex items-center">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Profil Tim
                    </Button>
                </Link>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Kolom Kiri: Permintaan Bergabung & Anggota Aktif */}
                <div className="lg:col-span-3 space-y-8">
                    
                    {/* Permintaan Bergabung */}
                    <div className="card-stone p-6">
                        <h2 className="text-2xl font-supercell border-l-4 border-coc-gold pl-3 mb-6 flex items-center gap-2">
                            Permintaan Bergabung ({pendingRequests.length})
                        </h2>
                        <div className="space-y-4">
                            {pendingRequests.length === 0 ? (
                                <p className="text-gray-400 p-4 bg-coc-stone/30 rounded-lg">Tidak ada permintaan bergabung yang tertunda.</p>
                            ) : (
                                pendingRequests.map((request) => {
                                    const isCurrentProcessing = isProcessing === request.id;
                                    return (
                                        <div key={request.id} className="flex items-center flex-wrap gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-green/80">
                                            <div className="flex-shrink-0">
                                                <Image src="/images/placeholder-avatar.png" alt="Avatar" width={40} height={40} className="rounded-full object-cover border border-coc-gold-dark" />
                                            </div>
                                            <div className="flex-grow min-w-[200px]">
                                                <Link href={`/player/${request.requesterId}`} className="font-bold text-white hover:text-coc-gold transition-colors text-lg">{request.requesterName}</Link>
                                                <p className="text-xs text-gray-400">TH {request.requesterThLevel} | Reputasi: 4.5 ★</p>
                                                <p className="text-sm text-gray-300 mt-1 italic">Pesan: {request.message || 'Tidak ada pesan.'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    onClick={() => handleProcessRequest(request, 'approved')} 
                                                    variant="primary" 
                                                    size="sm" 
                                                    disabled={isCurrentProcessing}
                                                >
                                                    <CheckIcon className="h-4 w-4 mr-1"/> {isCurrentProcessing ? 'Memproses' : 'Terima'}
                                                </Button>
                                                <Button 
                                                    onClick={() => handleProcessRequest(request, 'rejected')} 
                                                    variant="secondary" 
                                                    size="sm"
                                                    disabled={isCurrentProcessing}
                                                >
                                                    <XIcon className="h-4 w-4 mr-1"/> Tolak
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    
                    {/* Anggota Aktif */}
                    <div className="card-stone p-6">
                        <h2 className="text-2xl font-supercell border-l-4 border-coc-gold pl-3 mb-6 flex items-center gap-2">
                            Anggota Aktif ({activeMembers.length}/50)
                        </h2>
                        
                        <div className="space-y-4">
                            {activeMembers.map((member) => {
                                const isLoading = roleUpdateLoading === member.uid;
                                return (
                                    <div key={member.uid} className="flex items-center flex-wrap gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30">
                                        <div className="flex-shrink-0">
                                            <Image src={member.avatarUrl || '/images/placeholder-avatar.png'} alt="Avatar" width={40} height={40} className="rounded-full object-cover border border-coc-gold-dark" />
                                        </div>
                                        <div className="flex-grow min-w-[150px]">
                                            <Link href={`/player/${member.uid}`} className="font-bold text-white hover:text-coc-gold transition-colors text-lg">{member.displayName}</Link>
                                            <p className="text-xs text-gray-400">TH {member.thLevel} | {member.playerTag}</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            {/* Selector Peran */}
                                            <select
                                                value={member.role || 'Member'}
                                                onChange={(e) => handleChangeRole(member, e.target.value as UserProfile['role'])}
                                                disabled={isLoading || member.uid === currentUserUid || member.role === 'Leader'}
                                                className="bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md px-3 py-1.5 text-sm text-white disabled:opacity-50"
                                            >
                                                <option value="Leader" disabled>Kapten</option>
                                                <option value="Co-Leader">Co-Leader</option>
                                                <option value="Elder">Elder</option>
                                                <option value="Member">Member</option>
                                            </select>
                                            
                                            {/* Tombol Kick (Disabled jika Kapten mencoba mengeluarkan dirinya sendiri atau sedang loading) */}
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red/90"
                                                onClick={() => handleKickMember(member)}
                                                disabled={member.uid === currentUserUid || isLoading || member.role === 'Leader'}
                                            >
                                                {isLoading ? '...' : <XIcon className="h-4 w-4"/>}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Pengaturan Tim */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6">
                    <h2 className="text-2xl font-supercell border-l-4 border-coc-gold pl-3 flex items-center gap-2">
                        <CogsIcon className='h-6 w-6'/> Pengaturan Tim
                    </h2>
                    <form className='space-y-4'>
                        <div className="form-group">
                            <label htmlFor="recruiting-status" className="block text-sm font-bold text-gray-300 mb-2">Status Rekrutmen</label>
                            <select
                                id="recruiting-status"
                                value={team.recruitingStatus}
                                onChange={(e) => { 
                                    // ASUMSI: Fungsi untuk update status rekrutmen akan memanggil fungsi di firestore.ts
                                    alert(`Status diubah menjadi: ${e.target.value}. Implementasi penyimpanan ke Firestore akan dilakukan.`);
                                }}
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                            >
                                <option value="Open">Terbuka untuk Umum</option>
                                <option value="Invite Only">Hanya Undangan</option>
                                <option value="Closed">Tutup</option>
                            </select>
                        </div>
                        {/* Contoh tombol simpan untuk pengaturan lain */}
                        <Button variant="primary" className="w-full">Simpan Pengaturan Lain</Button>
                    </form>
                    
                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 mt-6">
                        <ClockIcon className='h-5 w-5'/> Jadwal Tim
                    </h3>
                    <div className="space-y-3">
                        <Link href="/team/manage/schedule">
                            <Button variant="secondary" className="w-full">Kelola Kalender War</Button>
                        </Link>
                    </div>
                </aside>
            </section>
        </main>
    );
};

export default ManageRosterClient;
