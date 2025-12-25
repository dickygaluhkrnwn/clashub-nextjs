'use client';

import React, { useState } from 'react';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
// Kita gunakan FormGroup dan style dari komponen shared turnamen yang sudah kita buat
import { FormGroup, getInputClasses } from '@/app/tournament/create/components/TournamentFormShared';
import { Loader2Icon, ShieldIcon, SaveIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface SettingsManagerProps {
  tournament: FirestoreDocument<Tournament>;
  onSettingsSaved: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({
  tournament,
  onSettingsSaved,
}) => {
  const { t } = useLanguage();
  const [clanATag, setClanATag] = useState(tournament.panitiaClanA_Tag || '');
  const [clanBTag, setClanBTag] = useState(tournament.panitiaClanB_Tag || '');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

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

    if ((clanATag && !clanATag.startsWith('#')) || (clanBTag && !clanBTag.startsWith('#'))) {
      showNotification(t.tournamentManage.settings.errFormat, 'error');
      setIsLoading(false);
      return;
    }
    
    // Allow saving empty tags (resetting)
    if (clanATag && clanBTag && clanATag === clanBTag) {
      showNotification(t.tournamentManage.settings.errSame, 'error');
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
            panitiaClanA_Tag: clanATag.toUpperCase(),
            panitiaClanB_Tag: clanBTag.toUpperCase(),
          }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.tournamentManage.settings.errSave);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {notification && <Notification notification={notification} />}
      
      <div>
         <h3 className="font-clash text-2xl font-bold text-white flex items-center gap-2">
            <ShieldIcon className="h-6 w-6 text-coc-gold" />
            {t.tournamentManage.settings.title}
         </h3>
         <p className="text-gray-400 font-sans mt-2 leading-relaxed max-w-2xl">
           {t.tournamentManage.settings.desc}
         </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6 p-6 bg-white/5 border border-white/5 rounded-2xl">
        <FormGroup
          label={t.tournamentManage.settings.labelClanA}
          htmlFor="clanATag"
          error={clanATag && !clanATag.startsWith('#') ? t.tournamentManage.settings.errFormat : undefined}
          helperText="Klan Host untuk Bracket Atas / Tim A"
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
              isLoading
            )}
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup
          label={t.tournamentManage.settings.labelClanB}
          htmlFor="clanBTag"
          error={clanBTag && !clanBTag.startsWith('#') ? t.tournamentManage.settings.errFormat : undefined}
          helperText="Klan Host untuk Bracket Bawah / Tim B"
        >
          <input
            type="text"
            id="clanBTag"
            name="clanBTag"
            placeholder="#8GV0C2X1"
            value={clanBTag}
            onChange={(e) => setClanBTag(e.target.value.toUpperCase())}
            className={getInputClasses(
              clanBTag ? !clanBTag.startsWith('#') : false,
              isLoading
            )}
            disabled={isLoading}
          />
        </FormGroup>

        <div className="pt-4 border-t border-white/10">
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading}
            className="w-full shadow-lg shadow-coc-gold/10 font-bold"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
                {t.tournamentManage.settings.btnSaving}
              </>
            ) : (
              <>
                <SaveIcon className="h-5 w-5 mr-2" />
                {t.tournamentManage.settings.btnSave}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;