'use client';

import { useState, useEffect } from 'react'; // Import useEffect
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

// --- Validation Utilities ---
const validateEmail = (email: string): string | null => {
  if (!email) return "Email wajib diisi.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Format email tidak valid.";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Password wajib diisi.";
  if (password.length < 6) return "Password minimal 6 karakter.";
  // Tambahkan validasi lain jika perlu (misal: huruf besar, angka)
  return null;
};

const validateConfirmPassword = (password: string, confirm: string): string | null => {
  if (!confirm) return "Konfirmasi password wajib diisi.";
  if (password !== confirm) return "Password tidak cocok.";
  return null;
};

const validatePlayerTag = (tag: string): string | null => {
  if (!tag) return "Player Tag wajib diisi.";
  const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/; // # + min 4 karakter (total min 5)
  if (!tagRegex.test(tag)) return "Format Player Tag tidak valid (Contoh: #P9Y8Q2V). Hanya boleh 0289PYLQGRJCUV.";
  return null;
};
// --- End Validation Utilities ---

const AuthPage = () => {
  const [activeForm, setActiveForm] = useState<FormType>('login');
  const router = useRouter();

  // State untuk input form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [thLevel, setThLevel] = useState('');

  // --- State untuk Validation Errors ---
  const [formErrors, setFormErrors] = useState<{ [key: string]: string | null }>({
    email: null,
    password: null,
    confirmPassword: null,
    playerTag: null,
    thLevel: null, // Tambahkan jika perlu validasi thLevel
    general: null, // Untuk error umum (login/register fail)
  });
  const [isRegisterFormValid, setIsRegisterFormValid] = useState(false);
  // --- End State untuk Validation Errors ---

  // State untuk loading
  const [isLoading, setIsLoading] = useState(false);

  // --- Real-time Validation Effect for Registration Form ---
  useEffect(() => {
    if (activeForm === 'register') {
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);
      const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
      const playerTagError = validatePlayerTag(playerTag);
      const thLevelError = !thLevel ? "Town Hall wajib dipilih." : null; // Validasi TH

      setFormErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        playerTag: playerTagError,
        thLevel: thLevelError,
        general: null // Reset general error on input change
      });

      // Cek apakah semua field valid
      setIsRegisterFormValid(
        emailError === null &&
        passwordError === null &&
        confirmPasswordError === null &&
        playerTagError === null &&
        thLevelError === null
      );
    } else {
        // Reset errors when switching to login
        setFormErrors({
            email: null, password: null, confirmPassword: null, playerTag: null, thLevel: null, general: null
        });
        setIsRegisterFormValid(false); // Login form validity is checked on submit
    }
  }, [email, password, confirmPassword, playerTag, thLevel, activeForm]);
  // --- End Real-time Validation Effect ---


  const handleCookieSync = async (uid: string) => {
    await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid }),
    });
  };

  const switchForm = (formType: FormType) => {
    setActiveForm(formType);
    setFormErrors({ // Reset semua error
        email: null, password: null, confirmPassword: null, playerTag: null, thLevel: null, general: null
    });
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPlayerTag('');
    setThLevel('');
    setIsRegisterFormValid(false); // Reset validitas
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Jalankan validasi sekali lagi sebelum submit (meskipun sudah real-time)
    // dan cek isRegisterFormValid state
    if (!isRegisterFormValid) {
       // PERBAIKAN: Gunakan functional update yang benar
       setFormErrors(currentErrors => ({ ...currentErrors, general: "Harap perbaiki error pada form." }));
       // Trigger re-check if user somehow bypassed useEffect check
       const emailError = validateEmail(email);
       const passwordError = validatePassword(password);
       const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
       const playerTagError = validatePlayerTag(playerTag);
       const thLevelError = !thLevel ? "Town Hall wajib dipilih." : null;
        // PERBAIKAN: Gunakan functional update yang benar (ambil general error dari state sebelumnya)
       setFormErrors(currentErrors => ({ email: emailError, password: passwordError, confirmPassword: confirmPasswordError, playerTag: playerTagError, thLevel: thLevelError, general: currentErrors.general }));
       return;
    }

    setIsLoading(true);
     // PERBAIKAN: Gunakan functional update yang benar
    setFormErrors(currentErrors => ({ ...currentErrors, general: null })); // Clear general error

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await createUserProfile(uid, {
        email: email,
        playerTag: playerTag,
        thLevel: parseInt(thLevel, 10),
        displayName: playerTag,
      });

      await handleCookieSync(uid);
      router.push('/');
    } catch (error: any) {
      console.error("Registrasi Gagal:", error.message);
       // PERBAIKAN: Gunakan functional update yang benar
      setFormErrors(currentErrors => ({ ...currentErrors, general: "Registrasi gagal. Cek kembali data Anda. Error: " + error.code }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
     // PERBAIKAN: Gunakan functional update yang benar
    setFormErrors(currentErrors => ({ ...currentErrors, general: null })); // Clear general error
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await handleCookieSync(uid);
      router.push('/');
    } catch (error: any) {
        // PERBAIKAN: Gunakan functional update yang benar
       setFormErrors(currentErrors => ({ ...currentErrors, general: "Email atau password salah." }));
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

        {/* General Error Message */}
        {formErrors.general && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4">{formErrors.general}</p>}

        {/* Login Form */}
        <form onSubmit={handleLogin} className={activeForm === 'login' ? 'space-y-4' : 'hidden'}>
          <div> {/* Wrapper for input + error */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${formErrors.email ? 'border-coc-red' : 'border-coc-gold-dark/50'}`} // Conditional border
              />
              {/* Login doesn't need real-time validation display, error shown generally */}
          </div>
           <div> {/* Wrapper for input + error */}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${formErrors.password ? 'border-coc-red' : 'border-coc-gold-dark/50'}`} // Conditional border
              />
              {/* Login doesn't need real-time validation display, error shown generally */}
           </div>
          <Link href="#" className="block text-right text-sm text-gray-400 hover:text-coc-gold">Lupa Password?</Link>
          <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        {/* Register Form */}
        <form onSubmit={handleRegister} className={activeForm === 'register' ? 'space-y-4' : 'hidden'}>
           <div> {/* Wrapper for input + error */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${formErrors.email ? 'border-coc-red' : 'border-coc-gold-dark/50'}`}
                aria-invalid={!!formErrors.email}
                aria-describedby="email-error"
              />
              {formErrors.email && <p id="email-error" className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
           </div>
           <div> {/* Wrapper for input + error */}
              <input
                type="password"
                placeholder="Password (minimal 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${formErrors.password ? 'border-coc-red' : 'border-coc-gold-dark/50'}`}
                aria-invalid={!!formErrors.password}
                aria-describedby="password-error"
              />
              {formErrors.password && <p id="password-error" className="text-xs text-red-400 mt-1">{formErrors.password}</p>}
           </div>
           <div> {/* Wrapper for input + error */}
              <input
                type="password"
                placeholder="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${formErrors.confirmPassword ? 'border-coc-red' : 'border-coc-gold-dark/50'}`}
                aria-invalid={!!formErrors.confirmPassword}
                aria-describedby="confirmPassword-error"
              />
              {formErrors.confirmPassword && <p id="confirmPassword-error" className="text-xs text-red-400 mt-1">{formErrors.confirmPassword}</p>}
           </div>

          <h3 className="text-coc-gold-dark text-center font-bold pt-4">Integrasi Clash of Clans</h3>
           <div> {/* Wrapper for input + error */}
              <input
                type="text"
                placeholder="Player Tag ID (Contoh: #P9Y8Q2V)"
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, ''))} // Auto uppercase & filter chars
                required
                maxLength={15} // Max length typical tag
                className={`w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold ${formErrors.playerTag ? 'border-coc-red' : 'border-coc-gold-dark/50'}`}
                aria-invalid={!!formErrors.playerTag}
                aria-describedby="playerTag-error"
              />
              {formErrors.playerTag && <p id="playerTag-error" className="text-xs text-red-400 mt-1">{formErrors.playerTag}</p>}
           </div>
           <div> {/* Wrapper for select + error */}
              <select
                required
                value={thLevel}
                onChange={(e) => setThLevel(e.target.value)}
                className={`w-full bg-coc-stone/50 border rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold ${formErrors.thLevel ? 'border-coc-red' : 'border-coc-gold-dark/50'}`}
                aria-invalid={!!formErrors.thLevel}
                aria-describedby="thLevel-error"
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
               {formErrors.thLevel && <p id="thLevel-error" className="text-xs text-red-400 mt-1">{formErrors.thLevel}</p>}
           </div>

          <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading || !isRegisterFormValid}>
            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

