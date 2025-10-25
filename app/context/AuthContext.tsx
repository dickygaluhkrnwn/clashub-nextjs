'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { ServerUser } from '@/lib/server-auth';
// Impor Tipe UserProfile dan fungsi getter
import { UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firestore'; // Fungsi client-side untuk fetch data

const auth = getAuth(app);

interface AuthContextType {
  currentUser: User | null; // Objek User dari Firebase Auth
  userProfile: UserProfile | ServerUser | null; // Data lengkap dari Firestore
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null, // Tambahkan userProfile ke context
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
  initialServerUser: ServerUser | null; // Terima data dari server
}

export function AuthProvider({ children, initialServerUser }: AuthProviderProps) {
  // Pisahkan state:
  // currentUser untuk data auth Firebase (user.uid, user.email, dll)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // userProfile untuk data dari database Firestore (isVerified, teamId, dll)
  const [userProfile, setUserProfile] = useState<UserProfile | ServerUser | null>(
    initialServerUser,
  );
  // Loading state
  const [loading, setLoading] = useState(!initialServerUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Set status auth Firebase
      setCurrentUser(user);

      if (user) {
        // Jika user login, ambil data lengkapnya dari Firestore
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Gagal mengambil profil user di AuthContext:', error);
          setUserProfile(null); // Gagal fetch, pastikan profile null
        }
      } else {
        // Jika user logout, kosongkan juga profilnya
        setUserProfile(null);
      }
      
      // Selesai loading setelah status auth dan profile (jika ada) berhasil didapatkan
      setLoading(false);
    });

    // Membersihkan listener
    return unsubscribe;
  }, []); // Dependency array kosong agar hanya berjalan sekali

  const value = {
    currentUser, // Objek auth
    userProfile, // Objek data Firestore
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Tampilkan children hanya jika loading sudah selesai */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};