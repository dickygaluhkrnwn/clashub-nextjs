'use client';

import React from 'react';
import { CogsIcon } from '@/app/components/icons'; 
import { FormGroup, getInputClasses } from './PostFormGroup';
import { PostFormData } from './usePostForm';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface BaseBuildingFieldsProps {
  formData: PostFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isFormValid: boolean;
  isBaseBuildingPost: boolean;
}

const BaseBuildingFields: React.FC<BaseBuildingFieldsProps> = ({
  formData,
  handleInputChange,
  isFormValid,
  isBaseBuildingPost,
}) => {
  const { language } = useLanguage();

  if (!isBaseBuildingPost) return null;

  const hasLinkError = !isFormValid && isBaseBuildingPost && !formData.baseImageUrl.trim() && !formData.baseLinkUrl.trim();

  return (
    <div className="space-y-6 pt-6 border-t border-white/10 mt-6 animate-in fade-in slide-in-from-top-2">
      <h3 className="text-lg font-clash text-coc-gold flex items-center mb-4">
        <CogsIcon className="h-5 w-5 mr-2" /> 
        {language === 'id' ? 'Detail Base (Minimal satu wajib diisi)' : 'Base Details (At least one required)'}
      </h3>

      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
        {/* Base Image URL */}
        <FormGroup
          label={language === 'id' ? "URL Gambar Base (Imgur)" : "Base Image URL (Imgur)"}
          htmlFor="baseImageUrl"
          error={
            hasLinkError
              ? (language === 'id' ? 'Wajib diisi jika tidak ada Base Link URL' : 'Required if no Base Link URL')
              : null
          }
          helperText={
            <p className="text-xs text-gray-500 font-sans mt-1">
              {language === 'id' 
                ? 'URL gambar base dari Imgur (format: .png, .jpg).'
                : 'Direct image URL from Imgur (format: .png, .jpg).'}
            </p>
          }
        >
          <input
            type="url"
            id="baseImageUrl"
            value={formData.baseImageUrl}
            onChange={handleInputChange}
            placeholder="https://i.imgur.com/..."
            className={getInputClasses(hasLinkError)}
          />
        </FormGroup>

        {/* Base Link URL */}
        <FormGroup
          label={language === 'id' ? "Link Salin Base" : "Base Copy Link"}
          htmlFor="baseLinkUrl"
          error={
            hasLinkError
              ? (language === 'id' ? 'Wajib diisi jika tidak ada Base Image URL' : 'Required if no Base Image URL')
              : null
          }
          helperText={
            <p className="text-xs text-gray-500 font-sans mt-1">
              {language === 'id' 
                ? 'Link base dari Clash of Clans (dimulai dengan `https://link.clashofclans.com/`).'
                : 'Clash of Clans base link (starts with `https://link.clashofclans.com/`).'}
            </p>
          }
        >
          <input
            type="url"
            id="baseLinkUrl"
            value={formData.baseLinkUrl}
            onChange={handleInputChange}
            placeholder="https://link.clashofclans.com/en?action=OpenLayout..."
            className={getInputClasses(hasLinkError)}
          />
        </FormGroup>
      </div>
    </div>
  );
};

export default BaseBuildingFields;