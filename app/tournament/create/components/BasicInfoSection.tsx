import React from 'react';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { LinkIcon } from '@/app/components/icons/ui-general'; // Impor langsung dari file aslinya
import { TournamentFormData, FormErrors } from '../types'; // Impor dari types.ts

// Tipe untuk props komponen ini
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
  return (
    <>
      {/* Input Banner URL (dari CreateTournamentClient.tsx baris 326) */}
      <FormGroup
        label="Banner Turnamen URL (Opsional)"
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
            placeholder="Contoh: https://i.imgur.com/banner.png"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-gray-500 font-sans mt-2">
          <strong>Catatan:</strong> Upload gambar Anda ke{' '}
          <a
            href="https://imgur.com/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coc-primary hover:underline"
          >
            Imgur
          </a>{' '}
          lalu tempel link-nya di sini. Ukuran <strong>1200x400</strong>
          disarankan. Jika dikosongi, placeholder akan digunakan.
        </p>
      </FormGroup>

      {/* Info Utama (dari CreateTournamentClient.tsx baris 358) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup
          label="Nama Turnamen"
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
            placeholder="Cth: Clashub Weekly Series"
            disabled={isLoading}
          />
        </FormGroup>
        <FormGroup
          label="Hadiah (Prize Pool)"
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
            placeholder="Cth: Rp 1.000.000 + 500 Gems"
            disabled={isLoading}
          />
        </FormGroup>
      </div>

      {/* Deskripsi & Aturan (dari CreateTournamentClient.tsx baris 402) */}
      <FormGroup
        label="Deskripsi Singkat"
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
          placeholder="Jelaskan turnamen Anda secara singkat..."
          disabled={isLoading}
        />
      </FormGroup>

      <FormGroup
        label="Peraturan Lengkap"
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
          placeholder="Tuliskan semua aturan, jadwal, dan detail teknis di sini..."
          disabled={isLoading}
        />
      </FormGroup>
    </>
  );
};