'use client';

import React from 'react';
import { TournamentFormData, FormErrors } from '../types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { FormGroup, getInputClasses } from './TournamentFormShared'; // Import dari file shared lokal

// Opsi TH 1-17 untuk dropdown
const thLevelOptions = Array.from({ length: 17 }, (_, i) => 17 - i); // [17, 16, ..., 1]

interface ThRequirementsSectionProps {
  formData: TournamentFormData;
  errors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-lg font-clash text-white border-l-4 border-coc-gold pl-3">
        {t.tournamentCreate.stepTh}
      </h3>
      
      {/* Rentang Umum */}
      <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
           {t.tournamentCreate.labelThLevel}
        </h4>
        <div className="grid grid-cols-2 gap-6">
            <FormGroup
              label={t.tournamentCreate.labelMinTh}
              htmlFor="thMinLevel"
              error={errors.thMinLevel}
            >
              <input
                  type="number"
                  id="thMinLevel"
                  name="thMinLevel"
                  value={formData.thMinLevel}
                  onChange={handleChange}
                  className={getInputClasses(!!errors.thMinLevel, isLoading)}
                  disabled={isLoading}
                  min="1"
                  max="17"
              />
            </FormGroup>
            <FormGroup
              label={t.tournamentCreate.labelMaxTh}
              htmlFor="thMaxLevel"
              error={errors.thMaxLevel}
            >
              <input
                  type="number"
                  id="thMaxLevel"
                  name="thMaxLevel"
                  value={formData.thMaxLevel}
                  onChange={handleChange}
                  className={getInputClasses(!!errors.thMaxLevel, isLoading)}
                  disabled={isLoading}
                  min="1"
                  max="17"
              />
            </FormGroup>
        </div>
        <p className="text-xs text-gray-500 font-sans">
            Rentang yang diizinkan: Town Hall {formData.thMinLevel} - {formData.thMaxLevel}
        </p>
      </div>

      {/* Opsi Khusus 5v5 */}
      {formData.format === '5v5' && (
        <div className="space-y-4 pt-2">
          <FormGroup
            label={t.tournamentCreate.labelThMode}
            htmlFor="thRequirementType"
            error={errors.thRequirementType}
          >
            <select
              id="thRequirementType"
              name="thRequirementType"
              value={formData.thRequirementType}
              onChange={handleChange}
              className={`${getInputClasses(!!errors.thRequirementType, isLoading)} appearance-none bg-coc-dark`}
              disabled={isLoading}
            >
              <option value="any">{t.tournamentCreate.optionAny}</option>
              <option value="uniform">{t.tournamentCreate.optionUniform}</option>
              <option value="mixed">{t.tournamentCreate.optionMixed}</option>
            </select>
          </FormGroup>

          {/* Opsi jika 'Seragam' */}
          {formData.thRequirementType === 'uniform' && (
            <div className="p-4 bg-coc-blue/5 border border-coc-blue/10 rounded-xl animate-in fade-in">
                <FormGroup
                  label={t.tournamentCreate.optionUniform}
                  htmlFor="thUniformLevel"
                  error={errors.thUniformLevel}
                  helperText="Semua anggota tim wajib memiliki TH level ini."
                >
                  <select
                      id="thUniformLevel"
                      name="thUniformLevel"
                      value={formData.thUniformLevel}
                      onChange={handleChange}
                      className={`${getInputClasses(!!errors.thUniformLevel, isLoading)} appearance-none bg-coc-dark`}
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
                          Town Hall {lvl}
                          </option>
                      ))}
                  </select>
                </FormGroup>
            </div>
          )}

          {/* Opsi jika 'Campuran' */}
          {formData.thRequirementType === 'mixed' && (
            <div className="p-4 bg-coc-gold/5 border border-coc-gold/10 rounded-xl animate-in fade-in">
                <FormGroup
                  label={`${t.tournamentCreate.optionMixed} (5 Players)`}
                  htmlFor="thMixedLevel-0"
                  error={errors.thMixedLevels}
                  helperText="Tentukan komposisi TH untuk setiap slot pemain (1-5)."
                >
                  <div className="grid grid-cols-5 gap-2">
                      {formData.thMixedLevels.map((lvl, index) => (
                      <div key={index} className="flex flex-col gap-1">
                          <label className="text-[10px] text-center text-gray-500 uppercase font-bold">P{index + 1}</label>
                          <select
                              id={`thMixedLevel-${index}`}
                              name={`thMixedLevel-${index}`}
                              value={lvl}
                              onChange={(e) => handleMixedThChange(index, e)}
                              className={`${getInputClasses(!!errors.thMixedLevels, isLoading)} appearance-none bg-coc-dark px-1 text-center text-sm`}
                              disabled={isLoading}
                          >
                              <option value="">-</option>
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
                      </div>
                      ))}
                  </div>
                </FormGroup>
            </div>
          )}
        </div>
      )}
    </div>
  );
};