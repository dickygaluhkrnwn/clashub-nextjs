'use client';

import React from 'react';
import { InfoIcon } from '@/app/components/icons';
import { FormGroup, getInputClasses } from './PostFormGroup'; // Import utility components
import { PostFormData } from './usePostForm'; // Import the type definitions

// Define props based on what's needed from usePostForm hook
interface StrategyFieldsProps {
  formData: PostFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isFormValid: boolean;
  isStrategyPost: boolean;
}

/**
 * Komponen modular untuk field input spesifik kategori 'Strategi Serangan'.
 * Ditampilkan secara kondisional di PostForm.
 */
const StrategyFields: React.FC<StrategyFieldsProps> = ({
  formData,
  handleInputChange,
  isFormValid,
  isStrategyPost,
}) => {
  // Jika bukan postingan strategi, jangan render apa-apa.
  if (!isStrategyPost) return null;

  // Cek validitas kondisional untuk menampilkan error field.
  const hasLinkError = !isFormValid && isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim();

  return (
    <div className="space-y-6 pt-6 border-t border-coc-gold-dark/20 mt-6">
      <h3 className="text-xl font-clash text-coc-gold-dark flex items-center">
        <InfoIcon className="h-5 w-5 mr-2" /> Detail Tambahan Strategi (Minimal satu wajib diisi)
      </h3>
      
      {/* Troop Link */}
      <FormGroup
        label="Troop Link (COC API Link)"
        htmlFor="troopLink"
        error={
          hasLinkError
            ? 'Wajib diisi jika tidak ada Video URL'
            : null
        }
      >
        <input
          type="url"
          id="troopLink"
          value={formData.troopLink}
          onChange={handleInputChange}
          placeholder="Contoh: coc://open-troop-link?troop=..."
          className={getInputClasses(hasLinkError)}
        />
        <p className="text-xs text-gray-500 font-sans mt-1">
          Link untuk menyalin kombinasi pasukan langsung ke game (dimulai
          dengan `coc://`).
        </p>
      </FormGroup>
      
      {/* Video URL */}
      <FormGroup
        label="Video URL (YouTube)"
        htmlFor="videoUrl"
        error={
          hasLinkError
            ? 'Wajib diisi jika tidak ada Troop Link'
            : null
        }
      >
        <input
          type="url"
          id="videoUrl"
          value={formData.videoUrl}
          onChange={handleInputChange}
          placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className={getInputClasses(hasLinkError)}
        />
        <p className="text-xs text-gray-500 font-sans mt-1">
          Link ke video YouTube yang menampilkan cara menggunakan strategi
          ini.
        </p>
      </FormGroup>
    </div>
  );
};

export default StrategyFields;