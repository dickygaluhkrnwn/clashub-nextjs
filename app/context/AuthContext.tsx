'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Impor instance aplikasi Firebase

// Inisialisasi Firebase Auth
const auth = getAuth(app);

// Tipe untuk nilai yang akan disediakan oleh konteks
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

// Membuat konteks dengan nilai default
const AuthContext = createContext<AuthContextType>({ 
    currentUser: null,
    loading: true 
});

// Komponen Provider yang akan "membungkus" aplikasi kita
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged adalah listener dari Firebase
    // yang akan berjalan setiap kali status login pengguna berubah.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Membersihkan listener saat komponen tidak lagi digunakan
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
  };

  // Kita tidak akan merender children sampai status autentikasi selesai dicek
  // untuk menghindari "kedipan" UI.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook untuk mempermudah penggunaan konteks di komponen lain
export const useAuth = () => {
  return useContext(AuthContext);
};

