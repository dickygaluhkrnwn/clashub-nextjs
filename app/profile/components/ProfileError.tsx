'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { InfoIcon, XIcon, AlertTriangleIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ProfileErrorProps {
  error: string | null;
  isMissingProfile: boolean;
  onRetry?: () => void;
}

/**
 * Komponen Error/Empty State.
 * Desain: Centered Glass Modal Look.
 */
export const ProfileError = ({
  error,
  isMissingProfile,
  onRetry,
}: ProfileErrorProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 max-w-md w-full text-center rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow Effect */}
        <div 
          className={`absolute top-0 left-0 w-full h-1 ${
            isMissingProfile ? 'bg-coc-gold' : 'bg-coc-red'
          }`} 
        />
        <div 
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isMissingProfile ? 'bg-coc-gold' : 'bg-coc-red'
          }`} 
        />

        {isMissingProfile ? (
          <>
            <div className="w-16 h-16 bg-coc-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-coc-gold/30">
              <InfoIcon className="h-8 w-8 text-coc-gold" />
            </div>
            <h2 className="text-2xl text-white font-clash font-bold mb-3">
              {t.profileError.incompleteTitle}
            </h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              {error}
            </p>
            <Button 
              href="/profile/edit" 
              variant="primary" 
              className="w-full shadow-lg shadow-coc-gold/20"
            >
              <XIcon className="inline h-4 w-4 mr-2" /> {t.profileError.startEdit}
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-coc-red/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-coc-red/30">
              <AlertTriangleIcon className="h-8 w-8 text-coc-red" />
            </div>
            <h2 className="text-2xl text-white font-clash font-bold mb-3">
              {t.profileError.errorTitle}
            </h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              {error}
            </p>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="w-full border-white/10 hover:bg-white/5"
              >
                {t.profileError.retry}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};