'use client';

import React from 'react';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { TournamentFormData, FormErrors } from '../types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

// Opsi TH 1-17 untuk dropdown
const thLevelOptions = Array.from({ length: 17 }, (_, i) => 17 - i); // [17, 16, ..., 1]

interface ThRequirementsSectionProps {
  formData: TournamentFormData;
  errors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleMixedThChange: (
    index: number,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  isLoading: boolean;
}

/**
 * @component ThRequirementsSection
 * Komponen "dumb" terpisah untuk field persyaratan Town Hall.
 */
export const ThRequirementsSection: React.FC<ThRequirementsSectionProps> = ({
  formData,
  errors,
  handleChange,
  handleMixedThChange,
  isLoading,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook

  return (
    <fieldset className="card-form-section space-y-4">
      <legend className="form-legend">{t.tournamentCreate.stepTh}</legend> {/* [i18n] Syarat TH */}
      
      {/* Rentang Umum */}
      <div className="grid grid-cols-2 gap-6">
        <FormGroup
          label={t.tournamentCreate.labelMinTh} // [i18n]
          htmlFor="thMinLevel"
          error={errors.thMinLevel}
        >
          <input
            type="number"
            id="thMinLevel"
            name="thMinLevel"
            value={formData.thMinLevel}
            onChange={handleChange}
            className={getInputClasses(!!errors.thMinLevel)}
            disabled={isLoading}
            min="1"
            max="17"
          />
        </FormGroup>
        <FormGroup
          label={t.tournamentCreate.labelMaxTh} // [i18n]
          htmlFor="thMaxLevel"
          error={errors.thMaxLevel}
        >
          <input
            type="number"
            id="thMaxLevel"
            name="thMaxLevel"
            value={formData.thMaxLevel}
            onChange={handleChange}
            className={getInputClasses(!!errors.thMaxLevel)}
            disabled={isLoading}
            min="1"
            max="17"
          />
        </FormGroup>
      </div>
      <p className="text-xs text-gray-500 font-sans -mt-2">
        {/* [i18n] Menggunakan label generik "Level TH yang Diizinkan" sebagai helper */}
        {t.tournamentCreate.labelThLevel} (Min: {formData.thMinLevel}, Max: {formData.thMaxLevel})
      </p>

      {/* Opsi Khusus 5v5 */}
      {formData.format === '5v5' && (
        <div className="space-y-4 pt-4 border-t border-coc-gold-dark/20">
          <FormGroup
            label={t.tournamentCreate.labelThMode} // [i18n]
            htmlFor="thRequirementType"
            error={errors.thRequirementType}
          >
            <select
              id="thRequirementType"
              name="thRequirementType"
              value={formData.thRequirementType}
              onChange={handleChange}
              className={getInputClasses(!!errors.thRequirementType)}
              disabled={isLoading}
            >
              <option value="any">{t.tournamentCreate.optionAny}</option> {/* [i18n] */}
              <option value="uniform">{t.tournamentCreate.optionUniform}</option> {/* [i18n] */}
              <option value="mixed">{t.tournamentCreate.optionMixed}</option> {/* [i18n] */}
            </select>
          </FormGroup>

          {/* Opsi jika 'Seragam' */}
          {formData.thRequirementType === 'uniform' && (
            <FormGroup
              label={t.tournamentCreate.optionUniform} // [i18n] Reuse label
              htmlFor="thUniformLevel"
              error={errors.thUniformLevel}
            >
              <select
                id="thUniformLevel"
                name="thUniformLevel"
                value={formData.thUniformLevel}
                onChange={handleChange}
                className={getInputClasses(!!errors.thUniformLevel)}
                disabled={isLoading}
              >
                {thLevelOptions
                  .filter(
                    (lvl) =>
                      lvl >= formData.thMinLevel &&
                      lvl <= formData.thMaxLevel,
                  )
                  .map((lvl) => (
                    <option key={lvl} value={lvl}>
                      TH {lvl}
                    </option>
                  ))}
              </select>
            </FormGroup>
          )}

          {/* Opsi jika 'Campuran' */}
          {formData.thRequirementType === 'mixed' && (
            <FormGroup
              label={t.tournamentCreate.optionMixed} // [i18n] Reuse label
              htmlFor="thMixedLevel-0"
              error={errors.thMixedLevels}
            >
              <div className="grid grid-cols-5 gap-2">
                {formData.thMixedLevels.map((lvl, index) => (
                  <select
                    key={index}
                    id={`thMixedLevel-${index}`}
                    name={`thMixedLevel-${index}`}
                    value={lvl}
                    onChange={(e) => handleMixedThChange(index, e)}
                    className={getInputClasses(!!errors.thMixedLevels)}
                    disabled={isLoading}
                  >
                    <option value="">TH?</option>
                    {thLevelOptions
                      .filter(
                        (lvl) =>
                          lvl >= formData.thMinLevel &&
                          lvl <= formData.thMaxLevel,
                      )
                      .map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                  </select>
                ))}
              </div>
            </FormGroup>
          )}
        </div>
      )}
    </fieldset>
  );
};