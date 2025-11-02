'use client';

// --- [PERBAIKAN 1] ---
import React, { useState, useCallback } from 'react'; // TUGAS: Tambah useState, useCallback
import Image from 'next/image';
import {
  ManagedClan,
  UserProfile,
  JoinRequestWithProfile,
} from '@/lib/types';
// --- TUGAS: Impor hook SWR dan ikon ---
import { useManagedClanRequests } from '@/lib/hooks/useManagedClan'; 
import { Button } from '@/app/components/ui/Button';
import { NotificationProps } from '@/app/components/ui/Notification';
import {
  MailOpenIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  Loader2Icon,         // <-- DITAMBAHKAN
  AlertTriangleIcon, // <-- DITAMBAHKAN
  RefreshCwIcon,       // <-- DITAMBAHKAN
} from '@/app/components/icons';
import { formatNumber } from '@/lib/th-utils'; 
// --- [AKHIR PERBAIKAN 1] ---

// --- [PERBAIKAN 2] ---
// Perbarui tipe props
interface RequestTabContentProps {
  clan: ManagedClan;
  // joinRequests: JoinRequestWithProfile[]; // <-- DIHAPUS
  userProfile: UserProfile;
  onAction: (message: string, type: NotificationProps['type']) => void;
  // onRefresh: () => void; // <-- DIHAPUS
}
// --- [AKHIR PERBAIKAN 2] ---

/**
 * Komponen konten utama untuk Tab Permintaan Bergabung.
 * Menangani persetujuan dan penolakan permintaan.
 */
const RequestTabContent: React.FC<RequestTabContentProps> = ({
  clan,
  // joinRequests, // <-- DIHAPUS
  userProfile,
  onAction,
  // onRefresh, // <-- DIHAPUS
}) => {

  // --- [PERBAIKAN 3: Gunakan SWR Hook] ---
  const { 
    requestsData: joinRequests, // Alias 'requestsData' menjadi 'joinRequests'
    isLoading, 
    isError: error, 
    mutateRequests 
  } = useManagedClanRequests(clan.id);

  // State untuk loading per tombol (mencegah klik ganda)
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // --- [AKHIR PERBAIKAN 3] ---


  // --- [PERBAIKAN 4: Ganti onRefresh -> mutateRequests dan tambah useCallback] ---
  const handleRequestAction = useCallback(async (
    requestId: string,
    action: 'approved' | 'rejected',
    requesterName: string
  ) => {
    setActionLoading(requestId); // Set loading untuk tombol ini
    onAction(`Memproses permintaan dari ${requesterName}...`, 'info');

    try {
      const response = await fetch(`/api/clan/manage/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message ||
            `Gagal ${action === 'approved' ? 'menyetujui' : 'menolak'} permintaan.`
        );

      let message = result.message;
      if (action === 'approved' && result.clanLink) {
        message += ` (Link Klan telah dikirim ke requester.)`;
      }

      onAction(message, 'success');
      mutateRequests(); // <-- Ganti onRefresh() dengan mutateRequests()
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setActionLoading(null); // Hapus loading
    }
  }, [clan.id, onAction, mutateRequests]); // Tambahkan dependensi
  // --- [AKHIR PERBAIKAN 4] ---

  // --- [PERBAIKAN 5: Tambah State Loading & Error SWR] ---
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
        <p className="text-lg font-clash text-white">Memuat Permintaan Bergabung...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-white">Error Memuat Data</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">{error.message}</p>
        <Button onClick={() => mutateRequests()} variant="secondary" size="sm" className='mt-4'>
          <RefreshCwIcon className='h-4 w-4 mr-2' /> Coba Muat Ulang
        </Button>
      </div>
    );
  }
  // --- [AKHIR PERBAIKAN 5] ---

  // Gunakan joinRequests dari hook SWR. Tambahkan cek !joinRequests
  if (!joinRequests || joinRequests.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <MailOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">
          Tidak Ada Permintaan Bergabung yang Tertunda
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Semua permintaan sudah diproses atau klan Anda belum menerima
          permintaan baru.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {joinRequests.map((request) => (
        <div
          key={request.id}
          className="card-stone p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 border-l-4 border-coc-gold"
        >
          {/* --- [PERBAIKAN 3: UI Update] --- */}
          <div className="flex items-center space-x-4 flex-grow w-full md:w-auto">
            {/* Avatar Pengguna */}
            <Image
              src={
                request.requesterProfile.avatarUrl ||
                '/images/placeholder-avatar.png'
              }
              alt={request.requesterProfile.displayName}
              width={48}
              height={48}
              className="rounded-full w-12 h-12"
            />
            {/* Info Permintaan */}
            <div className="text-left flex-grow space-y-1">
              <p className="text-lg font-clash text-white">
                {request.requesterProfile.displayName}
                <span className="text-sm font-sans text-gray-400 ml-2">
                  (TH {formatNumber(request.requesterProfile.thLevel)})
                </span>
              </p>
              {/* Tampilkan Player Tag jika pengguna sudah terverifikasi */}
              {request.requesterProfile.isVerified && (
                <p className="text-xs font-sans text-coc-gold">
                  {request.requesterProfile.playerTag}
                </p>
              )}
              <p className="text-sm text-gray-300 font-sans italic">
                "{request.message || 'Tidak ada pesan.'}"
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Diajukan:{' '}
                {new Date(request.timestamp).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
          {/* --- [AKHIR PERBAIKAN 3] --- */}

          {/* --- [PERBAIKAN 4: Tombol Aksi] --- */}
          <div className="flex space-x-3 flex-shrink-0 w-full md:w-auto justify-end">
            <Button
              variant="primary"
              size="sm"
              // --- [PERBAIKAN 6: Tambah disabled state] ---
              disabled={!!actionLoading} 
              onClick={() =>
                handleRequestAction(
                  request.id,
                  'approved',
                  request.requesterProfile.displayName // Ambil nama dari profil
                )
              }
            >
              {/* --- [PERBAIKAN 7: Tampilkan Loader saat Aksi] --- */}
              {actionLoading === request.id ? (
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsUpIcon className="h-4 w-4 mr-1" />
              )}
              {actionLoading === request.id ? 'Memproses...' : 'Terima'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              // --- [PERBAIKAN 6: Tambah disabled state] ---
              disabled={!!actionLoading}
              onClick={() =>
                handleRequestAction(
                  request.id,
                  'rejected',
                  request.requesterProfile.displayName // Ambil nama dari profil
                )
              }
              className="bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
            >
              {/* --- [PERBAIKAN 7: Tampilkan Loader saat Aksi] --- */}
              {actionLoading === request.id ? (
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsDownIcon className="h-4 w-4 mr-1" />
              )}
              {actionLoading === request.id ? 'Memproses...' : 'Tolak'}
            </Button>
          </div>
          {/* --- [AKHIR PERBAIKAN 4] --- */}
        </div>
      ))}
    </div>
  );
};

export default RequestTabContent;

