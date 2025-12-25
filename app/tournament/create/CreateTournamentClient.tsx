'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, Tournament, ThRequirement } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { TournamentFormData, FormErrors } from './types';
import { 
  TrophyIcon, 
  SaveIcon, 
  RefreshCwIcon 
} from '@/app/components/icons';

// Impor komponen-komponen UI
import { BasicInfoSection } from './components/BasicInfoSection';
import { FormatDatesSection } from './components/FormatDatesSection';
import { ThRequirementsSection } from './components/ThRequirementsSection';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface CreateTournamentClientProps {
  userProfile: UserProfile;
}

// Helpers
const getLocalDateTimeString = (dateObj: Date): string => {
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
};

const addHours = (date: Date, hours: number) => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};
const addDays = (date: Date, days: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const CreateTournamentClient: React.FC<CreateTournamentClientProps> = ({
  userProfile,
}) => {
  const { t, language } = useLanguage();
  const router = useRouter();

  // [FIX] Menggunakan t.tournamentCreate secara langsung karena kita sudah tau interfacenya
  const tc = t.tournamentCreate;

  const now = new Date();
  const defaultRegStarts = addHours(now, 1);
  const defaultRegEnds = addDays(defaultRegStarts, 1);
  const defaultTournStarts = addHours(defaultRegEnds, 1);
  const defaultTournEnds = addDays(defaultTournStarts, 2);

  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    description: '',
    rules: '',
    prizePool: '',
    bannerUrl: '',
    registrationStartsAt: getLocalDateTimeString(defaultRegStarts),
    registrationEndsAt: getLocalDateTimeString(defaultRegEnds),
    tournamentStartsAt: getLocalDateTimeString(defaultTournStarts),
    tournamentEndsAt: getLocalDateTimeString(defaultTournEnds),
    format: '5v5',
    participantCount: 16,
    thRequirementType: 'any',
    thMinLevel: 1,
    thMaxLevel: 17,
    thUniformLevel: 17,
    thMixedLevels: ['', '', '', '', ''],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | ('1v1' | '5v5') = value;

    if (type === 'number') {
      finalValue = value === '' ? 0 : parseInt(value, 10);
      if (finalValue < 0) finalValue = 0;
    }
    
    if (name === 'format') {
      finalValue = value as '1v1' | '5v5';
      if (finalValue === '1v1') {
        setFormData((prev) => ({ ...prev, thRequirementType: 'any' }));
      }
    }
    
    if (name === 'participantCount') finalValue = parseInt(value, 10);
    if (name === 'thRequirementType') finalValue = value as 'any' | 'uniform' | 'mixed';

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name as keyof FormErrors]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleMixedThChange = (index: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newThLevels = [...formData.thMixedLevels];
    newThLevels[index] = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, thMixedLevels: newThLevels }));
    if (errors.thMixedLevels) setErrors((prev) => ({ ...prev, thMixedLevels: null }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const {
      title, description, rules, prizePool,
      registrationStartsAt, registrationEndsAt,
      tournamentStartsAt, tournamentEndsAt,
      thMinLevel, thMaxLevel, format, thRequirementType, thMixedLevels,
    } = formData;

    if (!title.trim()) newErrors.title = tc.errTitle;
    if (!description.trim()) newErrors.description = tc.errDesc;
    if (!rules.trim()) newErrors.rules = tc.errDesc;
    if (!prizePool.trim()) newErrors.prizePool = tc.errDesc;

    if (!registrationStartsAt) newErrors.registrationStartsAt = tc.errDates;
    if (!registrationEndsAt) newErrors.registrationEndsAt = tc.errDates;
    if (!tournamentStartsAt) newErrors.tournamentStartsAt = tc.errDates;
    if (!tournamentEndsAt) newErrors.tournamentEndsAt = tc.errDates;

    if (registrationStartsAt && registrationEndsAt && tournamentStartsAt && tournamentEndsAt) {
      const regEnds = new Date(registrationEndsAt);
      const regStarts = new Date(registrationStartsAt);
      const tournStarts = new Date(tournamentStartsAt);
      const tournEnds = new Date(tournamentEndsAt);

      if (regEnds <= regStarts) newErrors.registrationEndsAt = tc.errDates;
      if (tournStarts <= regEnds) newErrors.tournamentStartsAt = tc.errDates;
      if (tournEnds <= tournStarts) newErrors.tournamentEndsAt = tc.errDates;
    }

    if (thMinLevel < 1 || thMinLevel > 17) newErrors.thMinLevel = tc.errTh;
    if (thMaxLevel < 1 || thMaxLevel > 17) newErrors.thMaxLevel = tc.errTh;
    if (thMaxLevel < thMinLevel) newErrors.thMaxLevel = tc.errTh;

    if (format === '5v5' && thRequirementType === 'mixed') {
      if (thMixedLevels.some((lvl) => lvl === '')) newErrors.thMixedLevels = tc.errTh;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!validateForm()) {
      setNotification({
        message: t.auth.fixFormErrors,
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsLoading(true);

    type TournamentPayload = Omit<Tournament, 'id' | 'createdAt' | 'participantCountCurrent' | 'status'>;

    const thRequirement: ThRequirement = {
      type: formData.format === '1v1' ? 'any' : formData.thRequirementType,
      minLevel: Number(formData.thMinLevel),
      maxLevel: Number(formData.thMaxLevel),
      allowedLevels: [],
    };

    if (formData.format === '5v5') {
      if (formData.thRequirementType === 'uniform') {
        thRequirement.allowedLevels = [Number(formData.thUniformLevel)];
      } else if (formData.thRequirementType === 'mixed') {
        thRequirement.allowedLevels = formData.thMixedLevels.map((lvl) => Number(lvl));
      }
    }

    const payload: TournamentPayload = {
      title: formData.title,
      description: formData.description,
      rules: formData.rules,
      prizePool: formData.prizePool,
      bannerUrl: formData.bannerUrl || 'https://placehold.co/1200x400/374151/9CA3AF?text=Banner+Turnamen',
      
      registrationStartsAt: new Date(formData.registrationStartsAt),
      registrationEndsAt: new Date(formData.registrationEndsAt),
      tournamentStartsAt: new Date(formData.tournamentStartsAt),
      tournamentEndsAt: new Date(formData.tournamentEndsAt),

      format: formData.format,
      teamSize: formData.format === '1v1' ? 1 : 5,
      participantCount: Number(formData.participantCount),
      thRequirement: thRequirement,
      organizerUid: userProfile.uid,
      organizerName: userProfile.displayName,
      committeeUids: [],
      panitiaClanA_Tag: null,
      panitiaClanB_Tag: null,
    };

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.common.error);
      }

      setNotification({
        message: tc.successTitle,
        type: 'success',
        onClose: () => setNotification(null),
      });

      setTimeout(() => {
        router.push('/tournament');
      }, 2000);
    } catch (error) {
      setNotification({
        message: (error as Error).message,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {notification && <Notification notification={notification} />}

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Header - Bersih Tanpa Tombol Back */}
        <header className="mb-8 flex items-center justify-center text-center">
           <div>
              <h1 className="text-3xl md:text-4xl font-clash text-white flex items-center justify-center gap-3">
                 <TrophyIcon className="h-8 w-8 text-coc-gold" />
                 {/* [FIX] Gunakan tc.pageTitle yang sesuai dengan interface */}
                 {tc.pageTitle}
              </h1>
              <p className="text-gray-400 mt-1 font-sans">
                 {tc.pageDesc}
              </p>
           </div>
        </header>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl space-y-10"
          noValidate
        >
          
          {/* Section 1: Basic Info */}
          <div className="space-y-6">
             <BasicInfoSection
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                isLoading={isLoading}
             />
          </div>

          <div className="border-t border-white/10" />

          {/* Section 2: Format & Dates */}
          <div className="space-y-6">
             <FormatDatesSection
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                isLoading={isLoading}
             />
          </div>

          <div className="border-t border-white/10" />

          {/* Section 3: TH Requirements */}
          <div className="space-y-6">
             <ThRequirementsSection
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                handleMixedThChange={handleMixedThChange}
                isLoading={isLoading}
             />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="border-white/10 hover:bg-white/5"
            >
              {t.common.cancel}
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
              className="shadow-lg shadow-coc-gold/10"
            >
              {isLoading ? (
                 <>
                   <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" />
                   {tc.btnSubmitting}
                 </>
              ) : (
                 <>
                   <SaveIcon className="h-5 w-5 mr-2" />
                   {language === 'id' ? 'Terbitkan' : 'Publish'}
                 </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTournamentClient;