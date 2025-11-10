// File: app/profile/edit/EditProfileClient.tsx
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
} from '@/app/components/icons';
// Import NotificationProps explicitly if needed, but Notification component handles its own props structure
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';

// [PERBAIKAN] Impor konstanta TH 1-17 dari file utilitas
import { AVAILABLE_TH_LEVELS_DESC } from '@/lib/th-utils';

// --- Constants ---
// [DIHAPUS] Konstanta lama TH_OPTIONS (hanya 9-17) dihapus
// const TH_OPTIONS = [17, 16, 15, 14, 13, 12, 11, 10, 9];
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

// --- Type Definitions ---
type ProfileFormData = Omit<Partial<UserProfile>, 'playStyle' | 'thLevel'> & {
  playStyle?: UserProfile['playStyle'] | '' | null;
  thLevel: number | string; // Use string initially for select, convert later
};

// --- Helper Components & Functions ---

const validatePlayerTag = (tag: string): string | null => {
  if (!tag) return 'Player Tag wajib diisi.';
  const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/; // CoC Tag characters
  if (!tagRegex.test(tag.toUpperCase()))
    return 'Format Player Tag tidak valid (Contoh: #P9Y8Q2V).';
  return null;
};

// Reusable FormGroup Component
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
      className={`block text-sm font-bold ${
        disabled ? 'text-gray-500' : 'text-gray-200'
      }`}
    >
      {label}{' '}
      {disabled && (
        <span className="text-coc-red/80 font-sans text-xs">
          (Terkunci oleh Verifikasi)
        </span>
      )}
    </label>
    {children}
    {error && (
      <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 font-sans">
        {error}
      </p>
    )}
  </div>
);

// Sanitizes form data before saving to Firestore
const sanitizeDataForFirestore = (
  data: ProfileFormData,
  initialProfile: UserProfile,
): Partial<UserProfile> => {
  const cleanData: Partial<UserProfile> = {};
  const isVerified = initialProfile.isVerified || false;

  // Iterate over all keys in the form data
  Object.keys(data).forEach((keyStr) => {
    const key = keyStr as keyof ProfileFormData;
    let value = data[key];

    // Skip fields managed by verification if user is verified
    if (
      isVerified &&
      ['playerTag', 'thLevel', 'trophies', 'inGameName'].includes(key)
    ) {
      return;
    }

    // Clean string values
    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') value = null; // Convert empty strings to null
    }

    // Convert thLevel to number, ensure it's valid or null
    if (key === 'thLevel') {
      const numValue = Number(value);
      value = isNaN(numValue) || numValue <= 0 ? null : numValue;
    }

    // Assign cleaned value (null is acceptable for Firestore)
    (cleanData as any)[key] = value;
  });

  // Always ensure avatarUrl has a fallback
  if (!cleanData.avatarUrl) {
    cleanData.avatarUrl = '/images/placeholder-avatar.png';
  }

  // Explicitly carry over verification data to prevent accidental overwrites by client form
  if (isVerified) {
    cleanData.isVerified = initialProfile.isVerified;
    cleanData.lastVerified = initialProfile.lastVerified;
    cleanData.clanTag = initialProfile.clanTag;
    cleanData.clanRole = initialProfile.clanRole;
    cleanData.inGameName = initialProfile.inGameName;
    // Trophies are managed by verification, do not save manual input if verified
  } else {
    // Ensure verification status is false if saving while unverified
    cleanData.isVerified = false;
  }

  // --- START FIX Nomenklatur Team -> Clan ---
  // Pastikan clanId dan clanName dibawa, terutama jika isVerified=true
  // Kita harus membawa nilai clanId dan clanName dari initialProfile
  // karena form ini tidak mengeditnya. Tanpa ini, akan terhapus jika cleanData tidak memiliki properti ini.
  // Jika user Verified, kita harus pertahankan data tim/klan internal mereka (clanId/clanName).
  if (initialProfile.clanId) {
    cleanData.clanId = initialProfile.clanId;
  }
  if (initialProfile.clanName) {
    cleanData.clanName = initialProfile.clanName;
  }
  // Jika ada teamId/teamName lama di initialProfile (sebelum refactor), pastikan itu tidak ikut
  // Namun, karena kita sudah update types.ts, kita hanya perlu fokus pada clanId/clanName.
  // --- END FIX Nomenklatur Team -> Clan ---

  // Remove undefined keys before sending to Firestore
  Object.keys(cleanData).forEach((key) => {
    if ((cleanData as any)[key] === undefined) {
      delete (cleanData as any)[key];
    }
  });

  return cleanData;
};

