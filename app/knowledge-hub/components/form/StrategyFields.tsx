'use client';

import React from 'react';
import { InfoIcon } from '@/app/components/icons';
import { FormGroup, getInputClasses } from './PostFormGroup';
import { PostFormData } from './usePostForm';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface StrategyFieldsProps {
  formData: PostFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isFormValid: boolean;
  isStrategyPost: boolean;
}

const StrategyFields: React.FC<StrategyFieldsProps> = ({
  formData,
  handleInputChange,
  isFormValid,
  isStrategyPost,
}) => {
  const { t, language } = useLanguage();

  if (!isStrategyPost) return null;

  const hasLinkError = !isFormValid && isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim();

  return (
    <div className="space-y-6 pt-6 border-t border-white/10 mt-6 animate-in fade-in slide-in-from-top-2">
      <h3 className="text-lg font-clash text-coc-gold flex items-center mb-4">
        <InfoIcon className="h-5 w-5 mr-2" /> 
        {language === 'id' ? 'Detail Tambahan (Minimal satu wajib diisi)' : 'Strategy Details (At least one required)'}
      </h3>
      
      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
        {/* Troop Link */}
        <FormGroup
          label="Troop Link (COC API Link)"
          htmlFor="troopLink"
          error={
            hasLinkError
              ? (language === 'id' ? 'Wajib diisi jika tidak ada Video URL' : 'Required if no Video URL')
              : null
          }
          helperText={
            <p>
              {language === 'id' 
                ? 'Link untuk menyalin kombinasi pasukan langsung ke game (dimulai dengan `coc://`).'
                : 'Link to copy army composition directly to game (starts with `coc://`).'}
            </p>
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
        </FormGroup>
        
        {/* Video URL */}
        <FormGroup
          label={t.knowledgeHub.form.labels.youtubeUrl}
          htmlFor="videoUrl"
          error={
            hasLinkError
              ? (language === 'id' ? 'Wajib diisi jika tidak ada Troop Link' : 'Required if no Troop Link')
              : null
          }
          helperText={
            <p>
              {language === 'id' 
                ? 'Link ke video YouTube yang menampilkan cara menggunakan strategi ini.'
                : 'Link to a YouTube video showing this strategy in action.'}
            </p>
          }
        >
          <input
            type="url"
            id="videoUrl"
            value={formData.videoUrl}
            onChange={handleInputChange}
            placeholder={t.knowledgeHub.form.placeholders.youtubeUrl}
            className={getInputClasses(hasLinkError)}
          />
        </FormGroup>
      </div>
    </div>
  );
};

export default StrategyFields;