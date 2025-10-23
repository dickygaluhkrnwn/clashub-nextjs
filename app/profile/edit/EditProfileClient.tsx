'use client';

import { useState, useEffect, ReactNode } from 'react'; // Import ReactNode
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getUserProfile, updateUserProfile, uploadProfileImage } from '@/lib/firestore';
// PERBAIKAN: Tambahkan CogsIcon untuk loading
import { UserCircleIcon, SaveIcon, XIcon, InfoIcon, CogsIcon, CheckIcon } from '@/app/components/icons';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';

// Opsi statis untuk dropdown TH.
const thOptions = [16, 15, 14, 13, 12, 11, 10, 9];
const playStyleOptions: Exclude<UserProfile['playStyle'], null | undefined>[] = ['Attacker Utama', 'Base Builder', 'Donatur', 'Strategist'];

// Daftar avatar statis yang tersedia
const staticAvatars = [
    '/images/placeholder-avatar.png',
    '/images/archer.png',
    '/images/barbarian.png',
    '/images/bowler.png',
    '/images/giant.png',
    '/images/goblin.png',
    '/images/healer.png',
    '/images/hogrider.png',
    '/images/minion.png',
    '/images/pekka.png',
    '/images/rootrider.png',
    '/images/valkyrie.png',
    '/images/witch.png',
    '/images/wizard.png',
    '/images/yeti.png',
];


// Tipe data khusus untuk state form
type ProfileFormData = Omit<Partial<UserProfile>, 'playStyle'> & {
    playStyle?: UserProfile['playStyle'] | '' | null;
};

// --- Validation Utility ---
const validatePlayerTag = (tag: string): string | null => {
    if (!tag) return "Player Tag wajib diisi.";
    const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/; 
    if (!tagRegex.test(tag)) return "Format Player Tag tidak valid (Contoh: #P9Y8Q2V). Hanya boleh 0289PYLQGRJCUV.";
    return null;
};
// --- End Validation Utility ---

