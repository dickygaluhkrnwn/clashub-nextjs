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
  UserIcon,
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

      // Kembali ke halaman profil internal setelah berhasil (opsional, bisa stay di sini)
      // router.push(`/clan/internal/${clanId}`);
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

  // --- Render ---

  if (isLoading || isAuthorized === null) {
    return (
      <main className="min-h-screen bg-coc-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-coc-gold/10 animate-pulse border border-coc-gold/20">
                <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin" />
            </div>
            <p className="text-lg font-clash text-gray-400 tracking-wide animate-pulse">
                Memverifikasi Akses...
            </p>
        </div>
      </main>
    );
  }

  if (isAuthorized === false) {
    return (
      <main className="min-h-screen bg-coc-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
          <div className="inline-flex p-4 rounded-full bg-coc-red/10 mb-6 border border-coc-red/20">
             <AlertTriangleIcon className="h-12 w-12 text-coc-red" />
          </div>
          <h2 className="text-2xl text-white font-clash mb-3 tracking-wide">
            Akses Ditolak
          </h2>
          <p className="text-gray-400 mb-8 font-sans leading-relaxed">
            Anda harus menjadi Leader klan ini untuk dapat mengubah pengaturan profil internal.
          </p>
          <Button href={`/clan/internal/${clanId}`} variant="secondary" className="w-full justify-center">
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Profil
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-coc-dark pb-20 relative">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#2a2a2a] to-coc-dark z-0 pointer-events-none" />
      
      <div className="container mx-auto p-4 md:p-8 relative z-10 pt-10">
        <Notification notification={notification ?? undefined} />
        
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl text-white font-clash tracking-wide drop-shadow-md">
                    Edit Profil: <span className="text-coc-gold">{clanName}</span>
                </h1>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSaving}
                    className="w-full md:w-auto shadow-lg shadow-coc-gold/20"
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

          {/* Konten Form - Unified Card */}
          <div className="bg-gradient-to-b from-[#252525] to-[#1a1a1a] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-10">
            
            {/* Bagian 1: Tentang Kami */}
            <section className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-coc-blue/10 border border-coc-blue/20 shrink-0">
                        <InfoIcon className="h-6 w-6 text-coc-blue" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div>
                            <label htmlFor="profileDescription" className="text-lg font-clash text-white block mb-1">
                                Tentang Klan
                            </label>
                            <p className="text-xs text-gray-400 font-sans leading-relaxed">
                                Deskripsikan visi, misi, dan budaya klan Anda. Teks ini akan menjadi hal pertama yang dilihat calon anggota.
                            </p>
                        </div>
                        <textarea
                            id="profileDescription"
                            name="profileDescription"
                            rows={6}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-coc-blue/50 focus:ring-1 focus:ring-coc-blue/50 transition-all font-sans"
                            placeholder="Contoh: Kami adalah klan war yang santai namun kompetitif. Wajib donasi sebelum request..."
                            value={formData.profileDescription}
                            onChange={handleInputChange}
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </section>

            <div className="h-px w-full bg-white/5" />

            {/* Bagian 2: Aturan Klan */}
            <section className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-coc-red/10 border border-coc-red/20 shrink-0">
                        <BookOpenIcon className="h-6 w-6 text-coc-red" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div>
                            <label htmlFor="clanRules" className="text-lg font-clash text-white block mb-1">
                                Aturan & Regulasi
                            </label>
                            <p className="text-xs text-gray-400 font-sans leading-relaxed">
                                Tuliskan poin-poin penting aturan klan. Gunakan baris baru untuk setiap poin agar mudah dibaca.
                            </p>
                        </div>
                        <textarea
                            id="clanRules"
                            name="clanRules"
                            rows={6}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-coc-red/50 focus:ring-1 focus:ring-coc-red/50 transition-all font-sans"
                            placeholder="1. Dilarang toxic&#10;2. Wajib serang war 2x&#10;3. Donasi minimal 1:3"
                            value={formData.clanRules}
                            onChange={handleInputChange}
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </section>

            <div className="h-px w-full bg-white/5" />

            {/* Bagian 3: Status & Sosial */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Status Rekrutmen */}
                <section className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-coc-green/10 border border-coc-green/20 shrink-0">
                            <UserIcon className="h-6 w-6 text-coc-green" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <label htmlFor="recruitingStatus" className="text-lg font-clash text-white block mb-1">
                                    Status Rekrutmen
                                </label>
                                <p className="text-xs text-gray-400 font-sans">
                                    Menentukan apakah klan sedang mencari anggota baru di Clashub.
                                </p>
                            </div>
                            <div className="relative">
                                <select
                                    id="recruitingStatus"
                                    name="recruitingStatus"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-coc-green/50 focus:ring-1 focus:ring-coc-green/50 transition-all cursor-pointer"
                                    value={formData.recruitingStatus}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                >
                                    <option value="Open">🟢 Open (Sedang Mencari)</option>
                                    <option value="Invite Only">🟡 Invite Only (Selektif)</option>
                                    <option value="Closed">🔴 Closed (Penuh/Tutup)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Kontak & Sosial */}
                <section className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-coc-gold/10 border border-coc-gold/20 shrink-0">
                            <GlobeIcon className="h-6 w-6 text-coc-gold" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="text-lg font-clash text-white block mb-1">
                                    Kontak & Sosial Media
                                </label>
                                <p className="text-xs text-gray-400 font-sans">
                                    Tautkan Discord, Instagram, atau Website klan Anda (Max 5).
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                {formData.socialLinks.map((link, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white/5 p-2 rounded-xl border border-white/5">
                                        <Input
                                            type="text"
                                            placeholder="Platform (e.g. Discord)"
                                            value={link.platform}
                                            onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                            className="w-full sm:w-1/3 bg-black/20 border-transparent focus:border-coc-gold/30 h-10"
                                            disabled={isSaving}
                                            maxLength={20}
                                        />
                                        <Input
                                            type="text"
                                            placeholder="URL (https://...)"
                                            value={link.url}
                                            onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                            className="w-full sm:flex-grow bg-black/20 border-transparent focus:border-coc-gold/30 h-10"
                                            disabled={isSaving}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSocialLink(index)}
                                            disabled={isSaving}
                                            className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 h-10 w-10 flex items-center justify-center rounded-lg"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {formData.socialLinks.length < 5 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={addSocialLink}
                                    disabled={isSaving}
                                    className="w-full border-dashed border-white/20 hover:border-coc-gold/50 hover:text-coc-gold text-xs h-10"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Tambah Link Baru
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

            </div>

          </div>
        </form>
      </div>
    </main>
  );
};

export default EditClanProfilePage;