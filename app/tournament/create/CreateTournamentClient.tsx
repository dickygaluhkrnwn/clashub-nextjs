'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, Tournament, ThRequirement } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import { TournamentFormData, FormErrors } from './types';

// Impor komponen-komponen UI yang sudah dipecah
import { BasicInfoSection } from './components/BasicInfoSection';
import { FormatDatesSection } from './components/FormatDatesSection';
import { ThRequirementsSection } from './components/ThRequirementsSection';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface CreateTournamentClientProps {
  userProfile: UserProfile;
}

// Helper untuk default tanggal
const getLocalDateTimeString = (dateObj: Date): string => {
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  const localISOTime = new Date(dateObj.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
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

/**
 * @component CreateTournamentClient
 * Form panitia yang fleksibel untuk membuat turnamen.
 */
const CreateTournamentClient: React.FC<CreateTournamentClientProps> = ({
  userProfile,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook
  const router = useRouter();

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
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
        setFormData((prev) => ({
          ...prev,
          thRequirementType: 'any',
        }));
      }
    }
    
    if (name === 'participantCount') {
      finalValue = parseInt(value, 10);
    }
    
    if (name === 'thRequirementType') {
      finalValue = value as 'any' | 'uniform' | 'mixed';
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleMixedThChange = (
    index: number,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newThLevels = [...formData.thMixedLevels];
    newThLevels[index] = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, thMixedLevels: newThLevels }));
    if (errors.thMixedLevels) {
      setErrors((prev) => ({ ...prev, thMixedLevels: null }));
    }
  };

  // --- Validasi Form dengan i18n ---
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const {
      title,
      description,
      rules,
      prizePool,
      registrationStartsAt,
      registrationEndsAt,
      tournamentStartsAt,
      tournamentEndsAt,
      thMinLevel,
      thMaxLevel,
      format,
      thRequirementType,
      thMixedLevels,
    } = formData;

    if (!title.trim()) newErrors.title = t.tournamentCreate.errTitle; // [i18n]
    if (!description.trim()) newErrors.description = t.tournamentCreate.errDesc; // [i18n]
    if (!rules.trim()) newErrors.rules = t.tournamentCreate.errDesc; // [i18n] Reuse desc or add new key
    if (!prizePool.trim()) newErrors.prizePool = t.tournamentCreate.errDesc; // [i18n] Reuse desc or add new key

    if (!registrationStartsAt) newErrors.registrationStartsAt = t.tournamentCreate.errDates;
    if (!registrationEndsAt) newErrors.registrationEndsAt = t.tournamentCreate.errDates;
    if (!tournamentStartsAt) newErrors.tournamentStartsAt = t.tournamentCreate.errDates;
    if (!tournamentEndsAt) newErrors.tournamentEndsAt = t.tournamentCreate.errDates;

    if (registrationStartsAt && registrationEndsAt && tournamentStartsAt && tournamentEndsAt) {
      const regEnds = new Date(registrationEndsAt);
      const regStarts = new Date(registrationStartsAt);
      const tournStarts = new Date(tournamentStartsAt);
      const tournEnds = new Date(tournamentEndsAt);

      if (regEnds <= regStarts) {
        newErrors.registrationEndsAt = t.tournamentCreate.errDates;
      }
      if (tournStarts <= regEnds) {
        newErrors.tournamentStartsAt = t.tournamentCreate.errDates;
      }
      if (tournEnds <= tournStarts) {
        newErrors.tournamentEndsAt = t.tournamentCreate.errDates;
      }
    }

    if (thMinLevel < 1 || thMinLevel > 17)
      newErrors.thMinLevel = t.tournamentCreate.errTh;
    if (thMaxLevel < 1 || thMaxLevel > 17)
      newErrors.thMaxLevel = t.tournamentCreate.errTh;
    if (thMaxLevel < thMinLevel)
      newErrors.thMaxLevel = t.tournamentCreate.errTh;

    if (format === '5v5' && thRequirementType === 'mixed') {
      if (thMixedLevels.some((lvl) => lvl === '')) {
        newErrors.thMixedLevels = t.tournamentCreate.errTh;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!validateForm()) {
      setNotification({
        message: t.auth.fixFormErrors, // [i18n] Reuse auth error
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsLoading(true);

    type TournamentPayload = Omit<
      Tournament,
      'id' | 'createdAt' | 'participantCountCurrent' | 'status'
    >;

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
        thRequirement.allowedLevels = formData.thMixedLevels.map((lvl) =>
          Number(lvl),
        );
      }
    }

    const payload: TournamentPayload = {
      title: formData.title,
      description: formData.description,
      rules: formData.rules,
      prizePool: formData.prizePool,
      bannerUrl:
        formData.bannerUrl ||
        'https://placehold.co/1200x400/374151/9CA3AF?text=Banner+Turnamen',
      
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
        message: t.tournamentCreate.successTitle, // [i18n]
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
    <>
      {notification && <Notification notification={notification} />}

      <form
        onSubmit={handleSubmit}
        className="card-stone p-6 md:p-8 space-y-6"
        noValidate
      >
        {/* [BARU] Pass 't' ke sub-komponen agar mereka juga bisa translate */}
        {/* Namun karena sub-komponen ini belum di-refactor untuk menerima 't', 
            saya sarankan kita refactor sub-komponennya di langkah selanjutnya agar lebih bersih.
            Untuk sekarang, komponen ini masih menggunakan teks label statis di dalamnya.
        */}
        <BasicInfoSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          isLoading={isLoading}
        />

        <FormatDatesSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          isLoading={isLoading}
        />

        <ThRequirementsSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleMixedThChange={handleMixedThChange}
          isLoading={isLoading}
        />

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-4 pt-6 border-t border-coc-gold-dark/20">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t.tournamentCreate.btnBack} {/* [i18n] */}
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? t.tournamentCreate.btnSubmitting : t.tournamentCreate.btnSubmit} {/* [i18n] */}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateTournamentClient;