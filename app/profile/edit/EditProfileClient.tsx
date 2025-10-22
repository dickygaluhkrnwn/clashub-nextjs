'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
// PERBAIKAN: uploadProfileImage sekarang adalah fungsi dummy (tanpa Storage)
// Catatan: Walaupun tidak digunakan untuk upload file, kita biarkan import ini
// untuk konsistensi API jika ada bagian kode lain yang memanggilnya.
import { getUserProfile, updateUserProfile, uploadProfileImage } from '@/lib/firestore'; 
import { UserCircleIcon, SaveIcon, XIcon, InfoIcon, CogsIcon, CheckIcon } from '@/app/components/icons';
import Notification, { NotificationProps } from '@/app/components/ui/Notification'; 

// Opsi statis untuk dropdown TH.
const thOptions = [16, 15, 14, 13, 12, 11, 10, 9];
const playStyleOptions: Exclude<UserProfile['playStyle'], null | undefined>[] = ['Attacker Utama', 'Base Builder', 'Donatur', 'Strategist'];

// BARU: Daftar avatar statis yang tersedia (berdasarkan aset yang Anda sediakan)
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
    // PERBAIKAN UTAMA: playStyle sekarang bisa berupa string kosong "" (selain nilai valid dari UserProfile)
    playStyle?: UserProfile['playStyle'] | '' | null;
};

// --- Validation Utility ---
const validatePlayerTag = (tag: string): string | null => {
  if (!tag) return "Player Tag wajib diisi.";
  // Player Tag COC hanya terdiri dari huruf C, G, J, L, P, Q, R, U, V, Y, dan 0, 2, 8, 9
  const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/; // # + min 4 karakter valid (total min 5)
  if (!tagRegex.test(tag)) return "Format Player Tag tidak valid (Contoh: #P9Y8Q2V). Hanya boleh 0289PYLQGRJCUV.";
  return null;
};
// --- End Validation Utility ---


interface EditProfileClientProps {
    // Menerima UID yang sudah diverifikasi dari Server Component
    initialUser: { uid: string };
}

