// File: app/knowledge-hub/components/form/StrategyPostFields.tsx
// Deskripsi: Komponen refactor untuk field khusus 'Strategi Serangan'

import React from 'react';
import FormGroup from './FormGroup';
import { inputClasses } from './form.utils';
import { InfoIcon } from '@/app/components/icons';

interface StrategyPostFieldsProps {
  formData: {
    troopLink: string;
    videoUrl: string;
  };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isFormValid: boolean;
}

const StrategyPostFields: React.FC<StrategyPostFieldsProps> = ({
  formData,
  handleInputChange,
  isFormValid,
}) => {
  // Cek error validasi khusus untuk grup ini
  const hasError =
    !isFormValid &&
    !formData.troopLink.trim() &&
    !formData.videoUrl.trim();

  return (
    <div className="space-y-6 pt-6 border-t border-coc-gold-dark/20 mt-6">
      <h3 className="text-xl font-clash text-coc-gold-dark flex items-center">
        <InfoIcon className="h-5 w-5 mr-2" /> Detail Tambahan Strategi (Minimal
        satu wajib diisi)
      </h3>

      <FormGroup
        label="Troop Link (COC API Link)"
        htmlFor="troopLink"
        error={hasError ? 'Wajib diisi jika tidak ada Video URL' : null}
      >
        <input
          type="url"
          id="troopLink"
          value={formData.troopLink}
          onChange={handleInputChange}
          placeholder="Contoh: coc://open-troop-link?troop=..."
          className={inputClasses(false)} // Error ditangani di level grup
        />
        <p className="text-xs text-gray-500 font-sans mt-1">
          Link untuk menyalin kombinasi pasukan langsung ke game (dimulai dengan
          `coc://`).
        </p>
      </FormGroup>

      <FormGroup
        label="Video URL (YouTube)"
        htmlFor="videoUrl"
        error={hasError ? 'Wajib diisi jika tidak ada Troop Link' : null}
      >
        <input
          type="url"
          id="videoUrl"
          value={formData.videoUrl}
          onChange={handleInputChange}
          placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className={inputClasses(false)} // Error ditangani di level grup
        />
        <p className="text-xs text-gray-500 font-sans mt-1">
          Link ke video YouTube yang menampilkan cara menggunakan strategi ini.
        </p>
      </FormGroup>
    </div>
  );
};

export default StrategyPostFields;