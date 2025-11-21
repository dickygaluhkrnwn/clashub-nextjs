'use client';

import React from 'react';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { TournamentFormData, FormErrors } from '../types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface FormatDatesSectionProps {
  formData: TournamentFormData;
  errors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  isLoading: boolean;
}

/**
 * @component FormatDatesSection
 * Komponen "dumb" terpisah untuk field teknis turnamen.
 * (Format, Jumlah Partisipan, Tanggal Mulai, Tanggal Selesai)
 */
export const FormatDatesSection: React.FC<FormatDatesSectionProps> = ({
  formData,
  errors,
  handleChange,
  isLoading,
}) => {
  const { t, language } = useLanguage(); // [BARU] Init Hook

  // Helper teks sederhana untuk opsi dropdown
  const txtTeam = language === 'id' ? 'Tim' : 'Team';
  const txtSolo = 'Solo';
  const txtEntity = language === 'id' ? 'Tim/Pemain' : 'Teams/Players';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormGroup
        label={t.tournamentCreate.labelFormat} // [i18n]
        htmlFor="format"
        error={errors.format}
      >
        <select
          id="format"
          name="format"
          value={formData.format}
          onChange={handleChange}
          className={getInputClasses(!!errors.format)}
          disabled={isLoading}
        >
          <option value="5v5">5 vs 5 ({txtTeam})</option>
          <option value="1v1">1 vs 1 ({txtSolo})</option>
        </select>
      </FormGroup>

      <FormGroup
        label={t.tournamentCreate.labelParticipantCount} // [i18n]
        htmlFor="participantCount"
        error={errors.participantCount}
      >
        <select
          id="participantCount"
          name="participantCount"
          value={formData.participantCount}
          onChange={handleChange}
          className={getInputClasses(!!errors.participantCount)}
          disabled={isLoading}
        >
          <option value={8}>8 {txtEntity}</option>
          <option value={16}>16 {txtEntity}</option>
          <option value={32}>32 {txtEntity}</option>
          <option value={64}>64 {txtEntity}</option>
        </select>
      </FormGroup>

      {/* Input Tanggal */}
      <FormGroup
        label={t.tournamentCreate.labelRegStart} // [i18n]
        htmlFor="registrationStartsAt"
        error={errors.registrationStartsAt}
      >
        <input
          type="datetime-local"
          id="registrationStartsAt"
          name="registrationStartsAt"
          value={formData.registrationStartsAt}
          onChange={handleChange}
          className={getInputClasses(!!errors.registrationStartsAt)}
          disabled={isLoading}
        />
      </FormGroup>
      <FormGroup
        label={t.tournamentCreate.labelRegEnd} // [i18n]
        htmlFor="registrationEndsAt"
        error={errors.registrationEndsAt}
      >
        <input
          type="datetime-local"
          id="registrationEndsAt"
          name="registrationEndsAt"
          value={formData.registrationEndsAt}
          onChange={handleChange}
          className={getInputClasses(!!errors.registrationEndsAt)}
          disabled={isLoading}
        />
      </FormGroup>
      <FormGroup
        label={t.tournamentCreate.labelTourStart} // [i18n]
        htmlFor="tournamentStartsAt"
        error={errors.tournamentStartsAt}
      >
        <input
          type="datetime-local"
          id="tournamentStartsAt"
          name="tournamentStartsAt"
          value={formData.tournamentStartsAt}
          onChange={handleChange}
          className={getInputClasses(!!errors.tournamentStartsAt)}
          disabled={isLoading}
        />
      </FormGroup>
      <FormGroup
        label={t.tournamentCreate.labelTourEnd} // [i18n]
        htmlFor="tournamentEndsAt"
        error={errors.tournamentEndsAt}
      >
        <input
          type="datetime-local"
          id="tournamentEndsAt"
          name="tournamentEndsAt"
          value={formData.tournamentEndsAt}
          onChange={handleChange}
          className={getInputClasses(!!errors.tournamentEndsAt)}
          disabled={isLoading}
        />
      </FormGroup>
    </div>
  );
};