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
 * Desain: Glassmorphism Card dengan layout responsif.
 */
export const ProfileHeader = ({
  isVerified,
  displayName,
  inGameName,
  cocProfileUrl,
}: ProfileHeaderProps) => {
  const { t } = useLanguage();

  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
      {/* Background Gradient Accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-coc-gold to-transparent opacity-50" />
      
      {/* Status Verifikasi & Nama */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div
          className={`flex items-center justify-center p-3 rounded-full flex-shrink-0 ${
            isVerified 
              ? 'bg-coc-green/10 text-coc-green ring-1 ring-coc-green/30' 
              : 'bg-coc-red/10 text-coc-red ring-1 ring-coc-red/30'
          }`}
        >
          {isVerified ? (
            <ShieldIcon className="h-6 w-6" />
          ) : (
            <AlertTriangleIcon className="h-6 w-6" />
          )}
        </div>
        
        <div className="flex flex-col">
          <h1 className="text-white font-clash text-xl md:text-2xl leading-none mb-1 break-all">
            {displayName}
          </h1>
          <p className="text-sm font-medium text-gray-400 flex items-center flex-wrap gap-1">
            {isVerified ? (
              <>
                <span className="text-coc-green font-bold">{t.profileHeader.verified}</span>
                {inGameName && inGameName !== displayName && (
                  <span className="text-gray-500">• {inGameName}</span>
                )}
              </>
            ) : (
              <span className="text-coc-red font-bold">{t.profileHeader.unverified}</span>
            )}
          </p>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
        {/* Tombol Lihat Profil CoC (jika terverifikasi) */}
        {cocProfileUrl && (
          <Button
            href={cocProfileUrl}
            target="_blank"
            variant="outline"
            size="sm"
            className="flex-1 md:flex-none border-white/10 hover:border-coc-blue/50 hover:bg-coc-blue/10 text-coc-blue"
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" /> 
            {t.profileHeader.viewCocProfile}
          </Button>
        )}
        
        <Button
          href="/profile/edit"
          variant="primary"
          size="sm"
          className="flex-1 md:flex-none shadow-lg shadow-coc-gold/10"
        >
          <EditIcon className="h-4 w-4 mr-2" />
          {isVerified ? t.profileHeader.editVerify : t.profileHeader.editStartVerify}
        </Button>
      </div>
    </header>
  );
};