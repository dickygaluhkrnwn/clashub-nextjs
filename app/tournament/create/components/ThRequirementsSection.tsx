import React from 'react';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { TournamentFormData, FormErrors } from '../types'; // Impor dari types.ts

// Opsi TH 1-17 untuk dropdown (diambil dari CreateTournamentClient.tsx)
const thLevelOptions = Array.from({ length: 17 }, (_, i) => 17 - i); // [17, 16, ..., 1]

// Tipe untuk props komponen ini
interface ThRequirementsSectionProps {
  formData: TournamentFormData;
  errors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  // Handler khusus dari file utama untuk array 5 TH
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
  return (
    // [ROMBAK V2] Persyaratan TH Fleksibel
    // (dari CreateTournamentClient.tsx baris 526)
    <fieldset className="card-form-section space-y-4">
      <legend className="form-legend">Persyaratan Town Hall</legend>
      {/* Rentang Umum */}
      <div className="grid grid-cols-2 gap-6">
        <FormGroup
          label="TH Minimal"
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
          label="TH Maksimal"
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
        Atur rentang TH umum yang diizinkan untuk mendaftar (Cth: Min 1, Max
        17).
      </p>

      {/* Opsi Khusus 5v5 */}
      {formData.format === '5v5' && (
        <div className="space-y-4 pt-4 border-t border-coc-gold-dark/20">
          <FormGroup
            label="Aturan TH Khusus (5v5)"
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
              <option value="any">Bebas (Sesuai Rentang Min/Max)</option>
              <option value="uniform">Seragam (Semua 5 TH Sama)</option>
              <option value="mixed">Campuran (5 TH Spesifik)</option>
            </select>
          </FormGroup>

          {/* Opsi jika 'Seragam' */}
          {formData.thRequirementType === 'uniform' && (
            <FormGroup
              label="Pilih Level TH Seragam"
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
              label="Tentukan 5 Level TH Campuran"
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
                    <option value="">Pilih TH</option>
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
                ))}
              </div>
            </FormGroup>
          )}
        </div>
      )}
    </fieldset>
  );
};