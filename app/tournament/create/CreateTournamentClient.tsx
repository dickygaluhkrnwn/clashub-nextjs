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
// [PERBAIKAN] Ganti UploadIcon dengan LinkIcon
import { LinkIcon } from '@/app/components/icons';

// Tipe untuk props komponen ini
interface CreateTournamentClientProps {
  userProfile: UserProfile;
}

// Tipe untuk state form
type TournamentFormData = {
  // [PERBAIKAN] 'name' diubah menjadi 'title' agar konsisten dengan Tipe Data
  title: string;
  description: string;
  rules: string;
  prizePool: string;
  // [BARU] Menambahkan thRequirement untuk sinkronisasi data
  thRequirement: string;
  format: string;
  teamSize: number;
  maxParticipants: number;
  startDate: string; // Akan menggunakan <input type="datetime-local">
  bannerUrl: string;
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
    // [PERBAIKAN] 'name' diubah menjadi 'title'
    title: '',
    description: '',
    rules: '',
    prizePool: '',
    // [BARU] Menambahkan thRequirement, default 'All TH Levels'
    thRequirement: 'All TH Levels',
    format: '5v5',
    teamSize: 5,
    maxParticipants: 16,
    startDate: '',
    bannerUrl: '', // Nanti akan diisi oleh URL Imgur/placeholder
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

    // [PERBAIKAN] Validasi 'title'
    if (!formData.title.trim()) newErrors.title = 'Nama turnamen wajib diisi.';
    if (!formData.description.trim())
      newErrors.description = 'Deskripsi wajib diisi.';
    if (!formData.rules.trim()) newErrors.rules = 'Aturan wajib diisi.';
    if (!formData.prizePool.trim())
      newErrors.prizePool = 'Info hadiah wajib diisi.';
    // [BARU] Validasi 'thRequirement'
    if (!formData.thRequirement.trim())
      newErrors.thRequirement = 'Persyaratan TH wajib diisi.';
    if (formData.teamSize <= 0)
      newErrors.teamSize = 'Ukuran tim harus lebih dari 0.';
    if (formData.maxParticipants <= 1)
      newErrors.maxParticipants = 'Partisipan maksimal harus lebih dari 1.';
    if (!formData.startDate)
      newErrors.startDate = 'Tanggal mulai wajib diisi.';

    // [CATATAN] Kita biarkan validasi banner non-aktif agar
    // placeholder 'placehold.co' bisa digunakan.
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
    // Tipe ini (dari lib/types.ts) sudah kita update dan memiliki 'title' & 'thRequirement'
    type TournamentPayload = Omit<
      Tournament,
      'id' | 'createdAt' | 'participantCount'
    >;

    const payload: TournamentPayload = {
      ...formData,
      // [PERBAIKAN] Pastikan field 'title' dan 'thRequirement' terkirim
      title: formData.title,
      thRequirement: formData.thRequirement,
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
        // [PERBAIKAN] Tampilkan error dari server, atau fallback
        throw new Error(errorData.error || 'Gagal membuat turnamen.');
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
        {/* [PERBAIKAN] Mengganti placeholder Upload Banner dengan Input URL */}
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
              className={`${getInputClasses(
                !!errors.bannerUrl,
              )} !pl-10`} // Tambahkan padding kiri untuk ikon
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
            // [PERBAIKAN] Label dan htmlFor diubah ke 'title'
            label="Nama Turnamen"
            htmlFor="title"
            error={errors.title}
          >
            <input
              type="text"
              // [PERBAIKAN] id, name, value, onChange, className
              // semuanya diubah untuk mereferensikan 'title'
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

        {/* [BARU] Input Persyaratan TH */}
        <FormGroup
          label="Persyaratan TH"
          htmlFor="thRequirement"
          error={errors.thRequirement}
        >
          <select
            id="thRequirement"
            name="thRequirement"
            value={formData.thRequirement}
            onChange={handleChange}
            className={getInputClasses(!!errors.thRequirement)}
            disabled={isLoading}
          >
            {/* Opsi ini diambil dari app/components/filters/TournamentFilter.tsx */}
            <option value="All TH Levels">Semua Level TH</option>
            <option value="TH 16 Only">Hanya TH 16</option>
            <option value="TH 15 - 16">TH 15 - 16</option>
            <option value="TH 14 - 16">TH 14 - 16</option>
            <option value="TH 13 - 14">TH 13 - 14</option>
            <option value="TH 10 - 12">TH 10 - 12</option>
          </select>
        </FormGroup>

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