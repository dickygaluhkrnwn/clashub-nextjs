'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  ManagedClan,
  UserProfile,
} from '@/lib/clashub.types';
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
  CheckIcon,
  XIcon
} from '@/app/components/icons';
import { formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface RequestTabContentProps {
  clan: ManagedClan;
  userProfile: UserProfile;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

const RequestTabContent: React.FC<RequestTabContentProps> = ({
  clan,
  userProfile,
  onAction,
}) => {
  const { t } = useLanguage();

  const { 
    requestsData: joinRequests, 
    isLoading, 
    isError: error, 
    mutateRequests 
  } = useManagedClanRequests(clan.id);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRequestAction = useCallback(async (
    requestId: string,
    action: 'approved' | 'rejected',
    requesterName: string
  ) => {
    setActionLoading(requestId);
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
          result.message || t.common.error
        );

      let message = action === 'approved' 
        ? t.clanRequests.toastAccepted 
        : t.clanRequests.toastRejected;

      if (action === 'approved' && result.clanLink) {
        message += ` (Link sent)`;
      }

      onAction(message, 'success');
      mutateRequests();
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [clan.id, onAction, mutateRequests, t]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[300px]">
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">{t.common.loading}</p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm">
        <div className="bg-coc-red/10 p-4 rounded-full mb-4">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
        </div>
        <p className="text-xl font-clash text-white mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-6">{error.message}</p>
        <Button onClick={() => mutateRequests()} variant="secondary" size="sm">
          <RefreshCwIcon className='h-4 w-4 mr-2' /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- Empty State ---
  if (!joinRequests || joinRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed">
        <div className="bg-white/5 p-6 rounded-full mb-4">
            <MailOpenIcon className="h-12 w-12 text-gray-500 opacity-50" />
        </div>
        <p className="text-xl font-clash text-white mb-2">
          {t.clanRequests.noRequests}
        </p>
        <p className="text-sm text-gray-400 font-sans max-w-xs">
           Check back later for new membership requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-lg font-clash text-white">Pending Requests</h3>
        <span className="text-xs bg-coc-gold/20 text-coc-gold px-2 py-1 rounded font-bold border border-coc-gold/30">
            {joinRequests.length}
        </span>
      </div>

      <div className="grid gap-4">
        {joinRequests.map((request) => (
            <div
            key={request.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 shadow-lg transition-all hover:border-coc-gold/30 hover:bg-[#202020]"
            >
            {/* Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-coc-gold group-hover:w-1.5 transition-all" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-3">
                
                {/* User Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Image
                            src={request.requesterProfile.avatarUrl || '/images/placeholder-avatar.png'}
                            alt={request.requesterProfile.displayName}
                            width={56}
                            height={56}
                            className="rounded-full border-2 border-white/10 bg-black shadow-md object-cover"
                        />
                        {request.requesterProfile.thLevel > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded border border-white/20 font-bold">
                                TH {request.requesterProfile.thLevel}
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-clash text-white">{request.requesterProfile.displayName}</h4>
                            {request.requesterProfile.isVerified && (
                                <span className="bg-coc-green/10 text-coc-green text-[10px] px-1.5 py-0.5 rounded border border-coc-green/20 font-bold uppercase tracking-wider">
                                    Verified
                                </span>
                            )}
                        </div>
                        {request.requesterProfile.playerTag && (
                            <p className="text-xs text-coc-gold/80 font-mono mb-1">{request.requesterProfile.playerTag}</p>
                        )}
                        
                        <div className="bg-black/30 px-3 py-2 rounded-lg border border-white/5 mt-1 inline-block max-w-full">
                            <p className="text-sm text-gray-300 italic line-clamp-2">
                                "{request.message || 'I would like to join your clan!'}"
                            </p>
                        </div>
                        
                        <p className="text-[10px] text-gray-500 mt-2">
                            Requested: {new Date(request.timestamp).toLocaleDateString(t.common.loading === 'Loading...' ? 'en-US' : 'id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <Button
                        variant="secondary"
                        onClick={() => handleRequestAction(request.id, 'rejected', request.requesterProfile.displayName)}
                        disabled={!!actionLoading}
                        className="flex-1 md:flex-none justify-center bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                    >
                        {actionLoading === request.id ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                            <XIcon className="h-4 w-4 mr-2" />
                        )}
                        {t.clanRequests.actionReject}
                    </Button>

                    <Button
                        variant="primary"
                        onClick={() => handleRequestAction(request.id, 'approved', request.requesterProfile.displayName)}
                        disabled={!!actionLoading}
                        className="flex-1 md:flex-none justify-center bg-coc-gold hover:bg-coc-gold-dark text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all"
                    >
                        {actionLoading === request.id ? (
                            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <CheckIcon className="h-4 w-4 mr-2" />
                        )}
                        {t.clanRequests.actionAccept}
                    </Button>
                </div>
            </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default RequestTabContent;