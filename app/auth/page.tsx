'use client';

import { useState, useEffect, ReactNode } from 'react'; // Import ReactNode
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { createUserProfile } from '@/lib/firestore';
import ThemeToggle from '@/app/components/ui/ThemeToggle'; // Import ThemeToggle
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Import Hook Bahasa
import { Translation } from '@/lib/i18n/types';
import { AlertTriangleIcon, Loader2Icon } from '@/app/components/icons'; // Import icons

// [PERBAIKAN] Impor konstanta TH 1-17 dari file utilitas
import { AVAILABLE_TH_LEVELS_DESC } from '@/lib/th-utils';

// Tipe untuk menentukan form mana yang aktif
type FormType = 'login' | 'register';

// --- Inline Component: FormGroup (untuk tampilan error yang konsisten) ---
const FormGroup: React.FC<{ children: ReactNode; error?: string | null }> = ({
  children,
  error,
}) => (
  <div className="space-y-1.5">
    {children}
    {error && (
      <div className="flex items-center gap-1.5 text-coc-red-dark mt-1 animate-in slide-in-from-top-1 fade-in duration-200">
        <AlertTriangleIcon className="h-3 w-3" />
        <p className="text-xs font-sans font-medium">{error}</p>
      </div>
    )}
  </div>
);
// --- End Inline Component ---

