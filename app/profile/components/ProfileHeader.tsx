'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  AlertTriangleIcon,
  ShieldIcon,
  ExternalLinkIcon,
  EditIcon
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ProfileHeaderProps {
  isVerified: boolean;
  displayName: string;
  inGameName: string | null | undefined;
  cocProfileUrl: string | null;
}

/**
 * Komponen Header untuk halaman profil.
 * Desain: Control Bar / Status Dashboard.
 * REVISI: Menghapus identitas nama/avatar utama (sudah ada di Sidebar).
 * Hanya menampilkan status peringatan jika BELUM terverifikasi.
 */
export const ProfileHeader = ({
  isVerified,
  displayName,
  cocProfileUrl,
}: ProfileHeaderProps) => {
  const { t } = useLanguage();

  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#13151b]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
      {/* Side Glow Effect based on status */}
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${!isVerified ? 'from-coc-red to-transparent' : 'from-coc-blue/50 to-transparent'} opacity-80`} />
      
      {/* Left Side: Status Notification (Only for Unverified) or Dashboard Label */}
      <div className="flex items-center w-full md:w-auto">
        {!isVerified ? (
          // TAMPILAN JIKA BELUM TERVERIFIKASI
          <div className="flex items-center gap-4 bg-coc-red/10 border border-coc-red/20 p-3 rounded-xl w-full md:w-auto animate-pulse-slow">
            <div className="bg-coc-red/20 p-2 rounded-full flex-shrink-0">
                <AlertTriangleIcon className="h-6 w-6 text-coc-red" />
            </div>
            <div className="flex flex-col">
                <span className="text-coc-red font-bold leading-tight">{t.profileHeader.unverified}</span>
                <span className="text-xs text-coc-red/70">Hubungkan Player Tag Anda untuk fitur penuh</span>
            </div>
          </div>
        ) : (
           // TAMPILAN JIKA SUDAH TERVERIFIKASI (Clean / Dashboard Label)
           <div className="flex items-center gap-3 opacity-80">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-coc-blue">
                 <ShieldIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Player Dashboard</span>
                 <span className="text-white font-medium text-sm">Welcome back, {displayName}</span>
              </div>
           </div>
        )}
      </div>

      {/* Right Side: Actions Buttons */}
      <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0 relative z-10">
        {cocProfileUrl && (
          <Button
            href={cocProfileUrl}
            target="_blank"
            variant="outline"
            size="sm"
            className="flex-1 md:flex-none border-white/10 hover:border-coc-blue/50 hover:bg-coc-blue/10 text-coc-blue transition-all duration-300"
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" /> 
            {t.profileHeader.viewCocProfile}
          </Button>
        )}
        
        <Button
          href="/profile/edit"
          variant="primary"
          size="sm"
          className={`flex-1 md:flex-none transition-all duration-300 border border-white/10 ${
             !isVerified ? 'bg-coc-red hover:bg-coc-red/80 shadow-coc-red/20' : 'shadow-lg shadow-coc-gold/10'
          }`}
        >
          <EditIcon className="h-4 w-4 mr-2" />
          {isVerified ? t.profileHeader.editVerify : t.profileHeader.editStartVerify}
        </Button>
      </div>
    </header>
  );
};