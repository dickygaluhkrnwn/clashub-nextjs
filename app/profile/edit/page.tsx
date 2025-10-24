import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile } from '@/lib/firestore'; // Tambahkan impor getUserProfile
import { UserProfile } from '@/lib/types'; // Tambahkan impor UserProfile
import EditProfileClient from './EditProfileClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Clashub | Edit E-Sports CV",
	description: "Perbarui informasi Town Hall, gaya bermain, bio, dan detail kontak Anda."
};

/**
 * @component EditProfilePage (Server Component)
 * Menangani otentikasi sisi server, mengambil data UserProfile lengkap, 
 * dan meneruskannya ke klien.
 */
const EditProfilePage = async () => {

	const sessionUser = await getSessionUser();

	// Route Protection (Server-Side Redirect)
	if (!sessionUser) {
		redirect('/auth');
	}
	
	// Ambil UserProfile lengkap dari Firestore
	const userProfile = await getUserProfile(sessionUser.uid);

	// Jika profil tidak ditemukan, kita buat objek dasar sebagai fallback
	const initialProfile: Partial<UserProfile> = userProfile || {
		uid: sessionUser.uid,
		displayName: sessionUser.displayName || 'Pemain Baru',
		email: sessionUser.email,
		// Memastikan inisialisasi semua field verifikasi baru
		isVerified: false, 
		playerTag: '',
		thLevel: 1, 
		trophies: 0,
		clanRole: 'not in clan',
		// Field lama
		role: 'Free Agent',
	};

	// Meneruskan Profil lengkap ke Client Component
	return (
		<EditProfileClient initialProfile={initialProfile as UserProfile} />
	);
};

export default EditProfilePage;
