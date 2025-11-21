'use client';

import React from 'react';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
// Gunakan import dari barrel file icons agar lebih aman
import { LinkIcon } from '@/app/components/icons'; 
import { TournamentFormData, FormErrors } from '../types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface BasicInfoSectionProps {
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
 * @component BasicInfoSection
 * Komponen "dumb" terpisah untuk field info dasar turnamen.
 * (Banner, Judul, Hadiah, Deskripsi, Aturan)
 */
export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  errors,
  handleChange,
  isLoading,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook

  return (
    <>
      {/* Input Banner URL */}
      <FormGroup
        label={t.tournamentCreate.labelBanner} // [i18n]
        htmlFor="bannerUrl"
        error={errors.bannerUrl}
      >
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5">
            <LinkIcon className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="url"
            id="bannerUrl"
            name="bannerUrl"
            value={formData.bannerUrl}
            onChange={handleChange}
            className={`${getInputClasses(!!errors.bannerUrl)} !pl-10`}
            placeholder={t.tournamentCreate.placeholderBanner} // [i18n]
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-gray-500 font-sans mt-2">
          {/* [i18n] Menggunakan instruksi Imgur yang sudah ada di modul Banners */}
          {t.clanBanners.alertImgDesc}
        </p>
      </FormGroup>

      {/* Info Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup
          label={t.tournamentCreate.labelTitle} // [i18n]
          htmlFor="title"
          error={errors.title}
        >
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={getInputClasses(!!errors.title)}
            placeholder={t.tournamentCreate.placeholderTitle} // [i18n]
            disabled={isLoading}
          />
        </FormGroup>
        <FormGroup
          label={t.tournamentCreate.labelPrize} // [i18n]
          htmlFor="prizePool"
          error={errors.prizePool}
        >
          <input
            type="text"
            id="prizePool"
            name="prizePool"
            value={formData.prizePool}
            onChange={handleChange}
            className={getInputClasses(!!errors.prizePool)}
            placeholder={t.tournamentCreate.placeholderPrize} // [i18n]
            disabled={isLoading}
          />
        </FormGroup>
      </div>

      {/* Deskripsi & Aturan */}
      <FormGroup
        label={t.tournamentCreate.labelDesc} // [i18n]
        htmlFor="description"
        error={errors.description}
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className={getInputClasses(!!errors.description)}
          placeholder={t.tournamentCreate.placeholderDesc} // [i18n]
          disabled={isLoading}
        />
      </FormGroup>

      <FormGroup
        label={t.tournamentCreate.labelRules} // [i18n]
        htmlFor="rules"
        error={errors.rules}
      >
        <textarea
          id="rules"
          name="rules"
          rows={6}
          value={formData.rules}
          onChange={handleChange}
          className={getInputClasses(!!errors.rules)}
          placeholder={t.tournamentCreate.placeholderRules} // [i18n]
          disabled={isLoading}
        />
      </FormGroup>
    </>
  );
};