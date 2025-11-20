'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  InfoIcon,
  XIcon,
  AlertTriangleIcon,
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface ProfileErrorProps {
  error: string | null;
  isMissingProfile: boolean;
  onRetry?: () => void;
}

/**
 * Komponen untuk menampilkan pesan error di halaman profil.
 * Menangani 2 kasus: 'Profil Belum Lengkap' dan 'Error Fatal'.
 */
export const ProfileError = ({
  error,
  isMissingProfile,
  onRetry,
}: ProfileErrorProps) => {
  const { t } = useLanguage(); // [BARU]

  // 1. Kasus Error: Profil belum lengkap (Missing Profile)
  if (isMissingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="card-stone p-8 max-w-md text-center rounded-lg">
          <InfoIcon className="h-12 w-12 text-coc-gold mx-auto mb-4" />
          <h2 className="text-2xl text-coc-gold font-clash mb-4">
            {/* [TERJEMAHAN] */}
            {t.profileError.incompleteTitle}
          </h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button href="/profile/edit" variant="primary">
            {/* [TERJEMAHAN] */}
            <XIcon className="inline h-5 w-5 mr-2" /> {t.profileError.startEdit}
          </Button>
        </div>
      </div>
    );
  }

  // 2. Kasus Error: Error fatal lainnya
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="card-stone p-8 max-w-md text-center rounded-lg">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
        <h2 className="text-2xl text-coc-red font-clash mb-4">
          {/* [TERJEMAHAN] */}
          {t.profileError.errorTitle}
        </h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={onRetry} variant="primary">
          {/* [TERJEMAHAN] */}
          {t.profileError.retry}
        </Button>
      </div>
    </div>
  );
};