// --- Main Client Component ---

interface EditProfileClientProps {
  initialProfile: UserProfile; // Data passed from Server Component
}

const EditProfileClient = ({ initialProfile }: EditProfileClientProps) => {
  const router = useRouter();
  // Initialize form state from server-provided data
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: initialProfile.displayName || '',
    playerTag: initialProfile.playerTag || '',
    thLevel: initialProfile.thLevel || '', // Keep as string for select input
    bio: initialProfile.bio || '',
    playStyle: initialProfile.playStyle || '',
    activeHours: initialProfile.activeHours || '',
    avatarUrl: initialProfile.avatarUrl || '/images/placeholder-avatar.png',
    discordId: initialProfile.discordId ?? '',
    website: initialProfile.website ?? '',
  });

  // State specifically for the verification inputs
  const [verificationForm, setVerificationForm] = useState({
    playerTag: initialProfile.playerTag || '', // Pre-fill if available
    apiToken: '',
  });

  // Component states
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({}); // For validation errors

  const isVerified = initialProfile.isVerified || false; // Get verification status

  // Effect to sync form data if initialProfile changes (e.g., after verification refresh)
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
    // Also update verification form's player tag if profile updated
    if (initialProfile.playerTag) {
      setVerificationForm((prev) => ({
        ...prev,
        playerTag: initialProfile.playerTag!,
      }));
    }
  }, [initialProfile]); // Re-run effect when initialProfile changes

  // Handles changes in the main profile form inputs
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { id, value } = e.target;
    let processedValue = value;

    // Auto-format Player Tag input
    if (id === 'playerTag') {
      processedValue = value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
      if (value.length > 0 && !processedValue.startsWith('#')) {
        processedValue = '#' + processedValue;
      }
    }

    setFormData((prev) => ({ ...prev, [id]: processedValue }));
    // Clear related error on change
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Handles changes in the verification form inputs
  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let processedValue = value;
    // Map input id to state key (adjust if id differs)
    const targetKey =
      id === 'playerTagVerification' ? 'playerTag' : 'apiToken';

    if (targetKey === 'playerTag') {
      processedValue = value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
      if (value.length > 0 && !processedValue.startsWith('#')) {
        processedValue = '#' + processedValue;
      }
    }

    setVerificationForm((prev) => ({
      ...prev,
      [targetKey]: processedValue.trim(),
    }));
    // Clear related verification errors on change
    if (errors.verifyTag || errors.verifyToken) {
      setErrors((prev) => ({ ...prev, verifyTag: null, verifyToken: null }));
    }
  };

  // Handles the verification API call
  const handleVerificationSubmit = async () => {
    // Validate verification inputs
    const tagError = validatePlayerTag(verificationForm.playerTag);
    const tokenError = !verificationForm.apiToken
      ? 'API Token wajib diisi.'
      : null;

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
    setNotification(null); // Clear previous notifications

    try {
      // Call the verification API endpoint
      const response = await fetch('/api/coc/verify-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationForm),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Verifikasi gagal.'); // Handle API errors

      // Show success message
      setNotification({
        message: `Verifikasi sukses! Akun ${result.profile.inGameName} telah ditautkan. Halaman akan dimuat ulang.`,
        type: 'success',
        onClose: () => setNotification(null),
      });
      // Refresh the page after a short delay to get updated server props (including new verification status)
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      // Show error message
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal.';
      setNotification({
        message,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsVerifying(false); // Reset loading state
    }
  };

  // Handles saving the main profile form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Perform validation
    let validationErrors: Record<string, string | null> = {};
    if (!formData.displayName?.trim()) {
      validationErrors.displayName = 'Nama Tampilan wajib diisi.';
    }
    // Only validate TH if not verified (it's locked if verified)
    if (!isVerified && !formData.thLevel) {
      validationErrors.thLevel = 'Level Town Hall wajib dipilih.';
    }
    // Validate Player Tag only if not verified
    if (!isVerified) {
      const tagError = validatePlayerTag(formData.playerTag || '');
      if (tagError) {
        validationErrors.playerTag = tagError;
      }
    }

    setErrors(validationErrors); // Update error state

    // If there are errors, show notification and stop submission
    if (
      Object.keys(validationErrors).some((key) => validationErrors[key] !== null)
    ) {
      setNotification({
        message: 'Harap perbaiki error pada form.',
        type: 'error',
        onClose: () => setNotification(null),
      });
      return;
    }

    setIsSaving(true); // Set saving state
    setNotification(null); // Clear previous notifications

    try {
      // Sanitize data before saving
      const dataToSave = sanitizeDataForFirestore(formData, initialProfile);
      // Call Firestore update function
      await updateUserProfile(initialProfile.uid!, dataToSave);
      // Show success message
      setNotification({
        message: 'Profil berhasil diperbarui! Mengalihkan...',
        type: 'success',
        onClose: () => setNotification(null),
      });
      // Redirect back to profile page after delay
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      // Show error message on save failure
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan.';
      setNotification({
        message,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsSaving(false); // Reset saving state
    }
  };

  // Dynamic input styling based on error and disabled state
  const inputClasses = (hasError: boolean, disabled: boolean = false) =>
    `w-full border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
       font-sans ${
         disabled ? 'bg-coc-stone/30 opacity-70 cursor-not-allowed' : 'bg-coc-stone/50'
       }
       hover:border-coc-gold/70 focus:ring-2 focus:ring-coc-gold focus:border-coc-gold focus:outline-none
       ${
         hasError
           ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50'
           : 'border-coc-gold-dark/50'
       }`;

  // --- JSX Structure ---
  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      {/* Display notification component if notification state is not null */}
      {notification && <Notification notification={notification} />}

      <div className="max-w-4xl mx-auto">
        {/* Main profile form */}
        <form
          onSubmit={handleSubmit}
          className="card-stone p-6 md:p-8 space-y-10 rounded-lg"
        >
          {/* Header */}
          <header className="text-center">
            <h1 className="text-3xl md:text-4xl font-clash text-white flex items-center justify-center gap-3">
              <UserCircleIcon className="h-8 w-8 text-coc-gold" />
              Edit E-Sports CV
            </h1>
          </header>

          {/* --- VERIFICATION SECTION --- */}
          <section className="space-y-4">
            <h2 className="text-xl font-clash text-coc-gold border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <ShieldIcon className="h-5 w-5" />
              Verifikasi Akun Clash of Clans
            </h2>

            {/* Verification Status/Form Container */}
            <div
              className={`p-4 rounded-lg space-y-4 ${
                isVerified
                  ? 'bg-coc-green/10 border border-coc-green/30'
                  : 'bg-coc-stone/40'
              }`}
            >
              {isVerified ? (
                // Display if verified
                <div className="text-center p-3 text-coc-green rounded-md flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 font-sans">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-6 w-6" />
                    <span className="font-semibold">Terverifikasi:</span>
                    <span>
                      {initialProfile.inGameName} ({initialProfile.playerTag})
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    |
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <InfoIcon className="h-4 w-4" />
                    <span>
                      Terakhir dicek:{' '}
                      {initialProfile.lastVerified
                        ? new Date(
                            initialProfile.lastVerified,
                          ).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                // Display verification form if not verified
                <>
                  <p className="text-sm text-gray-400 font-sans">
                    Verifikasi akun Anda untuk mengunci Player Tag & TH Level
                    dengan data real-time dari game, dan membuka fitur
                    manajemen klan.
                  </p>
                  {/* Verification Inputs and Button (NO NESTED FORM) */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      {/* Input for Player Tag */}
                      <FormGroup
                        label="Player Tag"
                        htmlFor="playerTagVerification"
                        error={errors.verifyTag}
                      >
                        <input
                          id="playerTagVerification"
                          value={verificationForm.playerTag}
                          onChange={handleVerificationChange}
                          placeholder="#P20C8Y9L"
                          className={inputClasses(
                            !!errors.verifyTag,
                            isVerifying,
                          )}
                          disabled={isVerifying}
                        />
                      </FormGroup>
                    </div>
                    <div className="md:col-span-2">
                      {/* Input for API Token */}
                      <FormGroup
                        label="Token API In-Game"
                        htmlFor="apiTokenVerification"
                        error={errors.verifyToken}
                      >
                        <input
                          id="apiTokenVerification"
                          value={verificationForm.apiToken}
                          onChange={handleVerificationChange}
                          placeholder="Token dari Pengaturan"
                          className={inputClasses(
                            !!errors.verifyToken,
                            isVerifying,
                          )}
                          disabled={isVerifying}
                        />
                      </FormGroup>
                    </div>
                    <div className="md:col-span-1">
                      {/* Verification Button (type="button") */}
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleVerificationSubmit}
                        className="w-full"
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <RefreshCwIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <ShieldIcon className="h-5 w-5" />
                        )}
                        <span className="ml-2">
                          {isVerifying ? 'Cek...' : 'Verifikasi'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
          {/* --- END VERIFICATION SECTION --- */}

          {/* --- AVATAR SELECTION SECTION --- */}
          <section className="space-y-4">
            <h2 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">
              Pilih Avatar
            </h2>
            <div className="flex flex-wrap gap-3 justify-center items-center p-4 bg-coc-stone/30 rounded-lg">
              {STATIC_AVATARS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, avatarUrl: url }))
                  }
                  className={`relative rounded-full transition-transform duration-200 ${
                    formData.avatarUrl === url
                      ? 'ring-4 ring-coc-green scale-110'
                      : 'ring-2 ring-transparent hover:scale-105'
                  }`}
                >
                  <Image
                    src={url}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-coc-gold-dark"
                  />
                  {formData.avatarUrl === url && (
                    <CheckIcon className="absolute bottom-0 right-0 h-6 w-6 bg-coc-green text-white rounded-full p-0.5 border-2 border-coc-stone" />
                  )}
                </button>
              ))}
            </div>
          </section>
          {/* --- END AVATAR SELECTION SECTION --- */}

          {/* --- E-SPORTS CV SECTION --- */}
          <section className="space-y-6">
            <h2 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">
              Detail CV
            </h2>
            {/* CV Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup
                label="Nama Tampilan"
                htmlFor="displayName"
                error={errors.displayName}
              >
                <input
                  id="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={inputClasses(!!errors.displayName)}
                  required
                />
              </FormGroup>
              <FormGroup
                label="Player Tag"
                htmlFor="playerTag"
                error={errors.playerTag}
                disabled={isVerified}
              >
                <input
                  id="playerTag"
                  value={formData.playerTag}
                  onChange={handleInputChange}
                  className={inputClasses(!!errors.playerTag, isVerified)}
                  disabled={isVerified}
                  placeholder="#P20C8Y9L"
                  required={!isVerified}
                />
              </FormGroup>
              <FormGroup
                label="Level Town Hall"
                htmlFor="thLevel"
                error={errors.thLevel}
                disabled={isVerified}
              >
                <select
                  id="thLevel"
                  value={formData.thLevel}
                  onChange={handleInputChange}
                  className={
                    inputClasses(!!errors.thLevel, isVerified) +
                    ' appearance-none'
                  }
                  disabled={isVerified}
                  required={!isVerified}
                >
                  <option value="">-- Pilih TH --</option>
                  {/* [PERBAIKAN] Ganti TH_OPTIONS dengan AVAILABLE_TH_LEVELS_DESC */}
                  {AVAILABLE_TH_LEVELS_DESC.map((th) => (
                    <option key={th} value={th}>
                      Town Hall {th}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label="Role Favorit" htmlFor="playStyle">
                <select
                  id="playStyle"
                  value={formData.playStyle || ''}
                  onChange={handleInputChange}
                  className={inputClasses(false) + ' appearance-none'}
                >
                  <option value="">-- Pilih Role --</option>
                  {PLAY_STYLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
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
              <FormGroup label="Website/Link (Opsional)" htmlFor="website">
                <input
                  type="url"
                  id="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://link-kamu.com"
                  className={inputClasses(false)}
                />
              </FormGroup>
            </div>
            <FormGroup label="Jam Aktif (Opsional)" htmlFor="activeHours">
              <input
                id="activeHours"
                value={formData.activeHours || ''}
                onChange={handleInputChange}
                placeholder="Contoh: 19:00 - 22:00 WIB"
                className={inputClasses(false)}
              />
            </FormGroup>
            <FormGroup label="Bio (Maks 500 karakter)" htmlFor="bio">
              <textarea
                id="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                className={inputClasses(false) + ' resize-y min-h-[100px]'}
                placeholder="Ceritakan tentang diri Anda, gaya bermain, atau tim yang dicari..."
              />
            </FormGroup>
          </section>
          {/* --- END E-SPORTS CV SECTION --- */}

          {/* --- ACTION BUTTONS --- */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-coc-gold-dark/20">
            {/* Back Button */}
            <Button
              href="/profile"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Kembali ke Profil
            </Button>
            {/* Save Button (type="submit" for the main form) */}
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <SaveIcon className="h-5 w-5 mr-2" />
              )}
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan CV'}
            </Button>
          </div>
          {/* --- END ACTION BUTTONS --- */}
        </form>
        {/* --- END Main Form --- */}
      </div>
    </main>
  );
};

export default EditProfileClient;