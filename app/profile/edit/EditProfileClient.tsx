'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { updateUserProfile } from '@/lib/firestore';
import {
  UserCircleIcon,
  SaveIcon,
  XIcon,
  InfoIcon,
  CheckIcon,
  ShieldIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
  EditIcon
} from '@/app/components/icons';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { AVAILABLE_TH_LEVELS_DESC } from '@/lib/th-utils';

// --- Constants ---
const PLAY_STYLE_OPTIONS: Exclude<UserProfile['playStyle'], null | undefined>[] =
  ['Attacker Utama', 'Base Builder', 'Donatur', 'Strategist'];

const STATIC_AVATARS = [
  '/images/placeholder-avatar.png',
  '/images/barbarian.png',
  '/images/archer.png',
  '/images/giant.png',
  '/images/goblin.png',
  '/images/healer.png',
  '/images/pekka.png',
  '/images/wizard.png',
  '/images/hogrider.png',
  '/images/minion.png',
  '/images/valkyrie.png',
  '/images/witch.png',
  '/images/bowler.png',
  '/images/yeti.png',
  '/images/rootrider.png',
];

type ProfileFormData = Omit<Partial<UserProfile>, 'playStyle' | 'thLevel'> & {
  playStyle?: UserProfile['playStyle'] | '' | null;
  thLevel: number | string;
};

// --- Helpers ---
const validatePlayerTag = (tag: string): string | null => {
  if (!tag) return 'Player Tag wajib diisi.';
  const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/;
  if (!tagRegex.test(tag.toUpperCase()))
    return 'Format Player Tag tidak valid (Contoh: #P9Y8Q2V).';
  return null;
};

// Sanitizes form data before saving to Firestore
const sanitizeDataForFirestore = (
  data: ProfileFormData,
  initialProfile: UserProfile,
): Partial<UserProfile> => {
  const cleanData: Partial<UserProfile> = {};
  const isVerified = initialProfile.isVerified || false;

  Object.keys(data).forEach((keyStr) => {
    const key = keyStr as keyof ProfileFormData;
    let value = data[key];

    if (isVerified && ['playerTag', 'thLevel', 'trophies', 'inGameName'].includes(key)) {
      return;
    }

    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') value = null;
    }

    if (key === 'thLevel') {
      const numValue = Number(value);
      value = isNaN(numValue) || numValue <= 0 ? null : numValue;
    }

    (cleanData as any)[key] = value;
  });

  if (!cleanData.avatarUrl) {
    cleanData.avatarUrl = '/images/placeholder-avatar.png';
  }

  if (isVerified) {
    cleanData.isVerified = initialProfile.isVerified;
    cleanData.lastVerified = initialProfile.lastVerified;
    cleanData.clanTag = initialProfile.clanTag;
    cleanData.clanRole = initialProfile.clanRole;
    cleanData.inGameName = initialProfile.inGameName;
  } else {
    cleanData.isVerified = false;
  }

  if (initialProfile.clanId) cleanData.clanId = initialProfile.clanId;
  if (initialProfile.clanName) cleanData.clanName = initialProfile.clanName;

  Object.keys(cleanData).forEach((key) => {
    if ((cleanData as any)[key] === undefined) {
      delete (cleanData as any)[key];
    }
  });

  return cleanData;
};