// --- Inline Component: FormGroup (untuk tampilan error yang konsisten) ---
const FormGroup: React.FC<{ children: ReactNode, error?: string | null, label: string, htmlFor: string }> = ({ children, error, label, htmlFor }) => (
    <div className="space-y-2">
        <label htmlFor={htmlFor} className="block text-sm font-bold text-gray-200"> {/* Label dibuat lebih terang */}
            {label}
        </label>
        {children}
        {/* Error text dibuat lebih terang */}
        {error && <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 font-sans">{error}</p>}
    </div>
);
// --- End Inline Component ---


interface EditProfileClientProps {
    initialUser: { uid: string };
}

/**
 * @function sanitizeData
 * Membersihkan data form sebelum dikirim ke Firestore.
 */
const sanitizeData = (data: ProfileFormData): Partial<UserProfile> => {
    const cleanData: Partial<UserProfile> = {};
    const updatableFields = [
        'displayName', 'playerTag', 'thLevel', 'avatarUrl',
        'discordId', 'website', 'bio', 'activeHours', 'playStyle'
    ];

    for (const key of updatableFields) {
        const value = (data as any)[key];
        let cleanedValue = value;

        if (typeof value === 'string') {
            if (value.trim() === '') {
                cleanedValue = null;
            }
        } else if (key === 'thLevel') {
            cleanedValue = Number(value) || 0;
        }

        if (key === 'playStyle' && value === '') {
            cleanedValue = null;
        }

        if (cleanedValue !== null && cleanedValue !== undefined) {
            (cleanData as any)[key] = cleanedValue;
        } else if (key === 'avatarUrl') {
            (cleanData as any)[key] = '/images/placeholder-avatar.png';
        } else if (cleanedValue === null) {
            (cleanData as any)[key] = null;
        }
    }
    return cleanData;
};


const EditProfileClient = ({ initialUser }: EditProfileClientProps) => {
    const router = useRouter();
    const uid = initialUser.uid;

    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: '',
        playerTag: '',
        thLevel: 0,
        bio: '',
        playStyle: '',
        activeHours: '',
        avatarUrl: '/images/placeholder-avatar.png',
        discordId: '',
        website: '',
    });

    // --- State untuk Validation Error ---
    // PERBAIKAN: Tambahkan state error untuk semua field wajib
    const [formErrors, setFormErrors] = useState({
        displayName: null as string | null,
        playerTag: null as string | null,
        thLevel: null as string | null,
    });
    const [isFormValid, setIsFormValid] = useState(false);
    // --- End State untuk Validation Error ---

    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    // --- Real-time Validation Effect ---
    useEffect(() => {
        const tagError = validatePlayerTag(formData.playerTag || '');
        const isDisplayValid = !!(formData.displayName && formData.displayName.trim().length > 0);
        const isThValid = !!(formData.thLevel && formData.thLevel > 0);

        setFormErrors({
            displayName: isDisplayValid ? null : "Nama Tampilan wajib diisi.",
            playerTag: tagError,
            thLevel: isThValid ? null : "TH Level wajib dipilih.",
        });

        setIsFormValid(tagError === null && isDisplayValid && isThValid);
    }, [formData.playerTag, formData.displayName, formData.thLevel]);
    // --- End Real-time Validation Effect ---

    // --- Style input yang disempurnakan (dari auth/page.tsx) ---
    const inputClasses = (hasError: boolean) => (
        `w-full bg-coc-stone/50 border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
         font-sans disabled:opacity-50 disabled:cursor-not-allowed
         hover:border-coc-gold/70
         focus:ring-2 focus:ring-coc-gold focus:border-coc-gold focus:outline-none
         ${hasError
            ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50' // Error state
            : 'border-coc-gold-dark/50' // Default state
        }`
    );
    // --- End Style input ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setError(null);

        let processedValue = value;
        if (id === 'playerTag') {
            if (value.length > 0 && value.charAt(0) !== '#') {
                processedValue = '#' + value;
            }
            processedValue = processedValue.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
        }

        setFormData(prevData => ({
            ...prevData,
            [id]: id === 'thLevel' ? parseInt(processedValue, 10) || 0 : processedValue,
        }));
    };

    const handleAvatarSelect = (url: string) => {
        setFormData(prevData => ({
            ...prevData,
            avatarUrl: url,
        }));
    };


    useEffect(() => {
        const fetchProfile = async () => {
            if (uid) {
                setDataLoading(true);
                setError(null);
                try {
                    const profile = await getUserProfile(uid);
                    if (profile) {
                        setFormData({
                            displayName: profile.displayName || '',
                            playerTag: profile.playerTag || '',
                            thLevel: profile.thLevel || 10,
                            bio: profile.bio || '',
                            playStyle: profile.playStyle || '',
                            activeHours: profile.activeHours || '',
                            avatarUrl: profile.avatarUrl || '/images/placeholder-avatar.png',
                            discordId: profile.discordId ?? '',
                            website: profile.website ?? '',
                        });
                    } else {
                        setError("Profil tidak ditemukan. Silakan isi E-Sports CV Anda.");
                        setFormData(prev => ({
                            ...prev,
                            displayName: `Clasher-${uid.substring(0, 4)}`,
                            thLevel: 9,
                            playStyle: 'Attacker Utama',
                        }));
                    }
                } catch (err) {
                    console.error("Gagal memuat profil:", err);
                    setError("Gagal memuat data profil untuk diedit. Coba muat ulang halaman.");
                } finally {
                    setDataLoading(false);
                }
            }
        };
        if (uid) {
            fetchProfile();
        }
    }, [uid]); // PERBAIKAN: Menghapus formData.playerTag dari dependency array

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isFormValid || !uid || isSaving || formErrors.playerTag || formErrors.displayName || formErrors.thLevel) {
            setError("Harap lengkapi form dengan Player Tag, Nama, dan TH Level yang valid sebelum menyimpan.");
            // Memaksa validasi ulang untuk menampilkan semua error
             setFormErrors({
                displayName: !(formData.displayName && formData.displayName.trim().length > 0) ? "Nama Tampilan wajib diisi." : null,
                playerTag: validatePlayerTag(formData.playerTag || ''),
                thLevel: !(formData.thLevel && formData.thLevel > 0) ? "TH Level wajib dipilih." : null,
            });
            return;
        }

        setIsSaving(true);

        try {
            const updatedData = sanitizeData(formData);
            await updateUserProfile(uid, updatedData);
            showNotification("E-Sports CV berhasil diperbarui! Mengalihkan...", 'success');
            setTimeout(() => {
                router.push('/profile');
                router.refresh();
            }, 1000);

        } catch (err) {
            console.error("Gagal menyimpan profil:", err);
            const rawErrorMessage = (err as Error).message || "Terjadi kesalahan tidak dikenal.";
            setError(`Gagal menyimpan perubahan ke database. ${rawErrorMessage}`);
            showNotification("Gagal menyimpan perubahan. Lihat konsol untuk detail error.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Tampilan Loading ---
    if (dataLoading) {
        return (
            <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="flex justify-center items-center min-h-[50vh] card-stone p-8 rounded-lg">
                    <CogsIcon className="h-12 w-12 text-coc-gold animate-spin" />
                    <span className="font-clash text-2xl text-coc-gold ml-4">Memuat Profil CV Anda...</span>
                </div>
            </main>
        );
    }
    // --- End Tampilan Loading ---


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Render Komponen Notifikasi */}
            <Notification notification={notification ?? undefined} />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="card-stone p-8 space-y-8 rounded-lg"> {/* Added rounded-lg */}
                    <h1 className="text-3xl md:text-4xl text-center mb-6 font-clash">
                        <UserCircleIcon className="inline h-8 w-8 mr-2 text-coc-gold" />
                        Edit E-Sports CV
                    </h1>

                    {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4 border border-coc-red font-sans">{error}</p>}

                    {/* Pemilihan Avatar Statis */}
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        Pilih Avatar Statis Anda
                    </h3>
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 justify-center items-center p-4 bg-coc-stone/30 rounded-lg">
                            {staticAvatars.map((url) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => handleAvatarSelect(url)}
                                    className={`
                                        relative rounded-full transition-transform duration-200
                                        ${formData.avatarUrl === url
                                        ? 'ring-4 ring-coc-green scale-110'
                                        : 'ring-2 ring-transparent hover:scale-105'
                                    }
                                    `}
                                >
                                    <Image
                                        src={url}
                                        alt="Avatar Option"
                                        width={80} // Increased size
                                        height={80} // Increased size
                                        className="w-20 h-20 rounded-full object-cover border-2 border-coc-gold-dark" // Increased size
                                    />
                                    {formData.avatarUrl === url && (
                                        <CheckIcon className="absolute bottom-1 right-1 h-6 w-6 bg-coc-green text-white rounded-full p-0.5 border-2 border-coc-stone" /> // Adjusted checkmark
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Informasi Dasar */}
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <InfoIcon className="h-5 w-5" /> Informasi Dasar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormGroup label="Nama Tampilan (Wajib)" htmlFor="displayName" error={formErrors.displayName}>
                            <input
                                type="text"
                                id="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                placeholder="Contoh: Lord Z"
                                required
                                className={inputClasses(!!formErrors.displayName)}
                                aria-invalid={!!formErrors.displayName}
                                aria-describedby="displayName-error"
                            />
                        </FormGroup>
                        <FormGroup label="Player Tag (Wajib)" htmlFor="playerTag" error={formErrors.playerTag}>
                            <input
                                type="text"
                                id="playerTag"
                                value={formData.playerTag}
                                onChange={handleInputChange}
                                placeholder="Contoh: #P20C8Y9L"
                                required
                                maxLength={15}
                                className={inputClasses(!!formErrors.playerTag)}
                                aria-invalid={!!formErrors.playerTag}
                                aria-describedby="playerTag-error"
                            />
                        </FormGroup>
                    </div>
                    <FormGroup label="Bio & Visi (Maks 500 karakter)" htmlFor="bio">
                        <textarea
                            id="bio"
                            value={formData.bio || ''} // Handle null/undefined
                            onChange={handleInputChange}
                            placeholder="Jelaskan gaya bermain, role, dan tim seperti apa yang Anda cari..."
                            rows={4}
                            maxLength={500}
                            className={inputClasses(false) + ' resize-y min-h-[100px]'} // Added min-h
                        />
                    </FormGroup>

                    {/* Preferensi Game */}
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <CogsIcon className="h-5 w-5" /> Preferensi Game
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormGroup label="Level Town Hall (Wajib)" htmlFor="thLevel" error={formErrors.thLevel}>
                            <select
                                id="thLevel"
                                value={formData.thLevel || 0}
                                onChange={handleInputChange}
                                required
                                className={inputClasses(!!formErrors.thLevel) + ' appearance-none'} // Added appearance-none
                                aria-invalid={!!formErrors.thLevel}
                            >
                                <option value="0" disabled className="bg-coc-stone text-gray-500">-- Pilih TH Level --</option>
                                {thOptions.map(th => (
                                    <option key={th} value={th} className="bg-coc-stone text-white font-sans">Town Hall {th}</option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup label="Role Favorit" htmlFor="playStyle">
                            <select
                                id="playStyle"
                                value={formData.playStyle as string || ""}
                                onChange={handleInputChange}
                                className={inputClasses(false) + ' appearance-none'} // Added appearance-none
                            >
                                <option value="" className="bg-coc-stone text-gray-500">-- Pilih Role --</option>
                                {playStyleOptions.map(role => (
                                    <option key={role} value={role} className="bg-coc-stone text-white font-sans">{role}</option>
                                ))}
                            </select>
                        </FormGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormGroup label="Discord ID (Opsional)" htmlFor="discordId">
                            <input
                                type="text"
                                id="discordId"
                                value={formData.discordId || ''}
                                onChange={handleInputChange}
                                placeholder="Contoh: NamaAnda#1234"
                                className={inputClasses(false)}
                            />
                        </FormGroup>
                        <FormGroup label="Website/Portfolio (Opsional)" htmlFor="website">
                            <input
                                type="url"
                                id="website"
                                value={formData.website || ''}
                                onChange={handleInputChange}
                                placeholder="https:&#x2F;&#x2F;contoh.com" // Escaped //
                                className={inputClasses(false)}
                            />
                        </FormGroup>
                    </div>
                    <FormGroup label="Jam Aktif (Contoh: 20:00 - 23:00 WIB)" htmlFor="activeHours">
                        <input
                            type="text"
                            id="activeHours"
                            value={formData.activeHours || ''} // Handle null/undefined
                            onChange={handleInputChange}
                            placeholder="Contoh: 19:00 - 22:00 WIB"
                            className={inputClasses(false)}
                        />
                    </FormGroup>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-coc-gold-dark/20">
                        <Button href="/profile" variant="secondary" className="w-full sm:w-auto">
                            <XIcon className="inline h-5 w-5 mr-2" />
                            Batal
                        </Button>
                        <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={isSaving || !isFormValid}>
                            <SaveIcon className="inline h-5 w-5 mr-2" />
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default EditProfileClient;