const EditProfileClient = ({ initialUser }: EditProfileClientProps) => {
    const router = useRouter();
    const uid = initialUser.uid;
    
    // HAPUS: previewUrl, uploadProgress (tidak lagi diperlukan)
    
    // State untuk input form
    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: '',
        playerTag: '',
        thLevel: 0,
        bio: '',
        playStyle: '', // Diinisialisasi sebagai string kosong, yang sekarang tipe-nya valid
        activeHours: '',
        avatarUrl: '/images/placeholder-avatar.png', // Selalu menggunakan URL
        discordId: '',
        website: '',
    });

    // --- State untuk Validation Error ---
    const [playerTagError, setPlayerTagError] = useState<string | null>(null);
    const [isFormValid, setIsFormValid] = useState(false); 
    // --- End State untuk Validation Error ---

    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Untuk error umum (fetch/save)
    
    // BARU: State untuk notifikasi Toast
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    // Helper untuk menampilkan notifikasi (menggantikan alert)
    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };


    // --- Real-time Validation Effect for Player Tag ---
    useEffect(() => {
        const tagError = validatePlayerTag(formData.playerTag || '');
        setPlayerTagError(tagError);
        
        const isDisplayValid = !!(formData.displayName && formData.displayName.trim().length > 0);
        const isThValid = !!(formData.thLevel && formData.thLevel > 0);

        setIsFormValid(tagError === null && isDisplayValid && isThValid);
    }, [formData.playerTag, formData.displayName, formData.thLevel]);
    // --- End Real-time Validation Effect ---


    // HAPUS: handleFileChange (sudah diganti dengan handleAvatarSelect)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setError(null); 

        let processedValue = value;
        if (id === 'playerTag') {
            // 1. Pastikan selalu dimulai dengan '#' jika ada input
            if (value.length > 0 && value.charAt(0) !== '#') {
                processedValue = '#' + value;
            }
            // 2. Filter karakter yang tidak diizinkan di COC Tag
            processedValue = processedValue.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
        }

        setFormData(prevData => ({
            ...prevData,
            [id]: id === 'thLevel' ? parseInt(processedValue, 10) || 0 : processedValue,
        }));
    };

    // BARU: Handler untuk memilih avatar statis
    const handleAvatarSelect = (url: string) => {
        setFormData(prevData => ({
            ...prevData,
            avatarUrl: url,
        }));
    };

    // HAPUS HELPER LAMA YANG MENGKONVERSI STRING KOSONG KE UNDEFINED
    // const getUndefinedIfEmpty = ...


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
                            // PERBAIKAN: Gunakan string kosong sebagai default jika null/undefined
                            playStyle: profile.playStyle || '',
                            activeHours: profile.activeHours || '',
                            // Pastikan ada fallback untuk avatar
                            avatarUrl: profile.avatarUrl || '/images/placeholder-avatar.png', 
                            // Pastikan field null/undefined dari DB dikonversi ke string kosong untuk form
                            discordId: profile.discordId ?? '', 
                            website: profile.website ?? '',
                        });
                        
                        // Initial validation check after loading data
                        const tagError = validatePlayerTag(profile.playerTag || '');
                        setPlayerTagError(tagError);
                        const isDisplayValid = !!(profile.displayName && profile.displayName.trim().length > 0);
                        const isThValid = !!(profile.thLevel && profile.thLevel > 0);
                        setIsFormValid(tagError === null && isDisplayValid && isThValid);
                    } else {
                        // Jika profil tidak ada, inisialisasi dengan data dasar dari UID
                        setError("Profil tidak ditemukan. Silakan isi E-Sports CV Anda.");
                        setFormData(prev => ({ 
                           ...prev, 
                           displayName: `Clasher-${uid.substring(0, 4)}`, // Nama default
                           thLevel: 9, 
                           playStyle: 'Attacker Utama',
                        }));
                        // Menggunakan Player Tag kosong di sini akan memicu error validasi form, sesuai desain
                        setIsFormValid(validatePlayerTag(formData.playerTag || '') === null); 
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
    }, [uid]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); 
        
        // Periksa validitas form lagi
        if (!isFormValid || !uid || isSaving || playerTagError) {
            setError("Harap lengkapi form dengan Player Tag, Nama, dan TH Level yang valid sebelum menyimpan.");
            return;
        }

        setIsSaving(true);
        
        try {
            // --- Persiapan Data untuk Firestore ---
            // PERBAIKAN UTAMA: Hanya kirim field yang ada dalam `updatableUserFields`
            
            const updatedData: Partial<UserProfile> = {
                displayName: formData.displayName,
                playerTag: formData.playerTag?.toUpperCase() || '', 
                thLevel: formData.thLevel || 1,
                
                // DATA AVATAR DARI PEMILIHAN STATIS
                avatarUrl: formData.avatarUrl, 

                // MENGHINDARI KONVERSI KE UNDEFINED di CLIENT, kirim string kosong atau nilai
                bio: formData.bio || '', 
                activeHours: formData.activeHours || '',
                // playStyle dikirim apa adanya, termasuk string kosong jika tidak dipilih.
                playStyle: formData.playStyle as UserProfile['playStyle'] | null | undefined, 
                discordId: formData.discordId || '', 
                website: formData.website || '',
            };
            
            // Panggil updateUserProfile
            await updateUserProfile(uid, updatedData);

            // GANTI: Mengganti alert() dengan Notification
            showNotification("E-Sports CV berhasil diperbarui! Mengalihkan...", 'success');
            
            // Redirect setelah notifikasi muncul (beri waktu 1 detik)
            setTimeout(() => {
                router.push('/profile'); 
                router.refresh(); 
            }, 1000);
            

        } catch (err) {
            // Error handling yang lebih rinci dari `lib/firestore.ts`
            console.error("Gagal menyimpan profil:", err);
            
            // Pastikan error message dari Firestore ditampilkan ke user
            const rawErrorMessage = (err as Error).message || "Terjadi kesalahan tidak dikenal.";
            // Ganti alert() dengan Notification
            setError(`Gagal menyimpan perubahan ke database. ${rawErrorMessage}`);
            showNotification("Gagal menyimpan perubahan. Lihat konsol untuk detail error.", 'error');

        } finally {
            // PERBAIKAN UTAMA: Memastikan isSaving selalu false di akhir
            setIsSaving(false);
        }
    };


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
             {/* Render Komponen Notifikasi */}
            <Notification notification={notification ?? undefined} />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="card-stone p-8 space-y-8">
                    <h1 className="text-3xl md:text-4xl text-center mb-6 font-clash">
                        <UserCircleIcon className="inline h-8 w-8 mr-2 text-coc-gold"/>
                        Edit E-Sports CV
                    </h1>

                    {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4 border border-coc-red">{error}</p>}

                    {/* BARU: Pemilihan Avatar Statis */}
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
                                        width={60}
                                        height={60}
                                        // Gunakan class `border` di Image agar tetap terlihat rapi
                                        className="w-16 h-16 rounded-full object-cover border border-coc-gold-dark"
                                    />
                                    {formData.avatarUrl === url && (
                                        <CheckIcon className="absolute bottom-0 right-0 h-5 w-5 bg-coc-green text-white rounded-full p-0.5 border border-coc-stone"/>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Informasi Dasar */}
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <InfoIcon className="h-5 w-5"/> Informasi Dasar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label htmlFor="displayName" className="block text-sm font-bold text-gray-300 mb-2">Nama Tampilan</label>
                            <input
                                type="text"
                                id="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                placeholder="Contoh: Lord Z"
                                required
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                            />
                        </div>
                         {/* --- Player Tag Input with Validation --- */}
                        <div className="form-group">
                            <label htmlFor="playerTag" className="block text-sm font-bold text-gray-300 mb-2">Player Tag (Wajib)</label>
                            <input
                                type="text"
                                id="playerTag"
                                value={formData.playerTag}
                                onChange={handleInputChange}
                                placeholder="Contoh: #P20C8Y9L"
                                required
                                maxLength={15}
                                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${playerTagError ? 'border-coc-red' : 'border-coc-gold-dark/50'}`}
                                aria-invalid={!!playerTagError}
                                aria-describedby="playerTag-error-edit"
                            />
                             {playerTagError && <p id="playerTag-error-edit" className="text-xs text-red-400 mt-1">{playerTagError}</p>}
                        </div>
                         {/* --- End Player Tag Input --- */}
                    </div>
                    <div className="form-group">
                        <label htmlFor="bio" className="block text-sm font-bold text-gray-300 mb-2">Bio & Visi (Maks 500 karakter)</label>
                        <textarea
                            id="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Jelaskan gaya bermain, role, dan tim seperti apa yang Anda cari..."
                            rows={4}
                            maxLength={500}
                            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold resize-y"
                        />
                    </div>

                    {/* Preferensi Game */}
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <CogsIcon className="h-5 w-5"/> Preferensi Game
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label htmlFor="thLevel" className="block text-sm font-bold text-gray-300 mb-2">Level Town Hall</label>
                            <select
                                id="thLevel"
                                value={formData.thLevel || 0}
                                onChange={handleInputChange}
                                required
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                            >
                                <option value="0">-- Pilih TH Level --</option>
                                {thOptions.map(th => (
                                    <option key={th} value={th}>Town Hall {th}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="playStyle" className="block text-sm font-bold text-gray-300 mb-2">Role Favorit</label>
                            <select
                                id="playStyle"
                                // PERBAIKAN UTAMA: Tambahkan casting untuk menghilangkan peringatan TS
                                value={formData.playStyle as string || ""}
                                onChange={handleInputChange}
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                            >
                                <option value="">-- Pilih Role --</option>
                                {playStyleOptions.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                         <div className="form-group">
                            <label htmlFor="discordId" className="block text-sm font-bold text-gray-300 mb-2">Discord ID (Opsional)</label>
                            <input
                                type="text"
                                id="discordId"
                                value={formData.discordId || ''} 
                                onChange={handleInputChange}
                                placeholder="Contoh: NamaAnda#1234"
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="website" className="block text-sm font-bold text-gray-300 mb-2">Website/Portfolio (Opsional)</label>
                            <input
                                type="url" 
                                id="website"
                                value={formData.website || ''} 
                                onChange={handleInputChange}
                                placeholder="https://contoh.com"
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                            />
                        </div>
                    </div>
                    <div className="form-group"> 
                        <label htmlFor="activeHours" className="block text-sm font-bold text-gray-300 mb-2">Jam Aktif (Contoh: 20:00 - 23:00 WIB)</label>
                        <input
                            type="text"
                            id="activeHours"
                            value={formData.activeHours} 
                            onChange={handleInputChange}
                            placeholder="Contoh: 19:00 - 22:00 WIB"
                            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                        />
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-coc-gold-dark/20">
                        <Button href="/profile" variant="secondary" className="w-full sm:w-auto">
                            <XIcon className="inline h-5 w-5 mr-2"/>
                            Batal
                        </Button>
                        <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={isSaving || !isFormValid}> 
                            <SaveIcon className="inline h-5 w-5 mr-2"/>
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'} 
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default EditProfileClient;