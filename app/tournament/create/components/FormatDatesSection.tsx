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
    // (dari CreateTournamentClient.tsx baris 438)
    <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
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
      <FormGroup
        label="Tanggal & Waktu Mulai"
        htmlFor="startsAt"
        error={errors.startsAt}
      >
        <input
          type="datetime-local"
          id="startsAt"
          name="startsAt"
          value={formData.startsAt}
          onChange={handleChange}
          className={getInputClasses(!!errors.startsAt)}
          disabled={isLoading}
        />
      </FormGroup>
      <FormGroup
        label="Tanggal & Waktu Selesai"
        htmlFor="endsAt"
        error={errors.endsAt}
      >
        <input
          type="datetime-local"
          id="endsAt"
          name="endsAt"
          value={formData.endsAt}
          onChange={handleChange}
          className={getInputClasses(!!errors.endsAt)}
          disabled={isLoading}
        />
      </FormGroup>
    </div>
  );
};