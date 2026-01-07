'use client';

import React, { useState } from 'react';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { Loader2Icon, ShieldIcon, SaveIcon, AlertTriangleIcon, SwordsIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface SettingsManagerProps {
  tournament: FirestoreDocument<Tournament>;
  onSettingsSaved: () => void;
}

// Local FormGroup for consistent styling
const FormGroup = ({ label, htmlFor, error, helperText, children }: { label: string, htmlFor: string, error?: string, helperText?: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <label htmlFor={htmlFor} className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-colors group-focus-within:text-coc-gold">
      {label}
    </label>
    <div className="group relative">
        {children}
    </div>
    {helperText && <p className="text-xs text-gray-600 font-sans ml-1">{helperText}</p>}
    {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            <AlertTriangleIcon className="h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
        </div>
    )}
  </div>
);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pt-6 border-t border-white/10">
      {notification && <Notification notification={notification} />}
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
            <h3 className="font-clash text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                   <SwordsIcon className="h-6 w-6 text-coc-gold" />
                </div>
                {t.tournamentManage.settings.title}
            </h3>
            <p className="text-gray-400 text-sm mt-2 font-sans max-w-xl">
              {t.tournamentManage.settings.desc}
            </p>
        </div>
      </div>

      <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-1 h-full bg-coc-gold opacity-50" />
         
         <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Clan Host A */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 p-3 bg-coc-blue/5 border border-coc-blue/20 rounded-xl">
                        <ShieldIcon className="h-5 w-5 text-coc-blue" />
                        <span className="text-coc-blue text-[10px] font-bold uppercase tracking-wider">Upper Bracket Host</span>
                    </div>
                    <FormGroup
                      label={t.tournamentManage.settings.labelClanA}
                      htmlFor="clanATag"
                      error={clanATag && !clanATag.startsWith('#') ? t.tournamentManage.settings.errFormat : undefined}
                      helperText="Host clan for upper bracket / Team A matches"
                    >
                      <Input
                        type="text"
                        id="clanATag"
                        name="clanATag"
                        placeholder="#2QYV0C9P0"
                        value={clanATag}
                        onChange={(e) => setClanATag(e.target.value.toUpperCase())}
                        disabled={isLoading}
                        className="font-mono tracking-wider text-lg"
                      />
                    </FormGroup>
                </div>

                {/* Clan Host B */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 p-3 bg-coc-red/5 border border-coc-red/20 rounded-xl">
                        <ShieldIcon className="h-5 w-5 text-coc-red" />
                        <span className="text-coc-red text-[10px] font-bold uppercase tracking-wider">Lower Bracket Host</span>
                    </div>
                    <FormGroup
                      label={t.tournamentManage.settings.labelClanB}
                      htmlFor="clanBTag"
                      error={clanBTag && !clanBTag.startsWith('#') ? t.tournamentManage.settings.errFormat : undefined}
                      helperText="Host clan for lower bracket / Team B matches"
                    >
                      <Input
                        type="text"
                        id="clanBTag"
                        name="clanBTag"
                        placeholder="#8GV0C2X1"
                        value={clanBTag}
                        onChange={(e) => setClanBTag(e.target.value.toUpperCase())}
                        disabled={isLoading}
                        className="font-mono tracking-wider text-lg"
                      />
                    </FormGroup>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isLoading}
                className="w-full sm:w-auto shadow-lg shadow-coc-gold/10 font-bold tracking-wide px-8"
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
    </div>
  );
};

export default SettingsManager;