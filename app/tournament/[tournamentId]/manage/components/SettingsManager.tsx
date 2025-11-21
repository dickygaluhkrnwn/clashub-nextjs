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
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface SettingsManagerProps {
  tournament: FirestoreDocument<Tournament>;
  onSettingsSaved: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({
  tournament,
  onSettingsSaved,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook
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
      showNotification(t.tournamentManage.settings.errFormat, 'error'); // [i18n]
      setIsLoading(false);
      return;
    }
    if (clanATag === clanBTag) {
      showNotification(t.tournamentManage.settings.errSame, 'error'); // [i18n]
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
        throw new Error(result.error || t.tournamentManage.settings.errSave); // [i18n]
      }

      showNotification(result.message || t.tournamentManage.toastSuccess, 'success');
      onSettingsSaved();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Notification notification={notification ?? undefined} />
      <h3 className="font-clash text-xl text-white">{t.tournamentManage.settings.title}</h3> {/* [i18n] */}
      <p className="text-gray-400 font-sans -mt-4">
        {t.tournamentManage.settings.desc} {/* [i18n] */}
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <FormGroup
          label={t.tournamentManage.settings.labelClanA} // [i18n]
          htmlFor="clanATag"
          error={
            clanATag && !clanATag.startsWith('#')
              ? t.tournamentManage.settings.errFormat // [i18n]
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
          label={t.tournamentManage.settings.labelClanB} // [i18n]
          htmlFor="clanBTag"
          error={
            clanBTag && !clanBTag.startsWith('#')
              ? t.tournamentManage.settings.errFormat // [i18n]
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
            {isLoading ? t.tournamentManage.settings.btnSaving : t.tournamentManage.settings.btnSave} {/* [i18n] */}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;