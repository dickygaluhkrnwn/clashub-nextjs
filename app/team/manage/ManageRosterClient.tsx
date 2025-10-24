'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { ManagedClan, UserProfile, JoinRequest } from '@/lib/types';
import { ArrowLeftIcon, CheckIcon, XIcon, UserIcon, CogsIcon, ClockIcon, AlertTriangleIcon } from '@/app/components/icons';
// --- HAPUS IMPOR SALAH ---
// import { updateJoinRequestStatus, updateMemberRole, getUserProfile } from '@/lib/firestore';
// --- Ganti dengan impor getUserProfile saja (jika masih diperlukan) ---
import { getUserProfile } from '@/lib/firestore';
import Notification, { NotificationProps, ConfirmationProps } from '@/app/components/ui/Notification';

interface ManageRosterData {
    team: ManagedClan;
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
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    /**
     * @function handleProcessRequest
     * Menangani persetujuan atau penolakan permintaan bergabung.
     * !!! PERLU DIGANTI DENGAN PEMANGGILAN API ROUTE !!!
     */
    const handleProcessRequest = async (request: JoinRequest, action: 'approved' | 'rejected') => {
        setIsProcessing(request.id);
         showNotification(`Memproses permintaan ${request.requesterName}...`, 'info'); // Info awal

        try {
            // --- TODO: Ganti dengan fetch API Route ---
            // Contoh fetch (endpoint perlu dibuat):
            const response = await fetch(`/api/team/manage/request/${request.id}`, {
                 method: 'PUT', // atau POST
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ action: action, teamId: team.id, requesterId: request.requesterId })
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Gagal ${action === 'approved' ? 'menyetujui' : 'menolak'} permintaan.`);
            }
             // --- Akhir TODO ---

            // Update state setelah fetch berhasil
            if (action === 'approved') {
                 // Ambil profil yang diperbarui (jika API mengembalikannya atau fetch ulang)
                 // const newMemberProfile = await getUserProfile(request.requesterId); // Fetch ulang jika perlu
                 // setActiveMembers(prev => [...prev, newMemberProfile]); // Tambahkan ke daftar anggota aktif
                 showNotification(`Pemain ${request.requesterName} berhasil disetujui.`, 'success');
                 // Refresh halaman untuk memuat ulang data anggota dari server
                 router.refresh();
            } else {
                 showNotification(`Permintaan dari ${request.requesterName} berhasil ditolak.`, 'info');
            }
            setPendingRequests(prev => prev.filter(req => req.id !== request.id));

        } catch (error) {
            console.error(`Gagal memproses permintaan (${action}):`, error);
            const errorMessage = (error instanceof Error) ? error.message : "Terjadi kesalahan tidak dikenal.";
            showNotification(`Gagal memproses permintaan ${request.requesterName}. ${errorMessage}`, 'error');
        } finally {
            setIsProcessing(null);
        }
    };

    /**
     * @function handleChangeRole
     * Menangani perubahan peran anggota (Kapten/Co-Leader/Member)
     * !!! PERLU DIGANTI DENGAN PEMANGGILAN API ROUTE !!!
     */
    const handleChangeRole = async (member: UserProfile, newRole: UserProfile['role']) => {
        if (newRole === member.role) return;
        if (newRole === 'Leader') {
            showNotification("Transfer kepemimpinan harus dilakukan melalui pengaturan tim khusus.", 'warning');
            return;
        }
        if (!member.teamId) return;

        setRoleUpdateLoading(member.uid);
        showNotification(`Mengubah peran ${member.displayName}...`, 'info'); // Info awal

        try {
            // --- TODO: Ganti dengan fetch API Route ---
            // Contoh fetch (endpoint perlu dibuat):
            const response = await fetch(`/api/team/manage/member/${member.uid}/role`, {
                 method: 'PUT', // atau POST
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ newRole: newRole, teamId: team.id })
            });
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Gagal mengubah peran.`);
            }
             // --- Akhir TODO ---

