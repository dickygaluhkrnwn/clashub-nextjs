'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// [ROMBAK V2] Impor Tipe Baru (Tournament & ThRequirement)
import { UserProfile, Tournament, ThRequirement } from '@/lib/types'; // Tetap
import { Button } from '@/app/components/ui/Button'; // Tetap
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification'; // Tetap
import {
  FormGroup,
  // getInputClasses, // [DIHAPUS] Sudah tidak dipakai di sini
} from '@/app/knowledge-hub/components/form/PostFormGroup';
// [DIHAPUS] LinkIcon dipindah ke BasicInfoSection
// import { LinkIcon } from '@/app/components/icons';

// [DIHAPUS] thLevelOptions dipindah ke ThRequirementsSection
// const thLevelOptions = Array.from({ length: 17 }, (_, i) => 17 - i);

// [BARU] Impor tipe dari file terpisah
import { TournamentFormData, FormErrors } from './types';

// [BARU] Impor komponen-komponen UI yang sudah dipecah
import { BasicInfoSection } from './components/BasicInfoSection';
import { FormatDatesSection } from './components/FormatDatesSection';
import { ThRequirementsSection } from './components/ThRequirementsSection';

// Tipe untuk props komponen ini (Tetap)
interface CreateTournamentClientProps {
  userProfile: UserProfile;
}

// [DIHAPUS] Tipe TournamentFormData & FormErrors dipindah ke ./types.ts

/**
 * @component CreateTournamentClient
 * [ROMBAK V2] Form panitia yang fleksibel untuk membuat turnamen.
 * (Sekarang bertindak sebagai "Smart Container" atau "Barrel File")
 */
const CreateTournamentClient: React.FC<CreateTournamentClientProps> = ({
  userProfile,
}) => {
  const router = useRouter();

  // [ROMBAK V2] State default baru (Tetap)
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

  // State untuk validasi error (Tetap)
  const [errors, setErrors] = useState<FormErrors>({});
  // State untuk UI feedback (loading & notifikasi) (Tetap)
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  // --- 1. Handler Perubahan Input --- (Tetap)
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

  // Handler khusus untuk 5 input TH 'mixed' (Tetap)
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

  // --- 2. Handler Validasi Form --- (Tetap)
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

  // --- 3. Handler Submit Form --- (Tetap)
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

  // --- 4. Render JSX [DIREFACTOR] ---
  return (
    <>
      {notification && <Notification notification={notification} />}

      <form
        onSubmit={handleSubmit}
        className="card-stone p-6 md:p-8 space-y-6"
        noValidate
      >
        {/* [BARU] Komponen terpisah untuk Info Dasar, Banner, Deskripsi, Aturan */}
        <BasicInfoSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          isLoading={isLoading}
        />

        {/* [BARU] Komponen terpisah untuk Format, Jumlah, Tanggal */}
        <FormatDatesSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          isLoading={isLoading}
        />

        {/* [BARU] Komponen terpisah untuk Persyaratan TH */}
        <ThRequirementsSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleMixedThChange={handleMixedThChange}
          isLoading={isLoading}
        />

        {/* Tombol Aksi (Tetap) */}
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