// Reusable Input Wrapper
const FormGroup: React.FC<{
  children: ReactNode;
  label: string;
  htmlFor: string;
  error?: string | null;
  disabled?: boolean;
}> = ({ children, label, htmlFor, error, disabled = false }) => (
  <div className="space-y-1.5">
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-bold uppercase tracking-wider ${
        disabled ? 'text-gray-500' : 'text-coc-gold'
      }`}
    >
      {label}{' '}
      {disabled && <span className="text-coc-red/70 normal-case">(Terkunci)</span>}
    </label>
    {children}
    {error && (
      <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 flex items-center gap-1">
        <AlertTriangleIcon className="h-3 w-3" /> {error}
      </p>
    )}
  </div>
);

// --- Main Component ---
interface EditProfileClientProps {
  initialProfile: UserProfile;
}

const EditProfileClient = ({ initialProfile }: EditProfileClientProps) => {
  const router = useRouter();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: initialProfile.displayName || '',
    playerTag: initialProfile.playerTag || '',
    thLevel: initialProfile.thLevel || '',
    bio: initialProfile.bio || '',
    playStyle: initialProfile.playStyle || '',
    activeHours: initialProfile.activeHours || '',
    avatarUrl: initialProfile.avatarUrl || '/images/placeholder-avatar.png',
    discordId: initialProfile.discordId ?? '',
    website: initialProfile.website ?? '',
  });

  const [verificationForm, setVerificationForm] = useState({
    playerTag: initialProfile.playerTag || '',
    apiToken: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const isVerified = initialProfile.isVerified || false;

  useEffect(() => {
    setFormData({
      displayName: initialProfile.displayName || '',
      playerTag: initialProfile.playerTag || '',
      thLevel: initialProfile.thLevel || '',
      bio: initialProfile.bio || '',
      playStyle: initialProfile.playStyle || '',
      activeHours: initialProfile.activeHours || '',
      avatarUrl: initialProfile.avatarUrl || '/images/placeholder-avatar.png',
      discordId: initialProfile.discordId ?? '',
      website: initialProfile.website ?? '',
    });
    if (initialProfile.playerTag) {
      setVerificationForm((prev) => ({
        ...prev,
        playerTag: initialProfile.playerTag!,
      }));
    }
  }, [initialProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    let processedValue = value;

    if (id === 'playerTag') {
      processedValue = value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
      if (value.length > 0 && !processedValue.startsWith('#')) {
        processedValue = '#' + processedValue;
      }
    }

    setFormData((prev) => ({ ...prev, [id]: processedValue }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let processedValue = value;
    const targetKey = id === 'playerTagVerification' ? 'playerTag' : 'apiToken';

    if (targetKey === 'playerTag') {
      processedValue = value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
      if (value.length > 0 && !processedValue.startsWith('#')) {
        processedValue = '#' + processedValue;
      }
    }

    setVerificationForm((prev) => ({ ...prev, [targetKey]: processedValue.trim() }));
    if (errors.verifyTag || errors.verifyToken) {
      setErrors((prev) => ({ ...prev, verifyTag: null, verifyToken: null }));
    }
  };

  const handleVerificationSubmit = async () => {
    const tagError = validatePlayerTag(verificationForm.playerTag);
    const tokenError = !verificationForm.apiToken ? 'API Token wajib diisi.' : null;

    setErrors((prev) => ({ ...prev, verifyTag: tagError, verifyToken: tokenError }));

    if (tagError || tokenError) {
      setNotification({
        message: tagError || tokenError || 'Error validasi.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsVerifying(true);
    setNotification(null);

    try {
      const response = await fetch('/api/coc/verify-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationForm),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Verifikasi gagal.');

      setNotification({
        message: `Verifikasi sukses! Akun ${result.profile.inGameName} ditautkan.`,
        type: 'success',
        onClose: () => setNotification(null),
      });
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Terjadi kesalahan.',
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let validationErrors: Record<string, string | null> = {};
    if (!formData.displayName?.trim()) validationErrors.displayName = 'Nama Tampilan wajib diisi.';
    if (!isVerified && !formData.thLevel) validationErrors.thLevel = 'Level Town Hall wajib dipilih.';
    if (!isVerified) {
      const tagError = validatePlayerTag(formData.playerTag || '');
      if (tagError) validationErrors.playerTag = tagError;
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).some((key) => validationErrors[key] !== null)) {
      setNotification({
        message: 'Harap perbaiki error pada form.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsSaving(true);
    setNotification(null);

    try {
      const dataToSave = sanitizeDataForFirestore(formData, initialProfile);
      await updateUserProfile(initialProfile.uid!, dataToSave);
      setNotification({
        message: 'Profil berhasil diperbarui!',
        type: 'success',
        onClose: () => setNotification(null),
      });
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Gagal menyimpan.',
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Glass Input Styles
  const inputClasses = (hasError: boolean, disabled: boolean = false) =>
    `w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 font-sans
     ${disabled 
        ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed' 
        : 'bg-black/20 border border-white/10 hover:border-coc-gold/50 focus:bg-black/40'
     }
     focus:ring-2 focus:ring-coc-gold/50 focus:border-coc-gold focus:outline-none
     ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
    `;

  return (
    <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden pb-20">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {notification && <Notification notification={notification} />}

      <main className="container mx-auto p-4 md:p-8 mt-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex items-center gap-4">
            <Button href="/profile" variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeftIcon className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Edit E-Sports CV <EditIcon className="h-6 w-6 text-coc-gold" />
              </h1>
              <p className="text-gray-400 text-sm font-sans mt-1">Perbarui data diri dan preferensi bermain Anda.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl space-y-12">
            
            {/* 1. Verification Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldIcon className="h-6 w-6 text-coc-gold" /> Verifikasi Akun
                </h2>
                {isVerified && (
                  <span className="px-3 py-1 bg-coc-green/10 text-coc-green rounded-full text-xs font-bold border border-coc-green/20 flex items-center gap-1">
                    <CheckIcon className="h-3 w-3" /> VERIFIED
                  </span>
                )}
              </div>

              <div className={`p-6 rounded-2xl transition-colors ${
                isVerified ? 'bg-coc-green/5 border border-coc-green/20' : 'bg-white/5 border border-white/10'
              }`}>
                {isVerified ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-coc-green/20 flex items-center justify-center text-coc-green">
                        <CheckIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-sans">Terhubung sebagai:</p>
                        <p className="text-lg font-bold text-white">{initialProfile.inGameName} <span className="text-coc-green font-mono text-sm ml-1">({initialProfile.playerTag})</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-sans">
                        Terakhir dicek: {initialProfile.lastVerified ? new Date(initialProfile.lastVerified).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300 font-sans leading-relaxed">
                      Masukkan Player Tag dan API Token dari pengaturan game Clash of Clans untuk memverifikasi akun Anda. Ini akan membuka fitur manajemen klan dan menampilkan statistik real-time.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="md:col-span-2">
                        <FormGroup label="Player Tag" htmlFor="playerTagVerification" error={errors.verifyTag}>
                          <input
                            id="playerTagVerification"
                            value={verificationForm.playerTag}
                            onChange={handleVerificationChange}
                            placeholder="#P20C8Y9L"
                            className={inputClasses(!!errors.verifyTag, isVerifying)}
                            disabled={isVerifying}
                          />
                        </FormGroup>
                      </div>
                      <div className="md:col-span-2">
                        <FormGroup label="API Token" htmlFor="apiTokenVerification" error={errors.verifyToken}>
                          <input
                            id="apiTokenVerification"
                            value={verificationForm.apiToken}
                            onChange={handleVerificationChange}
                            placeholder="Token dari Settings -> More Settings"
                            className={inputClasses(!!errors.verifyToken, isVerifying)}
                            disabled={isVerifying}
                          />
                        </FormGroup>
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleVerificationSubmit}
                          className="w-full h-[46px] shadow-lg shadow-coc-gold/10"
                          disabled={isVerifying}
                        >
                          {isVerifying ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : 'Verifikasi'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Avatar Selection */}
            <section className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCircleIcon className="h-6 w-6 text-coc-gold" /> Pilih Avatar
                </h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {STATIC_AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: url }))}
                    className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 group ${
                      formData.avatarUrl === url
                        ? 'ring-2 ring-coc-gold shadow-[0_0_20px_rgba(255,215,0,0.3)] scale-105 z-10'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <Image
                      src={url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                    {formData.avatarUrl === url && (
                      <div className="absolute inset-0 bg-coc-gold/20 flex items-center justify-center">
                        <div className="bg-coc-gold rounded-full p-1 shadow-lg">
                          <CheckIcon className="h-3 w-3 text-black" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Detail CV */}
            <section className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <InfoIcon className="h-6 w-6 text-coc-gold" /> Informasi Dasar
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Nama Tampilan" htmlFor="displayName" error={errors.displayName}>
                  <input
                    id="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={inputClasses(!!errors.displayName)}
                    required
                  />
                </FormGroup>

                <FormGroup label="Player Tag (Manual)" htmlFor="playerTag" error={errors.playerTag} disabled={isVerified}>
                  <input
                    id="playerTag"
                    value={formData.playerTag}
                    onChange={handleInputChange}
                    className={inputClasses(!!errors.playerTag, isVerified)}
                    disabled={isVerified}
                    placeholder={isVerified ? "Dikelola otomatis" : "#P20C8Y9L"}
                  />
                </FormGroup>

                <FormGroup label="Town Hall Level" htmlFor="thLevel" error={errors.thLevel} disabled={isVerified}>
                  <select
                    id="thLevel"
                    value={formData.thLevel}
                    onChange={handleInputChange}
                    className={inputClasses(!!errors.thLevel, isVerified)}
                    disabled={isVerified}
                  >
                    <option value="">-- Pilih Level --</option>
                    {AVAILABLE_TH_LEVELS_DESC.map((th) => (
                      <option key={th} value={th} className="bg-coc-dark text-white">Town Hall {th}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Role / Gaya Main" htmlFor="playStyle">
                  <select
                    id="playStyle"
                    value={formData.playStyle || ''}
                    onChange={handleInputChange}
                    className={inputClasses(false)}
                  >
                    <option value="">-- Pilih Role --</option>
                    {PLAY_STYLE_OPTIONS.map((role) => (
                      <option key={role} value={role} className="bg-coc-dark text-white">{role}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Discord ID (Opsional)" htmlFor="discordId">
                  <input
                    id="discordId"
                    value={formData.discordId || ''}
                    onChange={handleInputChange}
                    placeholder="username#1234"
                    className={inputClasses(false)}
                  />
                </FormGroup>

                <FormGroup label="Link Website (Opsional)" htmlFor="website">
                  <input
                    type="url"
                    id="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className={inputClasses(false)}
                  />
                </FormGroup>
                
                <div className="md:col-span-2">
                   <FormGroup label="Jam Aktif (Opsional)" htmlFor="activeHours">
                    <input
                      id="activeHours"
                      value={formData.activeHours || ''}
                      onChange={handleInputChange}
                      placeholder="Contoh: 19:00 - 22:00 WIB"
                      className={inputClasses(false)}
                    />
                  </FormGroup>
                </div>

                <div className="md:col-span-2">
                  <FormGroup label="Bio Singkat (Max 500)" htmlFor="bio">
                    <textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      rows={4}
                      maxLength={500}
                      className={`${inputClasses(false)} resize-y min-h-[120px]`}
                      placeholder="Ceritakan strategi favoritmu atau klan seperti apa yang kamu cari..."
                    />
                  </FormGroup>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-white/10">
              <Button href="/profile" variant="outline" className="w-full sm:w-auto border-white/10 hover:bg-white/5">
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto shadow-lg shadow-coc-gold/20"
                disabled={isSaving}
              >
                {isSaving ? <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" /> : <SaveIcon className="h-5 w-5 mr-2" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfileClient;