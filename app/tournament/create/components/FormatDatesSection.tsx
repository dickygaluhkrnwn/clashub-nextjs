'use client';

import React from 'react';
import { TournamentFormData, FormErrors } from '../types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { FormGroup, getInputClasses } from './TournamentFormShared'; // Import dari file shared lokal

interface FormatDatesSectionProps {
  formData: TournamentFormData;
  errors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  isLoading: boolean;
}

export const FormatDatesSection: React.FC<FormatDatesSectionProps> = ({
  formData,
  errors,
  handleChange,
  isLoading,
}) => {
  const { t, language } = useLanguage();

  const txtTeam = language === 'id' ? 'Tim' : 'Team';
  const txtSolo = 'Solo';
  const txtEntity = language === 'id' ? 'Tim/Pemain' : 'Teams/Players';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3">
      <h3 className="text-lg font-clash text-white border-l-4 border-coc-gold pl-3">
        Format & Jadwal
      </h3>

      {/* Format & Kuota */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup
          label={t.tournamentCreate.labelFormat}
          htmlFor="format"
          error={errors.format}
        >
          <select
            id="format"
            name="format"
            value={formData.format}
            onChange={handleChange}
            className={`${getInputClasses(!!errors.format, isLoading)} appearance-none bg-coc-dark`}
            disabled={isLoading}
          >
            <option value="5v5">5 vs 5 ({txtTeam})</option>
            <option value="1v1">1 vs 1 ({txtSolo})</option>
          </select>
        </FormGroup>

        <FormGroup
          label={t.tournamentCreate.labelParticipantCount}
          htmlFor="participantCount"
          error={errors.participantCount}
        >
          <select
            id="participantCount"
            name="participantCount"
            value={formData.participantCount}
            onChange={handleChange}
            className={`${getInputClasses(!!errors.participantCount, isLoading)} appearance-none bg-coc-dark`}
            disabled={isLoading}
          >
            <option value={8}>8 {txtEntity}</option>
            <option value={16}>16 {txtEntity}</option>
            <option value={32}>32 {txtEntity}</option>
            <option value={64}>64 {txtEntity}</option>
          </select>
        </FormGroup>
      </div>

      {/* Tanggal Registrasi */}
      <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
          Periode Registrasi
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup
            label={t.tournamentCreate.labelRegStart}
            htmlFor="registrationStartsAt"
            error={errors.registrationStartsAt}
          >
            <input
              type="datetime-local"
              id="registrationStartsAt"
              name="registrationStartsAt"
              value={formData.registrationStartsAt}
              onChange={handleChange}
              className={getInputClasses(!!errors.registrationStartsAt, isLoading)}
              disabled={isLoading}
            />
          </FormGroup>
          <FormGroup
            label={t.tournamentCreate.labelRegEnd}
            htmlFor="registrationEndsAt"
            error={errors.registrationEndsAt}
          >
            <input
              type="datetime-local"
              id="registrationEndsAt"
              name="registrationEndsAt"
              value={formData.registrationEndsAt}
              onChange={handleChange}
              className={getInputClasses(!!errors.registrationEndsAt, isLoading)}
              disabled={isLoading}
            />
          </FormGroup>
        </div>
      </div>

      {/* Tanggal Turnamen */}
      <div className="p-4 bg-coc-gold/5 border border-coc-gold/10 rounded-xl space-y-4">
        <h4 className="text-sm font-bold text-coc-gold uppercase tracking-wider border-b border-coc-gold/10 pb-2">
          Jadwal Pertandingan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup
            label={t.tournamentCreate.labelTourStart}
            htmlFor="tournamentStartsAt"
            error={errors.tournamentStartsAt}
          >
            <input
              type="datetime-local"
              id="tournamentStartsAt"
              name="tournamentStartsAt"
              value={formData.tournamentStartsAt}
              onChange={handleChange}
              className={getInputClasses(!!errors.tournamentStartsAt, isLoading)}
              disabled={isLoading}
            />
          </FormGroup>
          <FormGroup
            label={t.tournamentCreate.labelTourEnd}
            htmlFor="tournamentEndsAt"
            error={errors.tournamentEndsAt}
          >
            <input
              type="datetime-local"
              id="tournamentEndsAt"
              name="tournamentEndsAt"
              value={formData.tournamentEndsAt}
              onChange={handleChange}
              className={getInputClasses(!!errors.tournamentEndsAt, isLoading)}
              disabled={isLoading}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
};