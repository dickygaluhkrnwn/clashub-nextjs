'use client';

import React from 'react';
import { LinkIcon } from '@/app/components/icons'; 
import { TournamentFormData, FormErrors } from '../types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { FormGroup, getInputClasses } from './TournamentFormShared'; // Import dari file shared lokal

interface BasicInfoSectionProps {
  formData: TournamentFormData;
  errors: FormErrors;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  isLoading: boolean;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  errors,
  handleChange,
  isLoading,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Banner URL */}
      <FormGroup
        label={t.tournamentCreate.labelBanner}
        htmlFor="bannerUrl"
        error={errors.bannerUrl}
      >
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <LinkIcon className="h-4 w-4 text-gray-500" />
          </span>
          <input
            type="url"
            id="bannerUrl"
            name="bannerUrl"
            value={formData.bannerUrl}
            onChange={handleChange}
            className={`${getInputClasses(!!errors.bannerUrl, isLoading)} pl-10`}
            placeholder={t.tournamentCreate.placeholderBanner}
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-gray-500 font-sans mt-2">
          {t.clanBanners.alertImgDesc}
        </p>
      </FormGroup>

      {/* Grid: Title & Prize */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup
          label={t.tournamentCreate.labelTitle}
          htmlFor="title"
          error={errors.title}
        >
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={getInputClasses(!!errors.title, isLoading)}
            placeholder={t.tournamentCreate.placeholderTitle}
            disabled={isLoading}
          />
        </FormGroup>
        
        <FormGroup
          label={t.tournamentCreate.labelPrize}
          htmlFor="prizePool"
          error={errors.prizePool}
        >
          <input
            type="text"
            id="prizePool"
            name="prizePool"
            value={formData.prizePool}
            onChange={handleChange}
            className={getInputClasses(!!errors.prizePool, isLoading)}
            placeholder={t.tournamentCreate.placeholderPrize}
            disabled={isLoading}
          />
        </FormGroup>
      </div>

      {/* Deskripsi */}
      <FormGroup
        label={t.tournamentCreate.labelDesc}
        htmlFor="description"
        error={errors.description}
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className={`${getInputClasses(!!errors.description, isLoading)} resize-y min-h-[80px]`}
          placeholder={t.tournamentCreate.placeholderDesc}
          disabled={isLoading}
        />
      </FormGroup>

      {/* Aturan */}
      <FormGroup
        label={t.tournamentCreate.labelRules}
        htmlFor="rules"
        error={errors.rules}
      >
        <textarea
          id="rules"
          name="rules"
          rows={5}
          value={formData.rules}
          onChange={handleChange}
          className={`${getInputClasses(!!errors.rules, isLoading)} resize-y min-h-[120px]`}
          placeholder={t.tournamentCreate.placeholderRules}
          disabled={isLoading}
        />
      </FormGroup>
    </div>
  );
};