const AuthPage = () => {
  const { t } = useLanguage(); // [BARU] Gunakan hook bahasa
  const [activeForm, setActiveForm] = useState<FormType>('login');
  const router = useRouter();

  // State untuk input form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [thLevel, setThLevel] = useState('');

  // --- State untuk Validation Errors ---
  const [formErrors, setFormErrors] = useState<{ [key: string]: string | null }>(
    {
      email: null,
      password: null,
      confirmPassword: null,
      playerTag: null,
      thLevel: null,
      general: null,
    },
  );
  const [isRegisterFormValid, setIsRegisterFormValid] = useState(false);
  // --- End State untuk Validation Errors ---

  // State untuk loading
  const [isLoading, setIsLoading] = useState(false);

  // --- Logic Validasi dipindah ke dalam komponen agar bisa akses 't' ---
  const checkEmail = (email: string): string | null => {
    if (!email) return t.auth.emailRequired;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t.auth.emailInvalid;
    return null;
  };

  const checkPassword = (password: string): string | null => {
    if (!password) return t.auth.passwordRequired;
    if (password.length < 6) return t.auth.passwordMin;
    return null;
  };

  const checkConfirmPassword = (
    password: string,
    confirm: string,
  ): string | null => {
    if (!confirm) return t.auth.confirmRequired;
    if (password !== confirm) return t.auth.confirmMismatch;
    return null;
  };

  const checkPlayerTag = (tag: string): string | null => {
    if (!tag) return t.auth.tagRequired;
    // Player Tag COC hanya terdiri dari huruf C, G, J, L, P, Q, R, U, V, Y, dan 0, 2, 8, 9
    const tagRegex = /^#[0289PYLQGRJCUV]{3,}$/; // # + min 3 karakter (total min 4)
    if (!tagRegex.test(tag))
      return t.auth.tagInvalid;
    return null;
  };
  // --- End Validation Logic ---

  // --- Real-time Validation Effect for Registration Form ---
  useEffect(() => {
    if (activeForm === 'register') {
      const emailError = checkEmail(email);
      const passwordError = checkPassword(password);
      const confirmPasswordError = checkConfirmPassword(
        password,
        confirmPassword,
      );
      const playerTagError = checkPlayerTag(playerTag);
      const thLevelError = !thLevel ? t.auth.thRequired : null;

      // Catat error ke state (hanya update validitas, jangan tampilkan error UI realtime kecuali user sudah menyentuh field - simplified here)
      // Untuk UX lebih baik, error message UI biasanya onBlur atau onSubmit, tapi validasi state tetap realtime.
      // Di sini kita update state error untuk validasi tombol submit.
      
      // Cek apakah semua field valid
      setIsRegisterFormValid(
        emailError === null &&
          passwordError === null &&
          confirmPasswordError === null &&
          playerTagError === null &&
          thLevelError === null &&
          !!email && !!password && !!confirmPassword && !!playerTag && !!thLevel,
      );
    } else {
      // Reset errors when switching to login
      setFormErrors({
        email: null,
        password: null,
        confirmPassword: null,
        playerTag: null,
        thLevel: null,
        general: null,
      });
      setIsRegisterFormValid(false);
    }
  }, [email, password, confirmPassword, playerTag, thLevel, activeForm, t]); // Add 't' to dependency array
  // --- End Real-time Validation Effect ---

  const handleCookieSync = async (uid: string) => {
    // Fungsi ini tidak berubah (simulasi sync cookie)
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
    setFormErrors({
      // Reset semua error
      email: null,
      password: null,
      confirmPassword: null,
      playerTag: null,
      thLevel: null,
      general: null,
    });
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPlayerTag('');
    setThLevel('');
    setIsRegisterFormValid(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Akhir Saat Submit
    const emailError = checkEmail(email);
    const passwordError = checkPassword(password);
    const confirmPasswordError = checkConfirmPassword(password, confirmPassword);
    const playerTagError = checkPlayerTag(playerTag);
    const thLevelError = !thLevel ? t.auth.thRequired : null;

    if (emailError || passwordError || confirmPasswordError || playerTagError || thLevelError) {
      setFormErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        playerTag: playerTagError,
        thLevel: thLevelError,
        general: t.auth.fixFormErrors,
      });
      return;
    }

    setIsLoading(true);
    setFormErrors((currentErrors) => ({ ...currentErrors, general: null }));

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      await createUserProfile(uid, {
        email: email,
        playerTag: playerTag,
        thLevel: parseInt(thLevel, 10),
        displayName: playerTag, // Sementara gunakan tag sebagai nama
      });

      await handleCookieSync(uid);
      router.push('/');
    } catch (error: any) {
      console.error('Registrasi Gagal:', error.message);
      // Pengecekan error spesifik Firebase yang umum
      let displayError = t.auth.registrationFailed;
      if (error.code === 'auth/email-already-in-use') {
        displayError = t.auth.emailInUse;
      } else if (error.code === 'auth/invalid-email') {
        displayError = t.auth.emailInvalid;
      } else if (error.code === 'auth/weak-password') {
        displayError = "Password terlalu lemah.";
      }

      setFormErrors((currentErrors) => ({
        ...currentErrors,
        general: displayError,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jalankan validasi dasar sebelum memanggil Firebase (hanya untuk email/password)
    const emailError = checkEmail(email);
    const passwordError = checkPassword(password); // Login usually doesn't strict check length but for UX consistency

    if (emailError || !password) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        email: emailError,
        password: !password ? t.auth.passwordRequired : null,
        general: t.auth.emailOrPasswordInvalid, // Generic error for login
      }));
      return;
    }

    setIsLoading(true);
    setFormErrors((currentErrors) => ({ ...currentErrors, general: null }));

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      await handleCookieSync(uid);
      router.push('/');
    } catch (error: any) {
      // Firebase doesn't always distinguish wrong password vs user not found clearly for security
      // But we can map common codes
      let errorMessage = t.auth.emailOrPasswordInvalid;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         errorMessage = t.auth.emailOrPasswordInvalid;
      } else if (error.code === 'auth/too-many-requests') {
         errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
      }

      setFormErrors((currentErrors) => ({
        ...currentErrors,
        general: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = (hasError: boolean) =>
    `w-full bg-black/30 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coc-gold/50 focus:border-coc-gold/50 transition-all font-sans text-sm shadow-inner ${
      hasError
        ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50' // Gaya error: border merah
        : 'border-white/10 hover:border-white/20' // Gaya default
    }`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-coc-dark relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-radial-at-t from-coc-stone-light/20 via-coc-dark to-coc-dark pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-coc-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Kontainer Auth Utama */}
      <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 duration-300">
        
        {/* Card Glassmorphism */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8">
            
            {/* Tambahkan ThemeToggle di sudut */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            {/* Logo Clashub */}
            <div className="text-center mb-8">
                <Link
                href="/"
                className="font-clash text-4xl text-white block hover:text-coc-gold transition-colors drop-shadow-lg"
                >
                CLASHUB
                </Link>
                <p className="text-xs text-gray-400 mt-2 font-sans tracking-wide uppercase">Community & Strategy Platform</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-black/40 rounded-xl mb-8 border border-white/5">
                <button
                    onClick={() => switchForm('login')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeForm === 'login'
                        ? 'bg-coc-gold text-coc-stone shadow-lg'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                    {t.auth.tabLogin}
                </button>
                <button
                    onClick={() => switchForm('register')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeForm === 'register'
                        ? 'bg-coc-gold text-coc-stone shadow-lg'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                    {t.auth.tabRegister}
                </button>
            </div>

            {/* General Error Message */}
            {formErrors.general && (
                <div className="bg-coc-red/10 border border-coc-red/30 text-coc-red-light text-center text-xs md:text-sm p-3 rounded-xl mb-6 font-sans flex items-center justify-center gap-2 animate-in shake">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                    <span>{formErrors.general}</span>
                </div>
            )}

            {/* Login Form */}
            <form
                onSubmit={handleLogin}
                className={activeForm === 'login' ? 'space-y-5 animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}
            >
                <FormGroup error={formErrors.email}>
                    <input
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClasses(!!formErrors.email)}
                    />
                </FormGroup>

                <FormGroup error={formErrors.password}>
                    <input
                    type="password"
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClasses(!!formErrors.password)}
                    />
                </FormGroup>

                <div className="flex justify-end -mt-1">
                    <Link
                        href="#"
                        className="text-xs text-gray-400 hover:text-coc-gold font-sans transition-colors"
                    >
                        {t.auth.forgotPassword}
                    </Link>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full !mt-6 shadow-lg shadow-coc-gold/20"
                    size="lg"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
                            {t.auth.processing}
                        </>
                    ) : (
                        t.auth.loginButton
                    )}
                </Button>
            </form>

            {/* Register Form */}
            <form
                onSubmit={handleRegister}
                className={activeForm === 'register' ? 'space-y-5 animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'}
            >
                <FormGroup error={formErrors.email}>
                    <input
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClasses(!!formErrors.email)}
                    />
                </FormGroup>

                <FormGroup error={formErrors.password}>
                    <input
                    type="password"
                    placeholder={t.auth.passwordMinPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClasses(!!formErrors.password)}
                    />
                </FormGroup>

                <FormGroup error={formErrors.confirmPassword}>
                    <input
                    type="password"
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputClasses(!!formErrors.confirmPassword)}
                    />
                </FormGroup>

                {/* Integrasi COC - Divider Style */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[#1e1e1e] px-4 text-xs font-clash text-coc-gold uppercase tracking-widest bg-opacity-80 backdrop-blur-sm">
                            {t.auth.cocIntegrationTitle}
                        </span>
                    </div>
                </div>

                <FormGroup error={formErrors.playerTag}>
                    <input
                    type="text"
                    placeholder={t.auth.playerTagPlaceholder}
                    value={playerTag}
                    // Memastikan Player Tag di-filter dan di-uppercase
                    onChange={(e) =>
                        setPlayerTag(
                        e.target.value.toUpperCase().replace(/[^#0289PYLQGRJCUV]/g, ''),
                        )
                    }
                    required
                    maxLength={15}
                    className={inputClasses(!!formErrors.playerTag)}
                    />
                </FormGroup>

                <FormGroup error={formErrors.thLevel}>
                    <div className="relative">
                        <select
                        required
                        value={thLevel}
                        onChange={(e) => setThLevel(e.target.value)}
                        className={`w-full bg-black/30 border rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-coc-gold/50 focus:border-coc-gold/50 transition-all font-sans cursor-pointer ${
                            thLevel === '' ? 'text-gray-500' : 'text-white'
                        } ${
                            formErrors.thLevel
                            ? 'border-coc-red'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        >
                        <option value="" disabled>
                            {t.auth.thSelectDefault}
                        </option>
                        {AVAILABLE_TH_LEVELS_DESC.map((th) => (
                            <option key={th} value={th} className="text-black bg-white">
                            Town Hall {th}
                            </option>
                        ))}
                        </select>
                        {/* Custom Arrow Icon for Select */}
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </FormGroup>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full !mt-8 shadow-lg shadow-coc-gold/20"
                    size="lg"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
                            {t.auth.processing}
                        </>
                    ) : (
                        t.auth.registerButton
                    )}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;