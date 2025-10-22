'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { createUserProfile } from '@/lib/firestore'; // Import fungsi CRUD

// Tipe untuk menentukan form mana yang aktif
type FormType = 'login' | 'register';

const AuthPage = () => {
  const [activeForm, setActiveForm] = useState<FormType>('login');
  const router = useRouter();
  
  // State untuk input form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [thLevel, setThLevel] = useState(''); 
  
  // State untuk loading dan pesan error
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * @function handleCookieSync
   * Memanggil API Route Handler untuk menyetel cookie sesi di browser.
   * Ini memastikan Server Component mengenali pengguna yang login.
   * @param uid - ID Pengguna dari Firebase Auth.
   */
  const handleCookieSync = async (uid: string) => {
    await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid }),
    });
  };


  // Fungsi untuk membersihkan state saat ganti tab
  const switchForm = (formType: FormType) => {
    setActiveForm(formType);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    // BARU: Bersihkan field spesifik registrasi saat beralih
    setPlayerTag('');
    setThLevel('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }
    // BARU: Validasi Player Tag harus diawali dengan #
    if (!playerTag.startsWith('#')) {
        setError("Player Tag harus diawali dengan '#'.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 1. Buat akun di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // 2. Panggil createUserProfile untuk menyimpan data awal ke Firestore
      await createUserProfile(uid, {
        email: email,
        playerTag: playerTag,
        thLevel: parseInt(thLevel, 10), 
        // Menggunakan Player Tag sebagai displayName awal yang lebih relevan
        displayName: playerTag,
      });
      
      // 3. Sinkronisasi Cookie Sesi untuk SSR
      await handleCookieSync(uid);
      
      router.push('/'); // Redirect ke halaman utama setelah berhasil
    } catch (error: any) {
      console.error("Registrasi Gagal:", error.message);
      // Peningkatan UX: Beri pesan error yang lebih mudah dipahami
      setError("Registrasi gagal. Pastikan format email dan password benar. Kode Error: " + error.code); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Sinkronisasi Cookie Sesi untuk SSR
      await handleCookieSync(uid);
      
      router.push('/'); // Redirect ke halaman utama setelah berhasil
    } catch (error: any) {
      setError("Email atau password salah.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-pattern bg-cover p-4">
      <div className="w-full max-w-md card-stone p-8">
        <Link href="/" className="font-supercell text-4xl text-coc-gold block text-center mb-6" style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}>
          CLASHUB
        </Link>
        
        {/* Tab Switcher */}
        <div className="flex border-b-2 border-coc-gold-dark/20 mb-6">
          <button 
            onClick={() => switchForm('login')}
            className={`flex-1 pb-2 font-bold transition-colors ${activeForm === 'login' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
          >
            LOGIN
          </button>
          <button 
            onClick={() => switchForm('register')}
            className={`flex-1 pb-2 font-bold transition-colors ${activeForm === 'register' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
          >
            DAFTAR AKUN
          </button>
        </div>
        
        {/* Pesan Error */}
        {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4">{error}</p>}

        {/* Login Form */}
        <form onSubmit={handleLogin} className={activeForm === 'login' ? 'space-y-4' : 'hidden'}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" 
          />
          <Link href="#" className="block text-right text-sm text-gray-400 hover:text-coc-gold">Lupa Password?</Link>
          <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Login'}
          </Button>
        </form>

        {/* Register Form */}
        <form onSubmit={handleRegister} className={activeForm === 'register' ? 'space-y-4' : 'hidden'}>
           <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" 
          />
          <input 
            type="password" 
            placeholder="Konfirmasi Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" 
          />
          <h3 className="text-coc-gold-dark text-center font-bold pt-4">Integrasi Clash of Clans</h3>
           <input 
            type="text" 
            placeholder="Player Tag ID (Contoh: #P9Y8Q2V)"
            value={playerTag}
            onChange={(e) => setPlayerTag(e.target.value.toUpperCase())} // Mengubah ke UPPERCASE
            required 
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" 
          />
          <select 
            required
            value={thLevel}
            onChange={(e) => setThLevel(e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
          >
              <option value="">-- Pilih Level Town Hall Anda --</option>
              <option value="16">Town Hall 16</option>
              <option value="15">Town Hall 15</option>
              <option value="14">Town Hall 14</option>
              <option value="13">Town Hall 13</option>
              <option value="12">Town Hall 12</option>
              <option value="11">Town Hall 11</option>
              <option value="10">Town Hall 10</option>
              <option value="9">Town Hall 9</option>
              {/* Tambahkan opsi lain sesuai kebutuhan */}
          </select>
          <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Daftar Sekarang'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
