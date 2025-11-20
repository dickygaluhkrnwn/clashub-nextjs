'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  ManagedClan,
  UserProfile,
} from '@/lib/types';
import { useManagedClanRequests } from '@/lib/hooks/useManagedClan';
import { Button } from '@/app/components/ui/Button';
import { NotificationProps } from '@/app/components/ui/Notification';
import {
  MailOpenIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
} from '@/app/components/icons';
import { formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface RequestTabContentProps {
  clan: ManagedClan;
  userProfile: UserProfile;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

/**
 * Komponen konten utama untuk Tab Permintaan Bergabung.
 * Menangani persetujuan dan penolakan permintaan.
 */
const RequestTabContent: React.FC<RequestTabContentProps> = ({
  clan,
  userProfile,
  onAction,
}) => {
  // --- [BARU] Init Language Hook ---
  const { t } = useLanguage();

  // --- SWR Hook ---
  const { 
    requestsData: joinRequests, 
    isLoading, 
    isError: error, 
    mutateRequests 
  } = useManagedClanRequests(clan.id);

  // State untuk loading per tombol
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRequestAction = useCallback(async (
    requestId: string,
    action: 'approved' | 'rejected',
    requesterName: string
  ) => {
    setActionLoading(requestId);
    // [i18n] Menggunakan key processing yang ada di clanManage
    onAction(`${t.clanManage.processing} (${requesterName})...`, 'info');

    try {
      const response = await fetch(`/api/clan/manage/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message || t.common.error // [i18n] Fallback error
        );

      // [i18n] Menentukan pesan sukses berdasarkan aksi
      let message = action === 'approved' 
        ? t.clanRequests.toastAccepted 
        : t.clanRequests.toastRejected;

      if (action === 'approved' && result.clanLink) {
        message += ` (Link sent)`; // Bagian dinamis ini bisa dibiarkan atau ditambah key baru nanti
      }

      onAction(message, 'success');
      mutateRequests();
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [clan.id, onAction, mutateRequests, t]); // Tambah 't' ke dependensi

  // --- State Loading SWR ---
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
        {/* [i18n] Loading generic */}
        <p className="text-lg font-clash text-white">{t.common.loading}</p>
      </div>
    );
  }

  // --- State Error SWR ---
  if (error) {
    return (
      <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        {/* [i18n] Error Title */}
        <p className="text-lg font-clash text-white">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">{error.message}</p>
        <Button onClick={() => mutateRequests()} variant="secondary" size="sm" className='mt-4'>
          {/* [i18n] Reload Data */}
          <RefreshCwIcon className='h-4 w-4 mr-2' /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- State Kosong ---
  if (!joinRequests || joinRequests.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <MailOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">
          {t.clanRequests.noRequests} {/* [i18n] Judul No Requests */}
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
           {/* Deskripsi opsional, bisa dikosongkan atau hardcoded */}
           Check back later for new requests.
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
                "{request.message || t.common.noData}" {/* [i18n] Fallback message */}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {/* [i18n] Tanggal lokal */}
                {new Date(request.timestamp).toLocaleDateString(
                   t.common.loading === 'Loading...' ? 'en-US' : 'id-ID' // Deteksi locale sederhana
                )}
              </p>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex space-x-3 flex-shrink-0 w-full md:w-auto justify-end">
            <Button
              variant="primary"
              size="sm"
              disabled={!!actionLoading} 
              onClick={() =>
                handleRequestAction(
                  request.id,
                  'approved',
                  request.requesterProfile.displayName
                )
              }
            >
              {actionLoading === request.id ? (
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsUpIcon className="h-4 w-4 mr-1" />
              )}
              {/* [i18n] Tombol Terima / Memproses */}
              {actionLoading === request.id ? t.clanManage.processing : t.clanRequests.actionAccept}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!!actionLoading}
              onClick={() =>
                handleRequestAction(
                  request.id,
                  'rejected',
                  request.requesterProfile.displayName
                )
              }
              className="bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
            >
              {actionLoading === request.id ? (
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsDownIcon className="h-4 w-4 mr-1" />
              )}
              {/* [i18n] Tombol Tolak / Memproses */}
              {actionLoading === request.id ? t.clanManage.processing : t.clanRequests.actionReject}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestTabContent;