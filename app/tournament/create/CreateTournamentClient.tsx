'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// [ROMBAK V2] Impor Tipe Baru (Tournament & ThRequirement)
import { UserProfile, Tournament, ThRequirement } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
import { LinkIcon } from '@/app/components/icons';

// Opsi TH 1-17 untuk dropdown
const thLevelOptions = Array.from({ length: 17 }, (_, i) => 17 - i); // [17, 16, ..., 1]

// Tipe untuk props komponen ini
interface CreateTournamentClientProps {
  userProfile: UserProfile;
}

// [ROMBAK V2] Tipe state form disesuaikan Peta Develop
type TournamentFormData = {
  title: string;
  description: string;
  rules: string;
  prizePool: string;
  bannerUrl: string;
  startsAt: string; // Tanggal & Jam Mulai
  endsAt: string; // Tanggal & Jam Selesai
  format: '1v1' | '5v5';
  participantCount: number; // Jumlah Tim (8, 16, 32, 64)

  // State untuk membangun ThRequirement
  thRequirementType: 'any' | 'uniform' | 'mixed';
  thMinLevel: number;
  thMaxLevel: number;
  thUniformLevel: number; // Jika type 'uniform'
  thMixedLevels: (number | string)[]; // Array 5 TH jika type 'mixed'
};

// Tipe untuk error validasi
type FormErrors = {
  [key in keyof TournamentFormData]?: string | null;
} & {
  thMixedLevels?: string | null; // Error khusus untuk array
};

/**
 * @component CreateTournamentClient
 * [ROMBAK V2] Form panitia yang fleksibel untuk membuat turnamen.
 */
const CreateTournamentClient: React.FC<CreateTournamentClientProps> = ({
  userProfile,
}) => {
  const router = useRouter();

  // [ROMBAK V2] State default baru
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    description: '',
    rules: '',
    prizePool: '',
    bannerUrl: '',
    startsAt: '',
    endsAt: '',
    format: '5v5',
    participantCount: 16,
    thRequirementType: 'any',
    thMinLevel: 1,
    thMaxLevel: 17,
    thUniformLevel: 17, // Default ke TH tertinggi
    thMixedLevels: ['', '', '', '', ''], // Default 5 dropdown kosong
  });

  // State untuk validasi error
  const [errors, setErrors] = useState<FormErrors>({});
  // State untuk UI feedback (loading & notifikasi)
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  // --- 1. Handler Perubahan Input ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    let finalValue: string | number | ('1v1' | '5v5') = value;

    // Konversi input number
    if (type === 'number') {
      finalValue = value === '' ? 0 : parseInt(value, 10);
      if (finalValue < 0) finalValue = 0;
    }
    // Konversi format
    if (name === 'format') {
      finalValue = value as '1v1' | '5v5';
      // Reset aturan 5v5 jika ganti ke 1v1
      if (finalValue === '1v1') {
        setFormData((prev) => ({
          ...prev,
          thRequirementType: 'any',
        }));
      }
    }
    // Konversi participantCount
    if (name === 'participantCount') {
      finalValue = parseInt(value, 10);
    }
    // Konversi Tipe TH
    if (name === 'thRequirementType') {
      finalValue = value as 'any' | 'uniform' | 'mixed';
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    // Hapus error saat pengguna mulai mengetik
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handler khusus untuk 5 input TH 'mixed'
  const handleMixedThChange = (
    index: number,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newThLevels = [...formData.thMixedLevels];
    newThLevels[index] = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, thMixedLevels: newThLevels }));
    // Hapus error
    if (errors.thMixedLevels) {
      setErrors((prev) => ({ ...prev, thMixedLevels: null }));
    }
  };

  // --- 2. Handler Validasi Form ---
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const {
      title,
      description,
      rules,
      prizePool,
      startsAt,
      endsAt,
      thMinLevel,
      thMaxLevel,
      format,
      thRequirementType,
      thMixedLevels,
    } = formData;

    if (!title.trim()) newErrors.title = 'Nama turnamen wajib diisi.';
    if (!description.trim()) newErrors.description = 'Deskripsi wajib diisi.';
    if (!rules.trim()) newErrors.rules = 'Aturan wajib diisi.';
    if (!prizePool.trim()) newErrors.prizePool = 'Info hadiah wajib diisi.';
    if (!startsAt) newErrors.startsAt = 'Tanggal & jam mulai wajib diisi.';
    if (!endsAt) newErrors.endsAt = 'Tanggal & jam selesai wajib diisi.';

    if (new Date(endsAt) <= new Date(startsAt)) {
      newErrors.endsAt = 'Tanggal selesai harus setelah tanggal mulai.';
    }

    if (thMinLevel < 1 || thMinLevel > 17)
      newErrors.thMinLevel = 'Min TH harus antara 1-17.';
    if (thMaxLevel < 1 || thMaxLevel > 17)
      newErrors.thMaxLevel = 'Max TH harus antara 1-17.';
    if (thMaxLevel < thMinLevel)
      newErrors.thMaxLevel = 'Max TH tidak boleh lebih kecil dari Min TH.';

    // Validasi aturan 5v5
    if (format === '5v5' && thRequirementType === 'mixed') {
      if (thMixedLevels.some((lvl) => lvl === '')) {
        newErrors.thMixedLevels = 'Semua 5 level TH wajib diisi untuk mode Campuran.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 3. Handler Submit Form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!validateForm()) {
      setNotification({
        message: 'Gagal. Harap periksa kembali form, ada data yang belum valid.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsLoading(true);

    // [ROMBAK V2] Tipe payload baru dari 'lib/clashub.types.ts'
    type TournamentPayload = Omit<
      Tournament,
      'id' | 'createdAt' | 'participantCountCurrent' | 'status'
    >;

    // Membangun Objek ThRequirement
    const thRequirement: ThRequirement = {
      type: formData.format === '1v1' ? 'any' : formData.thRequirementType,
      minLevel: Number(formData.thMinLevel),
      maxLevel: Number(formData.thMaxLevel),
      allowedLevels: [], // Default array kosong
    };

    if (formData.format === '5v5') {
      if (formData.thRequirementType === 'uniform') {
        thRequirement.allowedLevels = [Number(formData.thUniformLevel)];
      } else if (formData.thRequirementType === 'mixed') {
        thRequirement.allowedLevels = formData.thMixedLevels.map((lvl) =>
          Number(lvl),
        );
      }
    }

    const payload: TournamentPayload = {
      title: formData.title,
      description: formData.description,
      rules: formData.rules,
      prizePool: formData.prizePool,
      bannerUrl:
        formData.bannerUrl ||
        'https://placehold.co/1200x400/374151/9CA3AF?text=Banner+Turnamen',
      startsAt: new Date(formData.startsAt), // Konversi string datetime-local ke objek Date
      endsAt: new Date(formData.endsAt), // [BARU] Tambah tanggal selesai
      format: formData.format,
      teamSize: formData.format === '1v1' ? 1 : 5, // [FIX] Otomatis
      participantCount: Number(formData.participantCount), // [FIX] Nama field baru
      thRequirement: thRequirement, // [FIX] Objek baru
      organizerUid: userProfile.uid,
      organizerName: userProfile.displayName,
      committeeUids: [], // [BARU] Default array kosong
    };

    try {
      // Panggil API route
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat turnamen.');
      }

      setNotification({
        message: 'Turnamen berhasil dibuat! Mengalihkan...',
        type: 'success',
        onClose: () => setNotification(null),
      });

      setTimeout(() => {
        router.push('/tournament');
      }, 2000);
    } catch (error) {
      setNotification({
        message: (error as Error).message,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. Render JSX ---
  return (
    <>
      {notification && <Notification notification={notification} />}

      <form
        onSubmit={handleSubmit}
        className="card-stone p-6 md:p-8 space-y-6"
        noValidate
      >
        {/* ... (Input Banner URL tidak berubah, biarkan saja) ... */}
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

        {/* Info Utama */}
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

        {/* Deskripsi & Aturan */}
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

        {/* [ROMBAK V2] Detail Teknis (Format, Slot, Tanggal) */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
          <FormGroup
            label="Format Turnamen"
            htmlFor="format"
            error={errors.format}
          >
            <select
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
              className={getInputClasses(!!errors.format)}
              disabled={isLoading}
            >
              <option value="5v5">5 vs 5 (Tim)</option>
              <option value="1v1">1 vs 1 (Solo)</option>
            </select>
          </FormGroup>
          <FormGroup
            label="Jumlah Partisipan (Tim/Player)"
            htmlFor="participantCount"
            error={errors.participantCount}
          >
            <select
              id="participantCount"
              name="participantCount"
              value={formData.participantCount}
              onChange={handleChange}
              className={getInputClasses(!!errors.participantCount)}
              disabled={isLoading}
            >
              <option value={8}>8 Tim/Player</option>
              <option value={16}>16 Tim/Player</option>
              <option value={32}>32 Tim/Player</option>
              <option value={64}>64 Tim/Player</option>
            </select>
          </FormGroup>
          <FormGroup
            label="Tanggal & Waktu Mulai"
            htmlFor="startsAt"
            error={errors.startsAt}
          >
            <input
              type="datetime-local"
              id="startsAt"
              name="startsAt"
              value={formData.startsAt}
              onChange={handleChange}
              className={getInputClasses(!!errors.startsAt)}
              disabled={isLoading}
            />
          </FormGroup>
          <FormGroup
            label="Tanggal & Waktu Selesai"
            htmlFor="endsAt"
            error={errors.endsAt}
          >
            <input
              type="datetime-local"
              id="endsAt"
              name="endsAt"
              value={formData.endsAt}
              onChange={handleChange}
              className={getInputClasses(!!errors.endsAt)}
              disabled={isLoading}
            />
          </FormGroup>
        </div>

        {/* [ROMBAK V2] Persyaratan TH Fleksibel */}
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

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-4 pt-6 border-t border-coc-gold-dark/20">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Membuat...' : 'Buat Turnamen'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateTournamentClient;