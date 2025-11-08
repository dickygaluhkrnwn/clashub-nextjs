'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, Tournament } from '@/lib/types'; // Impor tipe data
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
// Impor helper form konsisten dari project Anda
import {
  FormGroup,
  getInputClasses,
} from '@/app/knowledge-hub/components/form/PostFormGroup';
// Asumsi path ikon (saya lihat file icons.tsx ada di project)
import { UploadIcon } from '@/app/components/icons';

// Tipe untuk props komponen ini
interface CreateTournamentClientProps {
  userProfile: UserProfile;
}

// Tipe untuk state form
type TournamentFormData = {
  name: string;
  description: string;
  rules: string;
  prizePool: string;
  format: string;
  teamSize: number;
  maxParticipants: number;
  startDate: string; // Akan menggunakan <input type="datetime-local">
  bannerUrl: string; // TODO: Akan di-handle oleh file upload
};

// Tipe untuk error validasi
type FormErrors = {
  [key in keyof TournamentFormData]?: string | null;
};

/**
 * @component CreateTournamentClient
 * Komponen Klien ('use client') yang berisi form interaktif
 * untuk membuat turnamen baru.
 */
const CreateTournamentClient: React.FC<CreateTournamentClientProps> = ({
  userProfile,
}) => {
  const router = useRouter();

  // State untuk data form
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    rules: '',
    prizePool: '',
    format: '5v5',
    teamSize: 5,
    maxParticipants: 16,
    startDate: '',
    bannerUrl: '', // Nanti akan diisi oleh URL Firebase Storage
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

    let finalValue: string | number = value;

    // Konversi input number
    if (type === 'number') {
      finalValue = value === '' ? 0 : parseInt(value, 10);
      if (finalValue < 0) finalValue = 0; // Pastikan tidak negatif
    }
    // Input datetime-local akan memberikan string
    if (type === 'datetime-local') {
      finalValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    // Hapus error saat pengguna mulai mengetik
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // --- 2. Handler Validasi Form ---
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nama turnamen wajib diisi.';
    if (!formData.description.trim())
      newErrors.description = 'Deskripsi wajib diisi.';
    if (!formData.rules.trim()) newErrors.rules = 'Aturan wajib diisi.';
    if (!formData.prizePool.trim())
      newErrors.prizePool = 'Info hadiah wajib diisi.';
    if (formData.teamSize <= 0)
      newErrors.teamSize = 'Ukuran tim harus lebih dari 0.';
    if (formData.maxParticipants <= 1)
      newErrors.maxParticipants = 'Partisipan maksimal harus lebih dari 1.';
    if (!formData.startDate)
      newErrors.startDate = 'Tanggal mulai wajib diisi.';
    
    // TODO: Validasi Banner Upload
    // if (!formData.bannerUrl) newErrors.bannerUrl = 'Banner wajib di-upload.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // True jika tidak ada error
  };

  // --- 3. Handler Submit Form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Jalankan validasi
    if (!validateForm()) {
      setNotification({
        message: 'Gagal. Harap periksa kembali form, ada data yang belum valid.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsLoading(true);

    // Siapkan payload sesuai interface Tournament (Omit metadata)
    // Ini adalah tipe yang diharapkan oleh createTournamentAdmin yang kita buat
    type TournamentPayload = Omit<
      Tournament,
      'id' | 'createdAt' | 'participantCount'
    >;

    const payload: TournamentPayload = {
      ...formData,
      teamSize: Number(formData.teamSize),
      maxParticipants: Number(formData.maxParticipants),
      startDate: new Date(formData.startDate), // Konversi string datetime-local ke objek Date
      status: 'UPCOMING', // Default status
      organizerId: userProfile.uid,
      organizerName: userProfile.displayName,
      // Gunakan placeholder jika bannerUrl masih kosong
      bannerUrl:
        formData.bannerUrl ||
        'https://placehold.co/1200x400/374151/9CA3AF?text=Banner+Turnamen',
    };

    try {
      // Panggil API route yang akan kita buat selanjutnya (Tahap 2, Poin 3)
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal membuat turnamen.');
      }

      // Sukses!
      setNotification({
        message: 'Turnamen berhasil dibuat! Mengalihkan...',
        type: 'success',
        onClose: () => setNotification(null),
      });

      // Reset form (opsional, karena kita akan redirect)
      setErrors({});

      // Redirect ke halaman utama turnamen setelah sukses
      setTimeout(() => {
        router.push('/tournament');
      }, 2000); // Tunggu 2 detik agar notifikasi terbaca
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
      {/* Container untuk notifikasi (toast) */}
      {notification && <Notification notification={notification} />}

      {/* Form Utama */}
      <form
        onSubmit={handleSubmit}
        className="card-stone p-6 md:p-8 space-y-6"
        noValidate
      >
        {/* Placeholder untuk Upload Banner */}
        <FormGroup label="Banner Turnamen" htmlFor="bannerUrl">
          <div
            className={`flex items-center justify-center w-full h-48 rounded-md border-2 border-dashed ${
              errors.bannerUrl
                ? 'border-coc-red'
                : 'border-coc-gold-dark/50'
            } bg-coc-stone/30 text-gray-400`}
          >
            <div className="text-center">
              <UploadIcon className="h-10 w-10 mx-auto" />
              <p className="mt-2 text-sm">
                Klik untuk upload banner (1200x400 disarankan)
              </p>
              <p className="text-xs text-gray-500">
                (Fitur upload sedang dalam pengembangan)
              </p>
            </div>
            {/* <input type="file" id="bannerUrl" name="bannerUrl" className="hidden" /> */}
          </div>
        </FormGroup>

        {/* Info Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup
            label="Nama Turnamen"
            htmlFor="name"
            error={errors.name}
          >
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={getInputClasses(!!errors.name)}
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

        {/* Detail Teknis (Format, Ukuran, Slot, Tanggal) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <FormGroup
            label="Format (Cth: 5v5)"
            htmlFor="format"
            error={errors.format}
          >
            <input
              type="text"
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
              className={getInputClasses(!!errors.format)}
              disabled={isLoading}
            />
          </FormGroup>
          <FormGroup
            label="Ukuran Tim"
            htmlFor="teamSize"
            error={errors.teamSize}
          >
            <input
              type="number"
              id="teamSize"
              name="teamSize"
              value={formData.teamSize}
              onChange={handleChange}
              className={getInputClasses(!!errors.teamSize)}
              disabled={isLoading}
              min="1"
            />
          </FormGroup>
          <FormGroup
            label="Maks. Partisipan (Tim)"
            htmlFor="maxParticipants"
            error={errors.maxParticipants}
          >
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              className={getInputClasses(!!errors.maxParticipants)}
              disabled={isLoading}
              min="2"
            />
          </FormGroup>
          <FormGroup
            label="Tanggal & Waktu Mulai"
            htmlFor="startDate"
            error={errors.startDate}
          >
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={getInputClasses(!!errors.startDate)}
              disabled={isLoading}
            />
          </FormGroup>
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-4 pt-6 border-t border-coc-gold-dark/20">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()} // Kembali ke halaman sebelumnya
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