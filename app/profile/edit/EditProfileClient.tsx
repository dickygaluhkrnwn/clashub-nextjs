'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { updateUserProfile } from '@/lib/firestore'; // updateUserProfile
import { UserCircleIcon, SaveIcon, XIcon, InfoIcon, CogsIcon, CheckIcon, ShieldIcon, AlertTriangleIcon, RefreshCwIcon, ArrowLeftIcon, TrophyIcon, GlobeIcon, DiscordIcon, LinkIcon } from '@/app/components/icons'; 
import Notification, { NotificationProps } from '@/app/components/ui/Notification';

// Opsi statis untuk dropdown TH.
const thOptions = [17, 16, 15, 14, 13, 12, 11, 10, 9]; 
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
type ProfileFormData = Omit<Partial<UserProfile>, 'playStyle' | 'trophies'> & {
    playStyle?: UserProfile['playStyle'] | '' | null;
    trophies: number; // Harus diisi dengan nilai, minimal 0
};

// --- Validation Utility ---
const validatePlayerTag = (tag: string): string | null => {
    if (!tag) return "Player Tag wajib diisi.";
    // Hanya # diikuti karakter Base32 (0-9, P, Y, L, Q, G, R, J, C, U, V, 8, 2, 9)
    const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/; 
    if (!tagRegex.test(tag.toUpperCase())) return "Format Player Tag tidak valid (Contoh: #P9Y8Q2V). Hanya boleh 0289PYLQGRJCUV.";
    return null;
};
// --- End Validation Utility ---

