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
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon
} from '@/app/components/icons';
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
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="relative">
            <div className="absolute inset-0 bg-coc-gold/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin relative z-10" />
        </div>
        <p className="text-gray-400 font-medium animate-pulse mt-4 font-mono tracking-widest">{t.common.loading}</p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]">
        <div className="bg-coc-red/10 p-4 rounded-full mb-4 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
        </div>
        <p className="text-xl font-clash text-white mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-6">{error.message}</p>
        <Button onClick={() => mutateRequests()} variant="secondary" size="sm" className="bg-white/5 hover:bg-white/10 border-white/10">
          <RefreshCwIcon className='h-4 w-4 mr-2' /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- Empty State ---
  if (!joinRequests || joinRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed">
        <div className="bg-[#15171e] p-6 rounded-full mb-6 relative group border border-white/5 shadow-xl">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MailOpenIcon className="h-12 w-12 text-gray-500 opacity-50 relative z-10 group-hover:text-coc-gold transition-colors" />
        </div>
        <p className="text-2xl font-clash text-white mb-2 tracking-wide">
          {t.clanRequests.noRequests}
        </p>
        <p className="text-sm text-gray-400 font-mono max-w-xs">
           Check back later for new membership requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#15171e]/40 rounded-xl border border-white/5 backdrop-blur-sm">
        <h3 className="text-lg font-clash text-white tracking-wide">Pending Requests</h3>
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Total</span>
            <span className="text-sm bg-coc-gold/10 text-coc-gold px-3 py-0.5 rounded-full font-bold border border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                {joinRequests.length}
            </span>
        </div>
      </div>

      <div className="grid gap-4">
        {joinRequests.map((request) => (
            <div
            key={request.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#15171e]/60 backdrop-blur-md p-5 shadow-lg transition-all hover:border-coc-gold/30 hover:bg-[#1a1a1a] hover:-translate-y-1"
            >
            {/* Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-coc-gold to-transparent group-hover:w-1.5 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-coc-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-3">
                
                {/* User Info */}
                <div className="flex items-start md:items-center gap-5 w-full md:w-auto">
                    <div className="relative shrink-0">
                        <Image
                            src={request.requesterProfile.avatarUrl || '/images/placeholder-avatar.png'}
                            alt={request.requesterProfile.displayName}
                            width={64}
                            height={64}
                            className="rounded-xl border border-white/10 bg-black shadow-xl object-cover"
                        />
                        {request.requesterProfile.thLevel > 0 && (
                            <div className="absolute -bottom-2 -right-2 bg-black/90 text-[10px] text-coc-gold px-1.5 py-0.5 rounded border border-coc-gold/30 font-bold shadow-md">
                                TH {request.requesterProfile.thLevel}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-xl font-clash text-white group-hover:text-coc-gold transition-colors">{request.requesterProfile.displayName}</h4>
                            {request.requesterProfile.isVerified && (
                                <span className="bg-coc-blue/10 text-coc-blue text-[9px] px-2 py-0.5 rounded-full border border-coc-blue/20 font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                    Verified
                                </span>
                            )}
                        </div>
                        
                        {request.requesterProfile.playerTag && (
                            <p className="text-xs text-coc-gold/80 font-mono mb-1">{request.requesterProfile.playerTag}</p>
                        )}
                        
                        <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5 mt-1 inline-block max-w-full">
                            <p className="text-sm text-gray-300 italic line-clamp-2 font-sans">
                                "{request.message || 'I would like to join your clan!'}"
                            </p>
                        </div>
                        
                        <p className="text-[10px] text-gray-600 mt-2 font-mono uppercase tracking-widest">
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
                        className="flex-1 md:flex-none justify-center bg-white/5 hover:bg-coc-red/10 hover:text-coc-red hover:border-coc-red/30 transition-all h-10"
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
                        className="flex-1 md:flex-none justify-center bg-coc-gold hover:bg-coc-gold-dark text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all h-10 border-0"
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