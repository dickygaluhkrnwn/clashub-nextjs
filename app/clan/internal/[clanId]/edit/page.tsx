'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  ArrowLeftIcon,
  SaveIcon,
  TrashIcon,
  PlusIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  GlobeIcon,
  BookOpenIcon,
  InfoIcon,
} from '@/app/components/icons';
import { ClanSocialLink, ManagedClanDataPayload } from '@/lib/clashub.types';
import useSWR from 'swr'; // SWR untuk mengambil data clan (otorisasi)

// Tipe data untuk form profil
type ClanProfileFormData = {
  profileDescription: string;
  clanRules: string;
  recruitingStatus: 'Open' | 'Invite Only' | 'Closed';
  socialLinks: ClanSocialLink[];
};

// Helper SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * @component EditClanProfilePage
 * Halaman Client Component untuk mengedit profil internal klan.
 */
const EditClanProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const { userProfile, loading: authLoading } = useAuth();
  const clanId = Array.isArray(params.clanId)
    ? params.clanId[0]
    : params.clanId;

  // State untuk Form
  const [formData, setFormData] = useState<ClanProfileFormData>({
    profileDescription: '',
    clanRules: '',
    recruitingStatus: 'Closed',
    socialLinks: [],
  });
  const [clanName, setClanName] = useState<string>('Klan');

  // State untuk UI
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  // 1. Ambil data klan (termasuk ownerUid) untuk otorisasi
  const { data: clanData, isLoading: isClanLoading } =
    useSWR<ManagedClanDataPayload>(
      clanId ? `/api/clan/manage/${clanId}/cache` : null,
      fetcher,
    );

  // 2. Otorisasi Pengguna (Leader)
  useEffect(() => {
    if (authLoading || isClanLoading) {
      return; // Tunggu auth dan data klan selesai loading
    }

    if (!userProfile) {
      // Tidak login
      setIsAuthorized(false);
      return;
    }

    if (clanData?.clan && userProfile.uid === clanData.clan.ownerUid) {
      setIsAuthorized(true);
      setClanName(clanData.clan.name);
    } else {
      setIsAuthorized(false);
    }
  }, [userProfile, authLoading, clanData, isClanLoading]);

  // 3. Ambil data profil yang ada untuk mengisi form
  useEffect(() => {
    if (isAuthorized === true && clanId) {
      setIsLoading(true);
      fetch(`/api/clan/manage/${clanId}/profile`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Gagal mengambil data profil');
          }
          return res.json();
        })
        .then((data: ClanProfileFormData) => {
          setFormData({
            profileDescription: data.profileDescription || '',
            clanRules: data.clanRules || '',
            recruitingStatus: data.recruitingStatus || 'Closed',
            socialLinks: data.socialLinks || [],
          });
        })
        .catch((err) => {
          setNotification({
            message: (err as Error).message,
            type: 'error',
            onClose: () => setNotification(null),
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isAuthorized === false) {
      // Jika tidak terotorisasi, hentikan loading
      setIsLoading(false);
    }
  }, [isAuthorized, clanId]);

  // --- Handler Form ---

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (
    index: number,
    field: 'platform' | 'url',
    value: string,
  ) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index][field] = value;
    setFormData((prev) => ({ ...prev, socialLinks: newLinks }));
  };

  const addSocialLink = () => {
    if (formData.socialLinks.length >= 5) {
      setNotification({
        message: 'Anda hanya dapat menambahkan maksimal 5 link sosial.',
        type: 'warning',
        onClose: () => setNotification(null),
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: '', url: '' }],
    }));
  };

  const removeSocialLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, socialLinks: newLinks }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification({
      message: 'Menyimpan profil klan...',
      type: 'info',
      onClose: () => setNotification(null),
    });

    try {
      const response = await fetch(`/api/clan/manage/${clanId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      setNotification({
        message: 'Profil klan berhasil diperbarui!',
        type: 'success',
        onClose: () => setNotification(null),
      });

      // Kembali ke halaman profil internal setelah berhasil
      router.push(`/clan/internal/${clanId}`);
    } catch (err) {
      setNotification({
        message: (err as Error).message,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Style Kustom untuk Textarea & Select ---
  const sharedInputStyle =
    'flex w-full rounded-md border border-coc-gold-dark/30 bg-coc-dark/70 px-3 py-2 text-sm text-gray-200 font-sans ring-offset-coc-dark file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coc-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  // --- Render ---

  if (isLoading || isAuthorized === null) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
        <div className="flex justify-center items-center h-full flex-col">
          <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mb-3" />
          <p className="text-lg font-clash text-white">Memverifikasi...</p>
        </div>
      </main>
    );
  }

  if (isAuthorized === false) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
        <div className="flex justify-center items-center">
          <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
            <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
            <h2 className="text-2xl text-coc-red font-clash mb-4">
              Akses Ditolak
            </h2>
            <p className="text-gray-300 mb-6 font-sans">
              Anda harus menjadi Leader klan ini untuk mengakses halaman edit.
            </p>
            <Button href={`/clan/internal/${clanId}`} variant="primary">
              Kembali ke Profil Klan
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      <Notification notification={notification ?? undefined} />
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-white font-clash">
            Edit Profil Klan: {clanName}
          </h1>
          <Button
            href={`/clan/internal/${clanId}`}
            variant="secondary"
            size="sm"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Batal
          </Button>
        </div>

        {/* Konten Form */}
        <div className="card-stone p-6 rounded-lg space-y-8">
          {/* Bagian 1: Tentang Kami */}
          <div className="space-y-2">
            <label
              htmlFor="profileDescription"
              className="text-lg font-clash text-coc-gold flex items-center gap-2"
            >
              <InfoIcon className="h-5 w-5" />
              Tentang Klan (Deskripsi)
            </label>
            <p className="text-xs text-gray-400 font-sans">
              Tuliskan deskripsi lengkap tentang klan Anda. Ini akan muncul di
              halaman profil internal klan Anda.
            </p>
            <textarea
              id="profileDescription"
              name="profileDescription"
              rows={5}
              className={`${sharedInputStyle} min-h-[100px]`}
              placeholder="Selamat datang di klan kami..."
              value={formData.profileDescription}
              onChange={handleInputChange}
              disabled={isSaving}
            />
          </div>

          {/* Bagian 2: Aturan Klan */}
          <div className="space-y-2">
            <label
              htmlFor="clanRules"
              className="text-lg font-clash text-coc-gold flex items-center gap-2"
            >
              <BookOpenIcon className="h-5 w-5" />
              Aturan Klan
            </label>
            <p className="text-xs text-gray-400 font-sans">
              Tuliskan aturan-aturan klan Anda. Setiap baris baru akan
              ditampilkan sebagai poin aturan.
            </p>
            <textarea
              id="clanRules"
              name="clanRules"
              rows={5}
              className={`${sharedInputStyle} min-h-[100px]`}
              placeholder="1. Wajib serang war..."
              value={formData.clanRules}
              onChange={handleInputChange}
              disabled={isSaving}
            />
          </div>

          {/* Bagian 3: Status Rekrutmen */}
          <div className="space-y-2">
            <label
              htmlFor="recruitingStatus"
              className="text-lg font-clash text-coc-gold flex items-center gap-2"
            >
              Status Rekrutmen
            </label>
            <p className="text-xs text-gray-400 font-sans">
              Atur status rekrutmen di Clashub (ini tidak mengubah setelan di
              dalam game).
            </p>
            <select
              id="recruitingStatus"
              name="recruitingStatus"
              className={`${sharedInputStyle} h-10`}
              value={formData.recruitingStatus}
              onChange={handleInputChange}
              disabled={isSaving}
            >
              <option value="Open">Open (Terbuka)</option>
              <option value="Invite Only">Invite Only (Hanya Undangan)</option>
              <option value="Closed">Closed (Tutup)</option>
            </select>
          </div>

          {/* Bagian 4: Kontak & Sosial */}
          <div className="space-y-4">
            <h3 className="text-lg font-clash text-coc-gold flex items-center gap-2">
              <GlobeIcon className="h-5 w-5" />
              Kontak & Sosial Media
            </h3>
            {formData.socialLinks.map((link, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-center gap-2"
              >
                <Input
                  type="text"
                  placeholder="Platform (misal: Discord)"
                  value={link.platform}
                  onChange={(e) =>
                    handleSocialLinkChange(index, 'platform', e.target.value)
                  }
                  className="sm:w-1/3"
                  disabled={isSaving}
                  maxLength={20}
                />
                <Input
                  type="text"
                  placeholder="URL (misal: discord.gg/abc)"
                  value={link.url}
                  onChange={(e) =>
                    handleSocialLinkChange(index, 'url', e.target.value)
                  }
                  className="flex-grow"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeSocialLink(index)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.socialLinks.length < 5 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addSocialLink}
                disabled={isSaving}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Link
              </Button>
            )}
          </div>

          {/* Tombol Aksi Simpan */}
          <div className="flex justify-end pt-6 border-t border-coc-gold-dark/30">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCwIcon className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <SaveIcon className="h-5 w-5 mr-2" />
              )}
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
};

export default EditClanProfilePage;