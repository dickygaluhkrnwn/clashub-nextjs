import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import EditProfileClient from './EditProfileClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Clashub | Edit E-Sports CV",
    description: "Perbarui informasi Town Hall, gaya bermain, bio, dan detail kontak Anda."
};

/**
 * @component EditProfilePage (Server Component)
 * Menangani otentikasi sisi server untuk melindungi rute dan meneruskan UID pengguna ke klien.
 */
const EditProfilePage = async () => {

    const sessionUser = await getSessionUser();

    // Route Protection (Server-Side Redirect)
    if (!sessionUser) {
        redirect('/auth');
    }

    // Meneruskan UID yang sudah diverifikasi ke Client Component
    return (
        <EditProfileClient initialUser={{ uid: sessionUser.uid }} />
    );
};

export default EditProfilePage;