            // Update state setelah fetch berhasil
            setActiveMembers(prev => prev.map(m =>
                m.uid === member.uid ? { ...m, role: newRole } : m
            ));
            showNotification(`Peran ${member.displayName} berhasil diubah menjadi ${newRole}.`, 'success');

        } catch (error) {
            console.error("Gagal mengubah peran:", error);
            const errorMessage = (error instanceof Error) ? error.message : "Pastikan koneksi Anda stabil.";
            showNotification(`Gagal mengubah peran ${member.displayName}. ${errorMessage}`, 'error');
        } finally {
            setRoleUpdateLoading(null);
        }
    };


    /**
     * @function executeKickMember (Dipanggil setelah konfirmasi)
     * Logika inti untuk mengeluarkan anggota.
     * !!! PERLU DIGANTI DENGAN PEMANGGILAN API ROUTE !!!
     */
    const executeKickMember = async (member: UserProfile) => {
        setRoleUpdateLoading(member.uid);
         showNotification(`Mengeluarkan ${member.displayName}...`, 'info'); // Info awal

        try {
             // --- TODO: Ganti dengan fetch API Route ---
             // Contoh fetch (endpoint perlu dibuat):
             const response = await fetch(`/api/team/manage/member/${member.uid}`, {
                  method: 'DELETE', // atau POST dengan action 'kick'
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ teamId: team.id }) // Kirim ID tim untuk validasi di server
             });
              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `Gagal mengeluarkan anggota.`);
             }
              // --- Akhir TODO ---

            // Update state setelah fetch berhasil
            setActiveMembers(prev => prev.filter(m => m.uid !== member.uid));
            showNotification(`${member.displayName} berhasil dikeluarkan dari tim.`, 'success');

        } catch (error) {
            console.error("Gagal mengeluarkan anggota:", error);
            const errorMessage = (error instanceof Error) ? error.message : "Silakan coba lagi.";
            showNotification(`Gagal mengeluarkan ${member.displayName}. ${errorMessage}`, 'error');
        } finally {
            setRoleUpdateLoading(null);
        }
    };

    const requestKickConfirmation = (member: UserProfile) => {
        if (member.uid === currentUserUid) {
            showNotification("Anda tidak dapat mengeluarkan diri sendiri.", 'warning');
            return;
        }
        if (member.role === 'Leader') {
             showNotification("Leader tim tidak dapat dikeluarkan melalui halaman ini.", 'warning');
             return;
        }

        setConfirmation({
            message: `Anda yakin ingin mengeluarkan ${member.displayName} (${member.playerTag}) dari tim ${team.name}? Tindakan ini akan mengubah role Clashub mereka menjadi Free Agent.`,
            confirmText: 'Ya, Keluarkan',
            cancelText: 'Batal',
            onConfirm: () => {
                setConfirmation(null);
                executeKickMember(member);
            },
            onCancel: () => setConfirmation(null)
        });
    };

    const selectClasses = `
        w-full appearance-none bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md
        px-3 py-2 text-sm text-white focus:ring-1 focus:ring-coc-gold focus:border-coc-gold
        disabled:opacity-50 disabled:cursor-not-allowed font-sans
        bg-no-repeat bg-right
    `;
    const arrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B8860B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <Notification notification={notification ?? undefined} confirmation={confirmation ?? undefined} />

            <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6 rounded-lg">
                <h1 className="text-3xl md:text-4xl text-white font-clash m-0 flex items-center gap-3">
                    <CogsIcon className='h-7 w-7 text-coc-gold-dark'/> Kelola Tim: {team.name}
                </h1>
                <Link href={`/team/${team.id}`}>
                    <Button variant="secondary" size="md" className="flex items-center">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Profil Tim
                    </Button>
                </Link>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    {/* Permintaan Bergabung */}
                    <div className="card-stone p-6 rounded-lg">
                        <h2 className="text-2xl font-clash border-l-4 border-coc-gold pl-3 mb-6 flex items-center gap-2">
                            Permintaan Bergabung ({pendingRequests.length})
                        </h2>
                        <div className="space-y-4">
                            {pendingRequests.length === 0 ? (
                                <p className="text-gray-400 p-4 bg-coc-stone/30 rounded-lg font-sans">Tidak ada permintaan bergabung yang tertunda.</p>
                            ) : (
                                pendingRequests.map((request) => {
                                    const isCurrentProcessing = isProcessing === request.id;
                                    return (
                                        <div key={request.id} className="flex items-center flex-wrap gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-green/80">
                                            <div className="flex-shrink-0">
                                                {/* Fallback jika requesterProfile tidak ada */}
                                                <Image src={request.requesterProfile?.avatarUrl || '/images/placeholder-avatar.png'} alt="Avatar" width={40} height={40} className="rounded-full object-cover border border-coc-gold-dark" />
                                            </div>
                                            <div className="flex-grow min-w-[200px]">
                                                <Link href={`/player/${request.requesterId}`} className="font-bold text-white hover:text-coc-gold transition-colors text-lg">{request.requesterName}</Link>
                                                <p className="text-xs text-gray-400 font-sans">TH {request.requesterThLevel} | Reputasi: {request.requesterProfile?.reputation?.toFixed(1) || '?'} ★</p>
                                                <p className="text-sm text-gray-300 mt-1 italic font-sans">Pesan: {request.message || 'Tidak ada pesan.'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleProcessRequest(request, 'approved')}
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={isCurrentProcessing}
                                                    className={isCurrentProcessing && isProcessing === request.id ? 'animate-pulse' : ''}
                                                >
                                                    <CheckIcon className="h-4 w-4 mr-1"/> {isCurrentProcessing ? 'Memproses' : 'Terima'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleProcessRequest(request, 'rejected')}
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={isCurrentProcessing}
                                                     className={isCurrentProcessing && isProcessing === request.id ? 'animate-pulse' : ''}
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
                    <div className="card-stone p-6 rounded-lg">
                        <h2 className="text-2xl font-clash border-l-4 border-coc-gold pl-3 mb-6 flex items-center gap-2">
                            Anggota Aktif ({activeMembers.length}/50)
                        </h2>

                        <div className="space-y-4">
                            {activeMembers.map((member) => {
                                const isLoading = roleUpdateLoading === member.uid;
                                const isCurrentUser = member.uid === currentUserUid;
                                const isTeamLeader = member.role === 'Leader'; // Cek role Clashub

                                return (
                                    <div key={member.uid} className="flex items-center flex-wrap gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30">
                                        <div className="flex-shrink-0">
                                            <Image src={member.avatarUrl || '/images/placeholder-avatar.png'} alt="Avatar" width={40} height={40} className="rounded-full object-cover border border-coc-gold-dark" />
                                        </div>
                                        <div className="flex-grow min-w-[150px]">
                                            <Link href={`/player/${member.uid}`} className="font-bold text-white hover:text-coc-gold transition-colors text-lg">{member.displayName}</Link>
                                            <p className="text-xs text-gray-400 font-sans">TH {member.thLevel} | {member.playerTag}</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={member.role || 'Member'}
                                                onChange={(e) => handleChangeRole(member, e.target.value as UserProfile['role'])}
                                                disabled={isLoading || isCurrentUser || isTeamLeader} // Tidak bisa ubah role diri sendiri atau Leader
                                                className={selectClasses}
                                                style={{ backgroundImage: arrowSvg, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                                            >
                                                <option className='bg-coc-stone text-gray-400' value="Leader" disabled>Leader</option>
                                                <option className='bg-coc-stone text-white' value="Co-Leader">Co-Leader</option>
                                                <option className='bg-coc-stone text-white' value="Elder">Elder</option>
                                                <option className='bg-coc-stone text-white' value="Member">Member</option>
                                            </select>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red/90 !p-2"
                                                onClick={() => requestKickConfirmation(member)}
                                                disabled={isLoading || isCurrentUser || isTeamLeader} // Tidak bisa kick diri sendiri atau Leader
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

                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 rounded-lg">
                    <h2 className="text-2xl font-clash border-l-4 border-coc-gold pl-3 flex items-center gap-2">
                        <CogsIcon className='h-6 w-6'/> Pengaturan Tim
                    </h2>
                    <form className='space-y-4'>
                        <div className="space-y-2">
                            <label htmlFor="recruiting-status" className="block text-sm font-bold text-gray-300 font-sans">Status Rekrutmen</label>
                            <select
                                id="recruiting-status"
                                value={team.recruitingStatus}
                                onChange={(e) => {
                                    showNotification(`Status diubah menjadi: ${e.target.value}. Penyimpanan belum diimplementasikan.`, 'info');
                                    // TODO: Implement API call to save settings
                                }}
                                className={selectClasses}
                                style={{ backgroundImage: arrowSvg, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option className='bg-coc-stone text-white' value="Open">Terbuka untuk Umum</option>
                                <option className='bg-coc-stone text-white' value="Invite Only">Hanya Undangan</option>
                                <option className='bg-coc-stone text-white' value="Closed">Tutup</option>
                            </select>
                        </div>
                        <Button variant="primary" className="w-full" onClick={(e) => { e.preventDefault(); showNotification('Penyimpanan pengaturan lain belum diimplementasikan.', 'info'); }}>
                            Simpan Pengaturan
                        </Button>
                    </form>

                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 pt-4">
                        <ClockIcon className='inline h-5 w-5 mr-2'/> Jadwal Tim
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

// --- Helper: Menambahkan data profil ke permintaan ---
// Ini diperlukan agar kita bisa menampilkan reputasi di kartu permintaan
// Fungsi ini perlu dipanggil di Server Component (`page.tsx`) sebelum meneruskan data
// (Contoh implementasi - perlu disesuaikan di `page.tsx`)
async function enrichRequestsWithProfile(requests: JoinRequest[]): Promise<(JoinRequest & { requesterProfile?: UserProfile | null })[]> {
     const enrichedRequests = await Promise.all(requests.map(async (req) => {
         const profile = await getUserProfile(req.requesterId);
         return { ...req, requesterProfile: profile };
     }));
     return enrichedRequests;
}

export default ManageRosterClient;
