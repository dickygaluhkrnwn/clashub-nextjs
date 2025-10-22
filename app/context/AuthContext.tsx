'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
// Import tipe ServerUser
import { ServerUser } from '@/lib/server-auth';

const auth = getAuth(app);

interface AuthContextType {
  currentUser: User | ServerUser | null; // Tipe bisa User dari Firebase atau ServerUser dari server
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true
});

// Tambahkan prop initialServerUser
interface AuthProviderProps {
    children: ReactNode;
    initialServerUser: ServerUser | null; // Terima data dari server
}

export function AuthProvider({ children, initialServerUser }: AuthProviderProps) {
  // Gunakan initialServerUser sebagai state awal jika ada
  // Casting `initialServerUser as User` aman di sini karena kita hanya butuh info dasar (uid, dll) untuk render awal
  const [currentUser, setCurrentUser] = useState<User | ServerUser | null>(initialServerUser);
  // Jika server sudah memberikan user, kita anggap tidak loading lagi di awal
  const [loading, setLoading] = useState(!initialServerUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Update state dengan object User dari Firebase saat listener berjalan
      setCurrentUser(user);
      // Hanya set loading false jika listener *pertama kali* berjalan
      if (loading) {
          setLoading(false);
      }
    });

    // Membersihkan listener
    return unsubscribe;
  // Hapus `loading` dari dependency array agar setLoading(false) hanya dipanggil sekali oleh listener
  }, []);

  const value = {
    currentUser,
    // Loading state sekarang hanya true jika initialServerUser null DAN listener belum berjalan
    loading: loading && !currentUser,
  };

  // Logika render children diubah sedikit:
  // Render children jika kita punya initialServerUser ATAU jika client-side loading sudah selesai
  return (
    <AuthContext.Provider value={value}>
      {/* Tampilkan children jika ada user dari server ATAU jika loading client sudah selesai */}
      {(initialServerUser || !loading) && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
