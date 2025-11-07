'use client';

import React from 'react';
// Kita pakai CogsIcon karena di PostForm.tsx sebelumnya menggunakan CogsIcon
// (Ikon ini sudah kita alias-kan ke SettingsIcon di ui-actions.tsx)
import { CogsIcon, LinkIcon, HomeIcon } from '@/app/components/icons'; 
import { FormGroup, getInputClasses } from './PostFormGroup'; // Import utility components
import { PostFormData } from './usePostForm'; // Import the type definitions

// Define props based on what's needed from usePostForm hook
interface BaseBuildingFieldsProps {
  formData: PostFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isFormValid: boolean;
  isBaseBuildingPost: boolean;
}

/**
 * Komponen modular untuk field input spesifik kategori 'Base Building'.
 * Ditampilkan secara kondisional di PostForm.
 */
const BaseBuildingFields: React.FC<BaseBuildingFieldsProps> = ({
  formData,
  handleInputChange,
  isFormValid,
  isBaseBuildingPost,
}) => {
  // Jika bukan postingan Base Building, jangan render apa-apa.
  if (!isBaseBuildingPost) return null;

  // Cek validitas kondisional untuk menampilkan error field.
  const hasLinkError = !isFormValid && isBaseBuildingPost && !formData.baseImageUrl.trim() && !formData.baseLinkUrl.trim();

  return (
    <div className="space-y-6 pt-6 border-t border-coc-gold-dark/20 mt-6">
      <h3 className="text-xl font-clash text-coc-gold-dark flex items-center">
        {/* Menggunakan CogsIcon (Alias dari SettingsIcon) */}
        <CogsIcon className="h-5 w-5 mr-2" /> Detail Base (Minimal satu wajib diisi)
      </h3>

      {/* Base Image URL */}
      <FormGroup
        label="Base Image URL (Imgur/Hosting Lain)"
        htmlFor="baseImageUrl"
        error={
          hasLinkError
            ? 'Wajib diisi jika tidak ada Base Link URL'
            : null
        }
      >
        <input
          type="url"
          id="baseImageUrl"
          value={formData.baseImageUrl}
          onChange={handleInputChange}
          placeholder="Contoh: https://i.imgur.com/your-image.png"
          className={getInputClasses(hasLinkError)}
        />
        <p className="text-xs text-gray-500 font-sans mt-1">
          URL gambar base dari hosting (misalnya Imgur). Anda bisa mengunggah gambar dan mendapatkan URL di{' '}
          <a
            href="https://imgur.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coc-gold hover:underline"
          >
            imgur.com
          </a>
          .
        </p>
      </FormGroup>

      {/* Base Link URL */}
      <FormGroup
        label="Base Link URL (Clash of Clans Link)"
        htmlFor="baseLinkUrl"
        error={
          hasLinkError
            ? 'Wajib diisi jika tidak ada Base Image URL'
            : null
        }
      >
        <input
          type="url"
          id="baseLinkUrl"
          value={formData.baseLinkUrl}
          onChange={handleInputChange}
          placeholder="Contoh: https://link.clashofclans.com/en?action=OpenLayout&id=..."
          className={getInputClasses(hasLinkError)}
        />
        <p className="text-xs text-gray-500 font-sans mt-1">
          Link base dari Clash of Clans (dimulai dengan
          `https://link.clashofclans.com/`).
        </p>
      </FormGroup>
    </div>
  );
};

export default BaseBuildingFields;