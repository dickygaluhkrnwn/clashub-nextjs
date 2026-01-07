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

// Reusable Input Wrapper with Gaming Style
const FormGroup: React.FC<{
  children: ReactNode;
  label: string;
  htmlFor: string;
  error?: string | null;
  disabled?: boolean;
}> = ({ children, label, htmlFor, error, disabled = false }) => (
  <div className="space-y-2">
    <label
      htmlFor={htmlFor}
      className={`block text-[10px] font-bold uppercase tracking-widest ${
        disabled ? 'text-gray-600' : 'text-gray-400 group-focus-within:text-coc-gold transition-colors'
      }`}
    >
      {label}{' '}
      {disabled && <span className="text-red-500/50 normal-case ml-1">(Locked)</span>}
    </label>
    <div className="relative group">
        {children}
        {/* Glow effect on focus (handled by peer/focus-within logic if possible, or just hover) */}
    </div>
    {error && (
      <div id={`${htmlFor}-error`} className="flex items-center gap-1.5 text-xs text-red-400 mt-1 bg-red-500/5 p-1.5 rounded-lg border border-red-500/10">
        <AlertTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" /> 
        <span>{error}</span>
      </div>
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

  // Gaming Input Styles (Darker & Sharper)
  const inputClasses = (hasError: boolean, disabled: boolean = false) =>
    `w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-all duration-300 font-sans
     ${disabled 
       ? 'bg-[#0f1115] border border-white/5 text-gray-500 cursor-not-allowed opacity-70' 
       : 'bg-[#0a0a0b] border border-white/10 hover:border-coc-gold/30 hover:bg-[#0f1115] focus:bg-[#13151b]'
     }
     focus:ring-1 focus:ring-coc-gold/50 focus:border-coc-gold focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.1)]
     ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
    `;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden pb-20">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/5 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-coc-gold/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {notification && <Notification notification={notification} />}

      <main className="container mx-auto p-4 md:p-8 mt-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-10 flex items-center gap-6">
            <Button href="/profile" variant="ghost" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5">
              <ArrowLeftIcon className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 uppercase tracking-wide drop-shadow-md">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-coc-gold to-yellow-200">
                    Edit Profile
                </span>
                <div className="px-2 py-1 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
                    <EditIcon className="h-5 w-5 text-coc-gold" />
                </div>
              </h1>
              <p className="text-gray-500 text-sm font-sans mt-2 tracking-wide uppercase">Customize your identity & preferences</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Account Verification Module (Panel Keamanan) */}
            <section className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-coc-blue" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue to-transparent opacity-50" />
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                  <div className="p-2 bg-coc-blue/10 rounded-lg border border-coc-blue/20">
                      <ShieldIcon className="h-5 w-5 text-coc-blue" />
                  </div>
                  Account Verification
                </h2>
                {isVerified && (
                  <div className="px-4 py-1.5 bg-coc-green/10 text-coc-green rounded-xl text-xs font-bold border border-coc-green/30 flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                    <CheckIcon className="h-4 w-4 stroke-[3px]" /> VERIFIED
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-2xl transition-all duration-500 relative overflow-hidden ${
                isVerified 
                    ? 'bg-gradient-to-br from-coc-green/5 to-[#0a0a0b] border border-coc-green/20' 
                    : 'bg-[#0a0a0b] border border-white/10 border-dashed'
              }`}>
                {isVerified ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-[#0f1115] border border-coc-green/30 flex items-center justify-center text-coc-green shadow-lg">
                        <CheckIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Linked Account</p>
                        <p className="text-2xl font-bold text-white font-clash">{initialProfile.inGameName}</p>
                        <p className="text-coc-green font-mono text-sm font-bold tracking-wider">{initialProfile.playerTag}</p>
                      </div>
                    </div>
                    <div className="text-right bg-[#0f1115] px-4 py-2 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Last Sync</p>
                      <p className="text-xs text-gray-300 font-mono">
                        {initialProfile.lastVerified ? new Date(initialProfile.lastVerified).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-coc-gold/10 rounded-full border border-coc-gold/20 flex-shrink-0 animate-pulse-slow">
                            <InfoIcon className="h-6 w-6 text-coc-gold" />
                        </div>
                        <p className="text-sm text-gray-300 font-sans leading-relaxed max-w-2xl">
                          Hubungkan akun Clash of Clans Anda menggunakan <strong>Player Tag</strong> dan <strong>API Token</strong> untuk membuka fitur eksklusif, manajemen klan, dan sinkronisasi statistik otomatis.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#13151b] p-4 rounded-xl border border-white/5">
                      <div className="md:col-span-5">
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
                      <div className="md:col-span-5">
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
                      <div className="md:col-span-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleVerificationSubmit}
                          className="w-full h-[48px] shadow-[0_0_15px_rgba(255,215,0,0.15)] font-bold tracking-wide"
                          disabled={isVerifying}
                        >
                          {isVerifying ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : 'CONNECT'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Avatar Selection (Grid Panel) */}
            <section className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                  <div className="p-2 bg-coc-red/10 rounded-lg border border-coc-red/20">
                      <UserCircleIcon className="h-5 w-5 text-coc-red" /> 
                  </div>
                  Select Avatar
                </h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {STATIC_AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: url }))}
                    className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 group/avatar ${
                      formData.avatarUrl === url
                        ? 'ring-2 ring-coc-gold shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-105 z-10 grayscale-0'
                        : 'opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <Image
                      src={url}
                      alt="Avatar"
                      fill
                      className="object-cover bg-[#0a0a0b]"
                    />
                    {formData.avatarUrl === url && (
                      <div className="absolute inset-0 bg-coc-gold/10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-coc-gold text-black rounded-full p-1.5 shadow-lg">
                          <CheckIcon className="h-3.5 w-3.5 stroke-[3px]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Detail CV (Form Panel) */}
            <section className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-600" />
              
              <div className="border-b border-white/10 pb-6 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                  <div className="p-2 bg-gray-700/20 rounded-lg border border-gray-600/30">
                      <InfoIcon className="h-5 w-5 text-gray-300" />
                  </div>
                  Basic Info
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FormGroup label="Display Name" htmlFor="displayName" error={errors.displayName}>
                  <input
                    id="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={inputClasses(!!errors.displayName)}
                    required
                    placeholder="Nama panggilan..."
                  />
                </FormGroup>

                <FormGroup label="Player Tag (Manual)" htmlFor="playerTag" error={errors.playerTag} disabled={isVerified}>
                  <input
                    id="playerTag"
                    value={formData.playerTag}
                    onChange={handleInputChange}
                    className={inputClasses(!!errors.playerTag, isVerified)}
                    disabled={isVerified}
                    placeholder={isVerified ? "Managed automatically" : "#P20C8Y9L"}
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
                    <option value="" className="text-gray-500">-- Select Level --</option>
                    {AVAILABLE_TH_LEVELS_DESC.map((th) => (
                      <option key={th} value={th} className="bg-[#0a0a0b] text-white">Town Hall {th}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Play Style / Role" htmlFor="playStyle">
                  <select
                    id="playStyle"
                    value={formData.playStyle || ''}
                    onChange={handleInputChange}
                    className={inputClasses(false)}
                  >
                    <option value="" className="text-gray-500">-- Select Role --</option>
                    {PLAY_STYLE_OPTIONS.map((role) => (
                      <option key={role} value={role} className="bg-[#0a0a0b] text-white">{role}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Discord ID (Optional)" htmlFor="discordId">
                  <input
                    id="discordId"
                    value={formData.discordId || ''}
                    onChange={handleInputChange}
                    placeholder="username#1234"
                    className={inputClasses(false)}
                  />
                </FormGroup>

                <FormGroup label="Website Link (Optional)" htmlFor="website">
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
                   <FormGroup label="Active Hours (Optional)" htmlFor="activeHours">
                    <input
                      id="activeHours"
                      value={formData.activeHours || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 19:00 - 22:00 WIB"
                      className={inputClasses(false)}
                    />
                  </FormGroup>
                </div>

                <div className="md:col-span-2">
                  <FormGroup label="Short Bio (Max 500)" htmlFor="bio">
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-white/10 sticky bottom-0 bg-[#0a0a0b]/90 backdrop-blur-md p-4 rounded-xl z-50">
              <Button href="/profile" variant="outline" className="w-full sm:w-auto border-white/10 hover:bg-white/5 hover:text-white px-8">
                CANCEL
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] px-8 font-bold tracking-wide"
                disabled={isSaving}
              >
                {isSaving ? <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" /> : <SaveIcon className="h-5 w-5 mr-2" />}
                {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
              </Button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfileClient;