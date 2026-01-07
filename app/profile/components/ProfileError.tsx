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
 * Desain: Gaming System Alert Modal.
 */
export const ProfileError = ({
  error,
  isMissingProfile,
  onRetry,
}: ProfileErrorProps) => {
  const { t } = useLanguage();

  const themeColor = isMissingProfile ? 'coc-gold' : 'coc-red';
  const themeBg = isMissingProfile ? 'bg-coc-gold' : 'bg-coc-red';
  const themeBorder = isMissingProfile ? 'border-coc-gold' : 'border-coc-red';
  const themeText = isMissingProfile ? 'text-coc-gold' : 'text-coc-red';

  return (
    <div className="flex justify-center items-center min-h-[50vh] p-4 py-12">
      <div className="bg-[#15171e]/95 backdrop-blur-xl border border-white/10 p-8 max-w-md w-full text-center rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${themeBg} shadow-[0_0_20px_currentColor]`} />
        
        {/* Background Ambient Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20 ${themeBg}`} />

        {isMissingProfile ? (
          <>
            <div className="relative mb-6">
               <div className={`w-20 h-20 bg-[#1a1d26] rounded-full flex items-center justify-center mx-auto ring-2 ring-offset-4 ring-offset-[#15171e] ${themeBorder}/50 shadow-[0_0_30px_rgba(255,215,0,0.2)]`}>
                  <InfoIcon className={`h-10 w-10 ${themeText} drop-shadow-md`} />
               </div>
            </div>
            
            <h2 className="text-2xl text-white font-clash font-bold mb-3 uppercase tracking-wide drop-shadow-md">
              {t.profileError.incompleteTitle}
            </h2>
            
            <p className="text-gray-400 mb-8 text-sm leading-relaxed max-w-[90%] mx-auto">
              {error}
            </p>
            
            <Button 
              href="/profile/edit" 
              variant="primary" 
              className="w-full shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all font-bold tracking-wide"
            >
              <XIcon className="inline h-4 w-4 mr-2" /> {t.profileError.startEdit}
            </Button>
          </>
        ) : (
          <>
            <div className="relative mb-6">
               <div className={`w-20 h-20 bg-[#1a1d26] rounded-full flex items-center justify-center mx-auto ring-2 ring-offset-4 ring-offset-[#15171e] ${themeBorder}/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] animate-pulse-slow`}>
                  <AlertTriangleIcon className={`h-10 w-10 ${themeText} drop-shadow-md`} />
               </div>
            </div>

            <h2 className="text-2xl text-white font-clash font-bold mb-3 uppercase tracking-wide drop-shadow-md">
              {t.profileError.errorTitle}
            </h2>
            
            <p className="text-gray-400 mb-8 text-sm leading-relaxed max-w-[90%] mx-auto bg-white/5 p-3 rounded-lg border border-white/5 font-mono">
              {error}
            </p>
            
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all"
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