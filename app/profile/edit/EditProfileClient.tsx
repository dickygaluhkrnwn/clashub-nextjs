'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Image dari next/image
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getUserProfile, updateUserProfile, uploadProfileImage } from '@/lib/firestore'; // Import uploadProfileImage
import { UserCircleIcon, SaveIcon, XIcon, InfoIcon, CogsIcon } from '@/app/components/icons';

// Opsi statis untuk dropdown.
const thOptions = [16, 15, 14, 13, 12, 11, 10, 9];
const playStyleOptions: Exclude<UserProfile['playStyle'], null | undefined>[] = ['Attacker Utama', 'Base Builder', 'Donatur', 'Strategist'];

// Tipe data khusus untuk state form
type ProfileFormData = Omit<Partial<UserProfile>, 'playStyle'> & {
    playStyle?: UserProfile['playStyle'] | '';
};

// --- Validation Utility (Bisa dipindah ke file terpisah jika digunakan di banyak tempat) ---
const validatePlayerTag = (tag: string): string | null => {
  if (!tag) return "Player Tag wajib diisi.";
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

    // State untuk file upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('/images/placeholder-avatar.png');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // State untuk input form
    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: '',
        playerTag: '',
        thLevel: 0,
        bio: '',
        playStyle: '',
        activeHours: '',
        avatarUrl: '/images/placeholder-avatar.png',
    });

    // --- State untuk Validation Error (spesifik Player Tag) ---
    const [playerTagError, setPlayerTagError] = useState<string | null>(null);
    const [isFormValid, setIsFormValid] = useState(false); // State untuk validitas form keseluruhan
    // --- End State untuk Validation Error ---

    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Untuk error umum (fetch/save)

    // --- Real-time Validation Effect for Player Tag ---
    useEffect(() => {
        const tagError = validatePlayerTag(formData.playerTag || '');
        setPlayerTagError(tagError);
        // Form valid jika tidak ada error tag (dan asumsi field lain sudah required/valid by default)
        setIsFormValid(tagError === null);
    }, [formData.playerTag]);
    // --- End Real-time Validation Effect ---


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null); // Reset general error on file change
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError("Hanya file gambar yang diizinkan.");
                setSelectedFile(null);
                setPreviewUrl(formData.avatarUrl || '/images/placeholder-avatar.png');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // Batas 2MB
                setError("Ukuran file maksimal 2MB.");
                setSelectedFile(null);
                setPreviewUrl(formData.avatarUrl || '/images/placeholder-avatar.png');
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewUrl(formData.avatarUrl || '/images/placeholder-avatar.png');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setError(null); // Reset general error on input change

        // --- Auto uppercase & filter Player Tag ---
        let processedValue = value;
        if (id === 'playerTag') {
            processedValue = value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, '');
            // Pastikan '#' selalu di awal jika ada karakter lain
            if (processedValue.length > 0 && processedValue.charAt(0) !== '#') {
                processedValue = '#' + processedValue.replace(/#/g, ''); // Hapus # lain
            } else if (processedValue.length > 1) {
                 processedValue = '#' + processedValue.substring(1).replace(/#/g, ''); // Hapus # lain
            }
        }
        // --- End Auto uppercase & filter ---

        setFormData(prevData => ({
            ...prevData,
            [id]: id === 'thLevel' ? parseInt(processedValue, 10) || 0 : processedValue,
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
                            // Tambahkan field lain dari UserProfile jika ada di form
                            discordId: profile.discordId || '',
                            website: profile.website || '',
                        });
                        setPreviewUrl(profile.avatarUrl || '/images/placeholder-avatar.png');
                        // Initial validation check after loading data
                        setPlayerTagError(validatePlayerTag(profile.playerTag || ''));
                        setIsFormValid(validatePlayerTag(profile.playerTag || '') === null);
                    } else {
                        setError("Profil tidak ditemukan. Silakan isi E-Sports CV Anda.");
                        setFormData(prev => ({ ...prev, displayName: 'Clasher Baru' }));
                    }
                } catch (err) {
                    console.error("Gagal memuat profil:", err);
                    setError("Gagal memuat data profil untuk diedit.");
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
        setError(null); // Clear general error

        // --- Jalankan validasi lagi sebelum submit ---
        const currentTagError = validatePlayerTag(formData.playerTag || '');
        setPlayerTagError(currentTagError);
        if (currentTagError !== null) {
            setError("Harap perbaiki error pada form."); // Set general error
            return;
        }
        // --- End Validasi Submit ---


        if (!uid || isSaving) return;

        setIsSaving(true);
        let finalAvatarUrl = formData.avatarUrl;

        try {
            if (selectedFile) {
                setUploadProgress(0);
                const newUrl = await uploadProfileImage(uid, selectedFile);
                finalAvatarUrl = newUrl;
                setUploadProgress(100);
            }

            const updatedData: Partial<UserProfile> = {
                ...formData,
                playStyle: formData.playStyle || null,
                playerTag: formData.playerTag?.toUpperCase(), // Pastikan uppercase
                avatarUrl: finalAvatarUrl,
            };
            // Hapus field yang tidak perlu/kosong agar tidak menimpa nilai null di Firestore
            if (!updatedData.discordId) delete updatedData.discordId;
            if (!updatedData.website) delete updatedData.website;


            await updateUserProfile(uid, updatedData);

            alert("E-Sports CV berhasil diperbarui!");
            router.push('/profile'); // Redirect ke halaman profil setelah sukses
            router.refresh(); // Tambahkan refresh untuk memastikan data baru tampil di server component lain
        } catch (err) {
            console.error("Gagal menyimpan profil atau mengunggah gambar:", err);
            setError("Gagal menyimpan perubahan. Kesalahan: " + (err as Error).message);
            setUploadProgress(null);
        } finally {
            setIsSaving(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl text-coc-gold font-supercell animate-pulse">Memuat Editor CV...</p>
            </div>
        );
    }

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="card-stone p-8 space-y-8">
                    <h1 className="text-3xl md:text-4xl text-center mb-6">
                        <UserCircleIcon className="inline h-8 w-8 mr-2 text-coc-gold"/>
                        Edit E-Sports CV
                    </h1>

                    {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4">{error}</p>}

                    {/* Unggah Gambar Profil */}
                    <h3 className="text-xl font-supercell text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        Avatar Profil
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-8 p-4 bg-coc-stone/30 rounded-lg">
                        <Image
                            src={previewUrl}
                            alt="Avatar Preview"
                            width={100}
                            height={100}
                            className="w-24 h-24 rounded-full border-4 border-coc-gold object-cover flex-shrink-0"
                        />
                        <div className="flex-grow space-y-3 w-full">
                            <label htmlFor="avatar-upload" className="block text-sm font-bold text-gray-300">Unggah Gambar Baru (Maks 2MB)</label>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-300
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-coc-gold file:text-coc-stone
                                hover:file:bg-coc-gold-dark/90 hover:file:text-white
                                "
                            />
                            {isSaving && selectedFile && (
                                <p className="text-sm text-coc-green animate-pulse">
                                    {uploadProgress === 100 ? '✅ Unggahan Selesai.' : '⏳ Sedang Mengunggah Gambar...'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Informasi Dasar */}
                    <h3 className="text-xl font-supercell text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
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
                                onChange={handleInputChange} // onChange sudah diupdate
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
                    <h3 className="text-xl font-supercell text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
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
                                value={formData.playStyle || ""}
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
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Tambah Grid untuk Discord & Website */}
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
                                type="url" // Ganti tipe ke url untuk validasi dasar browser
                                id="website"
                                value={formData.website || ''}
                                onChange={handleInputChange}
                                placeholder="https://contoh.com"
                                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                            />
                        </div>
                    </div>
                    <div className="form-group"> {/* Pindahkan Active Hours ke luar grid */}
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
                        <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={isSaving || !isFormValid}> {/* Disable jika form tidak valid */}
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
