'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// PERBAIKAN #1: Mengganti Team dengan ManagedClan
import { ManagedClan, UserProfile, JoinRequest } from '@/lib/types';
import { ArrowLeftIcon, CheckIcon, XIcon, UserIcon, CogsIcon, ClockIcon, AlertTriangleIcon } from '@/app/components/icons';
import { updateJoinRequestStatus, updateMemberRole, getUserProfile } from '@/lib/firestore';
import Notification, { NotificationProps, ConfirmationProps } from '@/app/components/ui/Notification';

interface ManageRosterData {
    // PERBAIKAN #2: Menggunakan ManagedClan
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
    // PERBAIKAN #3: Menggunakan initialData.team yang sudah bertipe ManagedClan
    const { team: initialTeam, requests: initialRequests, members: initialMembers } = initialData;

    const [team] = useState(initialTeam);
    const [pendingRequests, setPendingRequests] = useState(initialRequests);
    const [activeMembers, setActiveMembers] = useState(initialMembers);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);

    // --- State untuk Notifikasi ---
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationProps | null>(null);

    // Fungsi helper untuk menampilkan notifikasi
    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    /**
     * @function handleProcessRequest
     * Menangani persetujuan atau penolakan permintaan bergabung.
     */
    const handleProcessRequest = async (request: JoinRequest, action: 'approved' | 'rejected') => {
        setIsProcessing(request.id);

        try {
            await updateJoinRequestStatus(request.id, action);

            if (action === 'approved') {
                // Memberikan role 'Member' Clashub dan menautkan ke ManagedClan.id
                await updateMemberRole(
                    request.requesterId,
                    team.id,
                    team.name,
                    'Member' as UserProfile['role'] // Memastikan tipe yang benar
                );

                const newMemberProfile = await getUserProfile(request.requesterId);

                if (newMemberProfile) {
                    setActiveMembers(prev => [...prev, newMemberProfile]);
                    showNotification(`Pemain ${request.requesterName} berhasil disetujui sebagai anggota.`, 'success');
                } else {
                    console.warn(`[WARNING] Profil lengkap untuk ${request.requesterName} tidak ditemukan setelah persetujuan.`);
                    showNotification(`Pemain ${request.requesterName} disetujui, tapi refresh mungkin diperlukan.`, 'warning');
                }
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
     */
    const handleChangeRole = async (member: UserProfile, newRole: UserProfile['role']) => {
        // Prevent unnecessary updates
        if (newRole === member.role) return;
        
        // Leader role cannot be changed directly via this dropdown for safety
        // Catatan: Jika ingin mengimplementasikan transfer kepemimpinan penuh, logika ini perlu diubah.
        if (newRole === 'Leader') {
            showNotification("Transfer kepemimpinan harus dilakukan melalui pengaturan tim khusus.", 'warning');
            return;
        }

        if (!member.teamId) return; // Should not happen for active members

        setRoleUpdateLoading(member.uid);
        try {
            await updateMemberRole(member.uid, team.id, team.name, newRole);

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
     * @function handleKickMember (Dipanggil setelah konfirmasi)
     * Logika inti untuk mengeluarkan anggota.
     */
    const executeKickMember = async (member: UserProfile) => {
        setRoleUpdateLoading(member.uid);
        try {
            await updateMemberRole(member.uid, null, null, 'Free Agent');
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

    /**
     * @function requestKickConfirmation
     * Menampilkan dialog konfirmasi sebelum mengeluarkan anggota.
     */
    const requestKickConfirmation = (member: UserProfile) => {
            // Kapten tidak boleh mengeluarkan dirinya sendiri
        if (member.uid === currentUserUid) {
            showNotification("Anda adalah owner klan. Transfer kepemimpinan CoC atau ubah role Clashub Anda terlebih dahulu.", 'warning');
            return;
        }

        setConfirmation({
            message: `Anda yakin ingin mengeluarkan ${member.displayName} dari tim? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: 'Ya, Keluarkan',
            cancelText: 'Batal',
            onConfirm: () => {
                setConfirmation(null); // Tutup dialog konfirmasi
                executeKickMember(member); // Jalankan aksi kick
            },
            onCancel: () => setConfirmation(null) // Tutup dialog jika dibatalkan
        });
    };

    // --- Style Kustom untuk Select ---
    const selectClasses = `
        w-full appearance-none bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md
        px-3 py-2 text-sm text-white focus:ring-1 focus:ring-coc-gold focus:border-coc-gold
        disabled:opacity-50 disabled:cursor-not-allowed font-sans
        bg-no-repeat bg-right
    `;
    // SVG panah dropdown (warna emas gelap)
    const arrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B8860B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* --- Render Komponen Notifikasi & Konfirmasi --- */}
            <Notification notification={notification ?? undefined} confirmation={confirmation ?? undefined} />

            {/* Header Manajemen */}
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

                {/* Kolom Kiri: Permintaan Bergabung & Anggota Aktif */}
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
                                                <Image src="/images/placeholder-avatar.png" alt="Avatar" width={40} height={40} className="rounded-full object-cover border border-coc-gold-dark" />
                                            </div>
                                            <div className="flex-grow min-w-[200px]">
                                                <Link href={`/player/${request.requesterId}`} className="font-bold text-white hover:text-coc-gold transition-colors text-lg">{request.requesterName}</Link>
                                                <p className="text-xs text-gray-400 font-sans">TH {request.requesterThLevel} | Reputasi: ? ★</p>
                                                <p className="text-sm text-gray-300 mt-1 italic font-sans">Pesan: {request.message || 'Tidak ada pesan.'}</p>
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
                    <div className="card-stone p-6 rounded-lg">
                        <h2 className="text-2xl font-clash border-l-4 border-coc-gold pl-3 mb-6 flex items-center gap-2">
                            Anggota Aktif ({activeMembers.length}/50)
                        </h2>

                        <div className="space-y-4">
                            {activeMembers.map((member) => {
                                const isLoading = roleUpdateLoading === member.uid;
                                // Anggota tidak dapat dikeluarkan jika mereka adalah Kapten Internal Clashub
                                const isCaptainInternal = member.uid === currentUserUid && member.role === 'Leader';
                                return (
                                    <div key={member.uid} className="flex items-center flex-wrap gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30">
                                        <div className="flex-shrink-0">
                                            <Image src={member.avatarUrl || '/images/placeholder-avatar.png'} alt="Avatar" width={40} height={40} className="rounded-full object-cover border border-coc-gold-dark" />
                                        </div>
                                        <div className="flex-grow min-w-[150px]">
                                            <Link href={`/player/${member.uid}`} className="font-bold text-white hover:text-coc-gold transition-colors text-lg">{member.displayName}</Link>
                                            <p className="text-xs text-gray-400 font-sans">TH {member.thLevel} | {member.playerTag}</p>
                                        </div>
                                        {/* PERBAIKAN #4: Mengganti className1 menjadi className */}
                                        <div className="flex gap-2 items-center"> 
                                            {/* Select Role */}
                                            <select
                                                value={member.role || 'Member'}
                                                onChange={(e) => handleChangeRole(member, e.target.value as UserProfile['role'])}
                                                // Disable jika loading, adalah pengguna saat ini, atau jika dia adalah Leader (untuk keamanan)
                                                disabled={isLoading || isCaptainInternal || member.role === 'Leader'} 
                                                className={selectClasses}
                                                style={{ backgroundImage: arrowSvg, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                                            >
                                                {/* Opsi Select */}
                                                <option className='bg-coc-stone text-gray-400' value="Leader" disabled>Kapten</option>
                                                <option className='bg-coc-stone text-white' value="Co-Leader">Co-Leader</option>
                                                <option className='bg-coc-stone text-white' value="Elder">Elder</option>
                                                <option className='bg-coc-stone text-white' value="Member">Member</option>
                                            </select>

                                            {/* Tombol Kick */}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red/90 !p-2" 
                                                onClick={() => requestKickConfirmation(member)} 
                                                // Disable jika loading, adalah pengguna saat ini, atau jika dia adalah Leader
                                                disabled={isCaptainInternal || member.role === 'Leader'} 
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
                                    // TODO: Implement saving to Firestore updateManagedClanFields(team.id, { recruitingStatus: e.target.value })
                                }}
                                className={selectClasses}
                                style={{ backgroundImage: arrowSvg, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option className='bg-coc-stone text-white' value="Open">Terbuka untuk Umum</option>
                                <option className='bg-coc-stone text-white' value="Invite Only">Hanya Undangan</option>
                                <option className='bg-coc-stone text-white' value="Closed">Tutup</option>
                            </select>
                        </div>
                        {/* Example save button for other settings */}
                        <Button variant="primary" className="w-full" onClick={(e) => { e.preventDefault(); showNotification('Penyimpanan pengaturan lain belum diimplementasikan.', 'info'); }}>
                            Simpan Pengaturan Lain
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

export default ManageRosterClient;
