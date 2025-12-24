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
  // FIX 1: Tipe yang digunakan sekarang harus UserProfile atau null. 
  // ServerUser hanya tipe transisi yang hanya digunakan di server.
  userProfile: UserProfile | null; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null, 
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
  initialServerUser: ServerUser | null; // Terima data dari server
}

export function AuthProvider({ children, initialServerUser }: AuthProviderProps) {
  // Pisahkan state:
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // FIX 2: Initialize userProfile dengan null atau data lengkap jika ada (bukan ServerUser)
  // Kita hanya ingin menggunakan ServerUser untuk initial loading jika profil belum difetch.
  // Tetapi untuk konsistensi tipe di context, kita set null di awal dan biarkan useEffect mengambilnya.
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // FIX 3: Sesuaikan logika loading. Jika ada ServerUser, kita asumsikan tidak loading,
  // TAPI kita tetap harus menunggu fetch Firestore di useEffect. 
  // Solusi: Kita tandai loading selesai HANYA setelah onAuthStateChanged selesai dan fetch profil selesai.
  const [loading, setLoading] = useState(true); // Selalu mulai dengan loading=true

  useEffect(() => {
    // Flag untuk memastikan kita hanya melakukan fetch profil sekali saat auth state berubah
    let isMounted = true; 

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      setCurrentUser(user);
      
      if (user) {
        // Jika user login, ambil data lengkapnya dari Firestore
        try {
          const profile = await getUserProfile(user.uid);
          // FIX 4: Gunakan setUserProfile dengan tipe UserProfile | null
          if (isMounted) {
            setUserProfile(profile); 
          }
        } catch (error) {
          console.error('Gagal mengambil profil user di AuthContext:', error);
          if (isMounted) {
            setUserProfile(null); 
          }
        }
      } else {
        // Jika user logout, kosongkan juga profilnya
        if (isMounted) {
            setUserProfile(null);
        }
      }
      
      // Selesai loading setelah status auth dan profile (jika ada) berhasil didapatkan
      if (isMounted) {
        setLoading(false);
      }
    });
    
    // Cleanup function
    return () => {
        isMounted = false; // Mencegah setState setelah unmount
        unsubscribe(); // Membersihkan listener Firebase
    };
  }, []); 

  // FIX 5: Tambahkan useEffect untuk menangani data yang datang dari SSR (initialServerUser).
  // Jika ada initialServerUser, coba fetch profilnya segera, lalu set loading=false.
  useEffect(() => {
      let isMounted = true;
      
      const fetchInitialProfile = async () => {
          // Hanya fetch jika ada user dari server DAN currentUser belum tersinkronisasi (masih null/loading awal)
          if (initialServerUser && isMounted && !userProfile) {
               try {
                  const profile = await getUserProfile(initialServerUser.uid);
                  if (isMounted) {
                      setUserProfile(profile);
                  }
               } catch (error) {
                   console.error('Gagal mengambil initial profile di AuthContext:', error);
                   if (isMounted) {
                       setUserProfile(null);
                   }
               }
               // Jangan set loading false di sini, biarkan onAuthStateChanged yang mengurus final loading state
               // untuk menghindari race condition, kecuali jika kita yakin onAuthStateChanged lambat.
               // Namun untuk UX yang lebih cepat, kita bisa set loading false jika profile sudah ada.
               if (isMounted) {
                   // Optional: setLoading(false); 
               }
          }
      };
      
      fetchInitialProfile();
      
      return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialServerUser]); // Run once on mount if server user exists

  const value = {
    currentUser, 
    userProfile, 
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Tampilkan children hanya jika loading sudah selesai */}
      {!loading && children}
      {/* Tampilkan loading indicator jika masih loading (opsional) */}
      {loading && (
         <div className="min-h-screen flex items-center justify-center bg-coc-dark">
            <div className="w-12 h-12 border-4 border-coc-gold/30 border-t-coc-gold rounded-full animate-spin"></div>
         </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};