// --- Inline Component: FormGroup ---
const FormGroup: React.FC<{ children: ReactNode, error?: string | null, label: string, htmlFor: string, disabled?: boolean }> = ({ children, error, label, htmlFor, disabled = false }) => (
    <div className="space-y-2">
        <label htmlFor={htmlFor} className={`block text-sm font-bold ${disabled ? 'text-gray-400' : 'text-gray-200'}`}>
            {label} {disabled && <span className="text-coc-red/70 font-sans text-xs">(Terkunci oleh Verifikasi CoC)</span>}
        </label>
        {children}
        {error && <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 font-sans">{error}</p>}
    </div>
);
// --- End Inline Component ---


interface EditProfileClientProps {
    initialProfile: UserProfile; // Menggunakan initialProfile dari Server Component
}

/**
 * @function sanitizeData
 * Membersihkan data form sebelum dikirim ke Firestore.
 */
const sanitizeData = (data: ProfileFormData, isVerified: boolean): Partial<UserProfile> => {
    const cleanData: Partial<UserProfile> = {};
    // PERBAIKAN 1: Tambahkan playerTag dan thLevel ke updatableFields agar dapat di update secara manual jika !isVerified
    const updatableFields = [
        'displayName', 'playerTag', 'thLevel', 'avatarUrl',
        'discordId', 'website', 'bio', 'activeHours', 'playStyle',
        'trophies' // Trophies (opsional)
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

        // Logic untuk mencegah penimpaan field CoC yang dikunci oleh API saat verified
        if (isVerified && (key === 'playerTag' || key === 'thLevel' || key === 'trophies')) {
            continue; // Lewati, karena ini akan diurus oleh API update
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


const EditProfileClient = ({ initialProfile }: EditProfileClientProps) => {
    const router = useRouter();
    const uid = initialProfile.uid!; // UID dijamin ada dari Server Component

    const [formData, setFormData] = useState<ProfileFormData>({
        // Gunakan nilai dari initialProfile sebagai default
        displayName: initialProfile.displayName || '',
        playerTag: initialProfile.playerTag || '',
        thLevel: initialProfile.thLevel || 0,
        bio: initialProfile.bio || '',
        playStyle: initialProfile.playStyle || '',
        activeHours: initialProfile.activeHours || '',
        avatarUrl: initialProfile.avatarUrl || '/images/placeholder-avatar.png',
        discordId: initialProfile.discordId ?? '',
        website: initialProfile.website ?? '',
        trophies: initialProfile.trophies || 0, 
    });
    
    // --- State Verifikasi CoC (BARU) ---
    const [verificationForm, setVerificationForm] = useState({
        playerTag: initialProfile.playerTag || '', 
        apiToken: '', // Token dari game
    });
    const [isVerifying, setIsVerifying] = useState(false);
    // --- End State Verifikasi CoC ---

    // --- State Status ---
    const [isVerified, setIsVerified] = useState(initialProfile.isVerified || false);
    const [lastVerified, setLastVerified] = useState(initialProfile.lastVerified || undefined);
    // --- End State Status ---

    // --- State untuk Validation Error ---
    const [formErrors, setFormErrors] = useState({
        displayName: null as string | null,
        playerTag: null as string | null,
        thLevel: null as string | null,
        verifyTag: null as string | null, 
        verifyToken: null as string | null, 
    });
    const [isFormValid, setIsFormValid] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    // --- End State untuk Validation Error ---

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    // --- Real-time Validation Effect ---
    useEffect(() => {
        // Validasi untuk CV form (hanya jika belum diverifikasi)
        let tagError = null;
        let isDisplayValid = !!(formData.displayName && formData.displayName.trim().length > 0);
        let isThValid = !!(formData.thLevel && formData.thLevel > 0);

        if (!isVerified) {
             tagError = validatePlayerTag(formData.playerTag || '');
        }

        // Validation for CV form
        setFormErrors(prev => ({
            ...prev,
            displayName: isDisplayValid ? null : "Nama Tampilan wajib diisi.",
            playerTag: tagError,
            thLevel: isThValid ? null : "TH Level wajib dipilih.",
        }));

        // Validation for Verification form
        const verifyTagError = validatePlayerTag(verificationForm.playerTag || '');
        const isTokenValid = !!(verificationForm.apiToken && verificationForm.apiToken.trim().length > 0);

        setFormErrors(prev => ({
            ...prev,
            verifyTag: verifyTagError,
            verifyToken: isTokenValid ? null : "Token verifikasi wajib diisi.",
        }));

        // Form CV dianggap valid jika: Nama OK, TH OK, DAN (PlayerTag OK ATAU sudah diverifikasi)
        setIsFormValid(isDisplayValid && isThValid && (tagError === null || isVerified));

    }, [formData.playerTag, formData.displayName, formData.thLevel, verificationForm.playerTag, verificationForm.apiToken, isVerified]);
    // --- End Real-time Validation Effect ---

    // --- Style input yang disempurnakan ---
    const inputClasses = (hasError: boolean, disabled: boolean = false) => (
        `w-full border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
         font-sans ${disabled ? 'bg-coc-stone/30 opacity-70 cursor-not-allowed' : 'bg-coc-stone/50'} 
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
    
    // Handler untuk form verifikasi
    const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setVerificationError(null);

        let processedValue = value;
        if (id === 'playerTagVerification') {
            if (value.length > 0 && value.charAt(0) !== '#') {
                processedValue = '#' + value;
            }
            processedValue = processedValue.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
            setVerificationForm(prev => ({ ...prev, playerTag: processedValue }));
        } else if (id === 'apiTokenVerification') {
            setVerificationForm(prev => ({ ...prev, apiToken: processedValue.trim() }));
        }
    }

    const handleAvatarSelect = (url: string) => {
        setFormData(prevData => ({
            ...prevData,
            avatarUrl: url,
        }));
    };
    
    // --- FUNGSI VERIFIKASI ---
    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerificationError(null);

        if (formErrors.verifyTag || formErrors.verifyToken) {
            setVerificationError("Harap masukkan Player Tag dan Token yang valid.");
            return;
        }

        setIsVerifying(true);
        try {
            const response = await fetch('/api/coc/verify-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerTag: verificationForm.playerTag,
                    apiToken: verificationForm.apiToken
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Tangani error dari API Route
                throw new Error(result.message || 'Verifikasi gagal. Cek Tag & Token Anda.');
            }

            // Verifikasi Sukses: Update Client State
            setIsVerified(true);
            setLastVerified(new Date());
            
            // PERBAIKAN 2: Perbarui formData dengan data yang ditarik dari API (untuk field yang dikunci)
            setFormData(prevData => ({
                ...prevData,
                playerTag: result.profile.playerTag,
                thLevel: result.profile.thLevel,
                displayName: result.profile.inGameName || result.profile.displayName, // Gunakan inGameName jika ada
                trophies: result.profile.trophies,
            }));
            // Reset state verifikasi tag manual agar sinkron
            setVerificationForm(prev => ({ ...prev, playerTag: result.profile.playerTag, apiToken: '' }));

            
            showNotification(`Verifikasi berhasil! Akun ${result.profile.inGameName} ditautkan.`, 'success');
            router.refresh(); // Memaksa refresh untuk mendapatkan status klan terbaru

        } catch (err) {
            const errorMessage = (err as Error).message || "Terjadi kesalahan saat memanggil API verifikasi.";
            setVerificationError(errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setIsVerifying(false);
        }
    };
    // --- END FUNGSI VERIFIKASI ---


    // --- Efek untuk inisialisasi dan loading dihilangkan karena menggunakan initialProfile
    useEffect(() => {
        // Efek ini hanya untuk memastikan data diisi sekali dari Server Component
        // Logic loading data dari Client side dihilangkan.
    }, [initialProfile]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validasi wajib (Player Tag, Nama, TH Level)
        if (!isFormValid || !uid || isSaving) {
            setError("Harap lengkapi form dengan Nama, dan TH Level yang valid sebelum menyimpan.");
            return;
        }

        setIsSaving(true);

        try {
            // Sanitasi data. Player Tag dan TH Level akan diloloskan jika !isVerified
            const updatedData = sanitizeData(formData, isVerified);
            
            // PERBAIKAN 3: Memastikan field verifikasi yang dikunci API tidak ditimpa
            // Jika sudah diverifikasi, kita tidak ingin Client Component menimpa field ini 
            // dengan nilai yang mungkin tidak akurat (misal, inGameName).
            if (isVerified) {
                // Hapus field yang dikunci/diatur API dari payload save CV
                delete updatedData.playerTag;
                delete updatedData.thLevel;
                delete updatedData.trophies; 
                
                // Field verifikasi yang tidak boleh ditimpa:
                // Kita harus mendapatkan nilai asli dari initialProfile agar tidak terhapus saat merge Firestore
                updatedData.isVerified = initialProfile.isVerified;
                updatedData.clanTag = initialProfile.clanTag;
                updatedData.clanRole = initialProfile.clanRole;
                updatedData.inGameName = initialProfile.inGameName;
                updatedData.lastVerified = initialProfile.lastVerified;

            } else {
                // Jika belum diverifikasi, set isVerified=false secara eksplisit jika form dikirim (untuk keamanan)
                updatedData.isVerified = false;
                updatedData.trophies = formData.trophies; // Pastikan trophies manual tersimpan
            }
            
            // Kita harus menghapus semua field yang nilainya undefined untuk updateDoc agar tidak error
            Object.keys(updatedData).forEach(key => updatedData[key as keyof Partial<UserProfile>] === undefined && delete updatedData[key as keyof Partial<UserProfile>]);

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

    // Format last verified date
    const formattedLastVerified = lastVerified 
        ? new Date(lastVerified).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Belum pernah';


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Render Komponen Notifikasi */}
            <Notification notification={notification ?? undefined} />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="card-stone p-8 space-y-8 rounded-lg">
                    <h1 className="text-3xl md:text-4xl text-center mb-6 font-clash">
                        <UserCircleIcon className="inline h-8 w-8 mr-2 text-coc-gold" />
                        Edit E-Sports CV
                    </h1>
                    
                    <Button href="/profile" variant="secondary" className="w-full">
                        <ArrowLeftIcon className="inline h-5 w-5 mr-2" /> Kembali ke Profil
                    </Button>

                    {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4 border border-coc-red font-sans">{error}</p>}

                    {/* --- BAGIAN VERIFIKASI AKUN COCLANS (BARU) --- */}
                    <h3 className="text-xl font-clash text-coc-gold border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <ShieldIcon className="h-5 w-5" /> Verifikasi Akun Clash of Clans
                    </h3>
                    
                    <div className="bg-coc-stone/30 p-4 rounded-lg space-y-4">
                        {isVerified ? (
                            <div className="text-center p-3 bg-coc-green/20 text-coc-green border border-coc-green/50 rounded-md flex flex-wrap items-center justify-center gap-2 font-sans">
                                <CheckIcon className="h-5 w-5" />
                                <span className="font-semibold">Akun Terverifikasi:</span> {initialProfile.inGameName} ({initialProfile.playerTag}).
                                <InfoIcon className="h-4 w-4 ml-4" /> Terakhir: {formattedLastVerified}
                            </div>
                        ) : (
                            <div className="text-center p-3 bg-coc-red/20 text-red-400 border border-coc-red/50 rounded-md flex items-center justify-center gap-2 font-sans">
                                <AlertTriangleIcon className="h-5 w-5" />
                                <span className="font-semibold">Status:</span> Belum Terverifikasi. Verifikasi untuk mendapatkan data Real-time.
                            </div>
                        )}
                        
                        <form onSubmit={handleVerificationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <div className="md:col-span-1">
                                <FormGroup label="Player Tag (Verifikasi)" htmlFor="playerTagVerification" error={formErrors.verifyTag} disabled={isVerified}>
                                    <input
                                        type="text"
                                        id="playerTagVerification"
                                        value={verificationForm.playerTag}
                                        onChange={handleVerificationChange}
                                        placeholder="#P20C8Y9L"
                                        required
                                        className={inputClasses(!!formErrors.verifyTag, isVerified || isVerifying)}
                                        aria-invalid={!!formErrors.verifyTag}
                                        aria-describedby="playerTag-error"
                                    />
                                </FormGroup>
                            </div>
                            <div className="md:col-span-1">
                                <FormGroup label="Token Verifikasi In-Game" htmlFor="apiTokenVerification" error={formErrors.verifyToken} disabled={isVerified}>
                                    <input
                                        type="text"
                                        id="apiTokenVerification"
                                        value={verificationForm.apiToken}
                                        onChange={handleVerificationChange}
                                        placeholder="Token dari Pengaturan > Lainnya"
                                        required
                                        className={inputClasses(!!formErrors.verifyToken, isVerified || isVerifying)}
                                        aria-invalid={!!formErrors.verifyToken}
                                        aria-describedby="verifyToken-error"
                                    />
                                </FormGroup>
                                {verificationError && <p className="text-xs text-red-400 mt-1 font-sans">{verificationError}</p>}
                            </div>
                            <div className="md:col-span-1 pt-7">
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    className="w-full" 
                                    disabled={isVerifying || isVerified || !!formErrors.verifyTag || !!formErrors.verifyToken}
                                >
                                    <ShieldIcon className="inline h-5 w-5 mr-2" />
                                    {isVerifying ? 'Memproses...' : (isVerified ? 'Verifikasi Sukses' : 'Verifikasi Sekarang')}
                                </Button>
                            </div>
                        </form>
                        
                        <p className="text-xs text-gray-400 font-sans mt-2">
                            *Player Tag dan Token verifikasi dapat ditemukan di Pengaturan Clash of Clans Anda, di bawah 'Lainnya' &gt; 'Tampilkan Token API'. Token ini hanya berlaku untuk beberapa menit.
                        </p>
                    </div>
                    {/* --- END BAGIAN VERIFIKASI AKUN COCLANS --- */}


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
                        <FormGroup label="Player Tag (Wajib)" htmlFor="playerTag" error={formErrors.playerTag} disabled={isVerified}>
                            <input
                                type="text"
                                id="playerTag"
                                value={formData.playerTag}
                                onChange={handleInputChange}
                                placeholder="Contoh: #P20C8Y9L"
                                required
                                maxLength={15}
                                disabled={isVerified} // Kunci jika sudah diverifikasi
                                className={inputClasses(!!formErrors.playerTag, isVerified)}
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
                        <FormGroup label="Level Town Hall (Wajib)" htmlFor="thLevel" disabled={isVerified}>
                            <select
                                id="thLevel"
                                value={formData.thLevel || 0}
                                onChange={handleInputChange}
                                required
                                disabled={isVerified} // Kunci jika sudah diverifikasi
                                className={inputClasses(!!formErrors.thLevel, isVerified) + ' appearance-none'} // Added appearance-none
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
                                placeholder="https://contoh.com"
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
