import React from 'react';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { TournamentFormData, FormErrors } from '../types'; // Impor dari types.ts

// Tipe untuk props komponen ini
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
  return (
    // [ROMBAK V2] Detail Teknis (Format, Slot, Tanggal)
    // [UPDATE V2.1 / FASE 7.2] Grid diubah menjadi 2x3 untuk 4 input tanggal
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormGroup
        label="Format Turnamen"
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
          <option value="5v5">5 vs 5 (Tim)</option>
          <option value="1v1">1 vs 1 (Solo)</option>
        </select>
      </FormGroup>
      <FormGroup
        label="Jumlah Partisipan (Tim/Player)"
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
          <option value={8}>8 Tim/Player</option>
          <option value={16}>16 Tim/Player</option>
          <option value={32}>32 Tim/Player</option>
          <option value={64}>64 Tim/Player</option>
        </select>
      </FormGroup>

      {/* --- [UPDATE FASE 7.2] Input Tanggal Baru --- */}
      <FormGroup
        label="Pendaftaran Dibuka"
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
        label="Pendaftaran Ditutup"
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
        label="Turnamen Dimulai (Match Pertama)"
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
        label="Turnamen Selesai (Final)"
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
      {/* --- [AKHIR UPDATE FASE 7.2] --- */}
    </div>
  );
};