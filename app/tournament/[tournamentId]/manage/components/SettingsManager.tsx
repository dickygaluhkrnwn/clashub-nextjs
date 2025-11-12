// File: app/tournament/[tournamentId]/manage/components/SettingsManager.tsx
// Deskripsi: [BARU FASE 15.2] Komponen UI untuk form pengaturan klan panitia.

'use client';

import React, { useState } from 'react';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { Loader2Icon, ShieldIcon } from '@/app/components/icons';

interface SettingsManagerProps {
  tournament: FirestoreDocument<Tournament>;
  onSettingsSaved: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({
  tournament,
  onSettingsSaved,
}) => {
  const [clanATag, setClanATag] = useState(tournament.panitiaClanA_Tag || '');
  const [clanBTag, setClanBTag] = useState(tournament.panitiaClanB_Tag || '');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    // Validasi dasar
    if (!clanATag.startsWith('#') || !clanBTag.startsWith('#')) {
      showNotification('Format Tag Klan tidak valid. Harus diawali #.', 'error');
      setIsLoading(false);
      return;
    }
    if (clanATag === clanBTag) {
      showNotification('Tag Klan A dan B tidak boleh sama.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/set-war-clans`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            panitiaClanA_Tag: clanATag,
            panitiaClanB_Tag: clanBTag,
          }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan pengaturan.');
      }

      showNotification(result.message, 'success');
      onSettingsSaved(); // Memberi tahu parent (ManageTournamentClient) untuk refresh data
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Notification notification={notification ?? undefined} />
      <h3 className="font-clash text-xl text-white">Pengaturan Klan Panitia</h3>
      <p className="text-gray-400 font-sans -mt-4">
        Ini adalah 2 klan yang Anda (panitia) kontrol penuh. Semua pertandingan
        akan diselenggarakan di dalam 2 klan ini agar website dapat
        menarik data live war.
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <FormGroup
          label="Tag Klan A Panitia"
          htmlFor="clanATag"
          error={
            clanATag && !clanATag.startsWith('#')
              ? 'Tag harus diawali #'
              : undefined
          }
        >
          <input
            type="text"
            id="clanATag"
            name="clanATag"
            placeholder="#2QYV0C9P0"
            value={clanATag}
            onChange={(e) => setClanATag(e.target.value.toUpperCase())}
            className={getInputClasses(
              clanATag ? !clanATag.startsWith('#') : false,
            )}
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup
          label="Tag Klan B Panitia"
          htmlFor="clanBTag"
          error={
            clanBTag && !clanBTag.startsWith('#')
              ? 'Tag harus diawali #'
              : undefined
          }
        >
          <input
            type="text"
            id="clanBTag"
            name="clanBTag"
            placeholder="#2QYV0C9P0"
            value={clanBTag}
            onChange={(e) => setClanBTag(e.target.value.toUpperCase())}
            className={getInputClasses(
              clanBTag ? !clanBTag.startsWith('#') : false,
            )}
            disabled={isLoading}
          />
        </FormGroup>

        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ShieldIcon className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan Klan'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;