import { useAuth } from '@/app/context/AuthContext';

/**
 * Custom Hook untuk mengecek apakah pengguna saat ini adalah Global Admin.
 * Menggunakan data dari UserProfile yang sudah dimuat oleh AuthContext.
 */
export const useAdmin = () => {
  const { userProfile, loading } = useAuth();

  // Cek apakah profile ada dan property isGlobalAdmin bernilai true
  const isAdmin = !!userProfile?.isGlobalAdmin;

  return {
    isAdmin,
    loading,
  };
};