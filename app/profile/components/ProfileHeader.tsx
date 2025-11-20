'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  AlertTriangleIcon,
  ShieldIcon,
  ExternalLinkIcon,
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface ProfileHeaderProps {
  isVerified: boolean;
  displayName: string;
  inGameName: string | null | undefined;
  cocProfileUrl: string | null;
}

/**
 * Komponen Header untuk halaman profil.
 * Menampilkan status verifikasi dan tombol aksi (Edit, Link CoC).
 */
export const ProfileHeader = ({
  isVerified,
  displayName,
  inGameName,
  cocProfileUrl,
}: ProfileHeaderProps) => {
  const { t } = useLanguage(); // [BARU]

  return (
    <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6 rounded-lg">
      {/* Status Verifikasi */}
      <div
        className={`flex items-center gap-3 p-2 rounded ${
          isVerified ? 'bg-coc-green/10' : 'bg-coc-red/10'
        }`}
      >
        {isVerified ? (
          <ShieldIcon className="h-6 w-6 text-coc-green flex-shrink-0" />
        ) : (
          <AlertTriangleIcon className="h-6 w-6 text-coc-red flex-shrink-0" />
        )}
        <p className="text-sm font-sans font-semibold text-white">
          {isVerified ? (
            <>
              {/* [TERJEMAHAN] */}
              <span className="font-bold">{t.profileHeader.verified}</span>
              {inGameName && inGameName !== displayName
                ? ` (${inGameName})`
                : ''}
            </>
          ) : (
            <>
              {/* [TERJEMAHAN] */}
              <span className="font-bold">{t.profileHeader.unverified}</span>.
            </>
          )}
        </p>
      </div>

      {/* Tombol Aksi */}
      <div className="flex gap-4 flex-wrap">
        {/* Tombol Lihat Profil CoC (jika terverifikasi) */}
        {cocProfileUrl && (
          <Button
            href={cocProfileUrl}
            target="_blank"
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" /> {t.profileHeader.viewCocProfile}
          </Button>
        )}
        <Button
          href="/profile/edit"
          variant="primary" // Ubah jadi primary untuk edit
          size="sm"
          className="flex-shrink-0"
        >
          {isVerified
            ? t.profileHeader.editVerify
            : t.profileHeader.editStartVerify}
        </Button>
      </div>
    </header>
  );
};