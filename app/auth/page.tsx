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

// [PERBAIKAN] Impor konstanta TH 1-17 dari file utilitas
import { AVAILABLE_TH_LEVELS_DESC } from '@/lib/th-utils';

// Tipe untuk menentukan form mana yang aktif
type FormType = 'login' | 'register';

// --- Inline Component: FormGroup (untuk tampilan error yang konsisten) ---
const FormGroup: React.FC<{ children: ReactNode; error?: string | null }> = ({
  children,
  error,
}) => (
  <div className="space-y-1">
    {children}
    {error && (
      <p className="text-xs text-coc-red-dark mt-1 font-sans">{error}</p>
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
    const tagRegex = /^#[0289PYLQGRJCUV]{4,}$/; // # + min 4 karakter (total min 5)
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

      // Catat error ke state
      setFormErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        playerTag: playerTagError,
        thLevel: thLevelError,
        general: null,
      });

      // Cek apakah semua field valid
      setIsRegisterFormValid(
        emailError === null &&
          passwordError === null &&
          confirmPasswordError === null &&
          playerTagError === null &&
          thLevelError === null,
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

    if (!isRegisterFormValid) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        general: t.auth.fixFormErrors,
      }));
      // Re-check validation state explicitly
      setFormErrors((currentErrors) => ({
        email: checkEmail(email),
        password: checkPassword(password),
        confirmPassword: checkConfirmPassword(password, confirmPassword),
        playerTag: checkPlayerTag(playerTag),
        thLevel: !thLevel ? t.auth.thRequired : null,
        general: currentErrors.general,
      }));
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
        displayName: playerTag,
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
    const passwordError = checkPassword(password);

    if (emailError || passwordError) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        email: emailError,
        password: passwordError,
        general: t.auth.emailOrPasswordInvalid,
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
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        general: t.auth.emailOrPasswordInvalid,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = (hasError: boolean) =>
    `w-full bg-coc-stone/50 border rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-coc-gold focus:border-coc-gold transition-colors ${
      hasError
        ? 'border-coc-red focus:border-coc-red' // Gaya error: border merah
        : 'border-coc-gold-dark/50' // Gaya default: border emas gelap
    }`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-pattern bg-cover p-4">
      {/* Kontainer Auth Utama (card-stone) */}
      <div className="relative w-full max-w-md card-stone p-8">
        {/* Tambahkan ThemeToggle di sudut (seperti prototipe HTML) */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Logo Clashub */}
        <Link
          href="/"
          className="font-clash text-4xl text-coc-gold block text-center mb-6"
          style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}
        >
          CLASHUB
        </Link>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-coc-gold-dark/20 mb-6 font-clash">
          <button
            onClick={() => switchForm('login')}
            className={`flex-1 pb-2 text-lg transition-colors ${
              activeForm === 'login'
                ? 'text-coc-gold border-b-2 border-coc-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.auth.tabLogin}
          </button>
          <button
            onClick={() => switchForm('register')}
            className={`flex-1 pb-2 text-lg transition-colors ${
              activeForm === 'register'
                ? 'text-coc-gold border-b-2 border-coc-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.auth.tabRegister}
          </button>
        </div>

        {/* General Error Message */}
        {formErrors.general && (
          <p className="bg-coc-red/20 text-coc-red-dark text-center text-sm p-3 rounded-md mb-4 font-sans border border-coc-red">
            {formErrors.general}
          </p>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className={activeForm === 'login' ? 'space-y-5' : 'hidden'}
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

          <Link
            href="#"
            className="block text-right text-sm text-gray-400 hover:text-coc-gold font-sans -mt-2"
          >
            {t.auth.forgotPassword}
          </Link>

          <Button
            type="submit"
            variant="primary"
            className="w-full !mt-6"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? t.auth.processing : t.auth.loginButton}
          </Button>
        </form>

        {/* Register Form */}
        <form
          onSubmit={handleRegister}
          className={activeForm === 'register' ? 'space-y-5' : 'hidden'}
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

          {/* Integrasi COC - Menggunakan font-clash */}
          <h3 className="text-coc-gold-dark text-center font-clash pt-4 text-xl border-t border-coc-gold-dark/20">
            {t.auth.cocIntegrationTitle}
          </h3>

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
            <select
              required
              value={thLevel}
              onChange={(e) => setThLevel(e.target.value)}
              className={`w-full bg-coc-stone/50 border rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-coc-gold focus:border-coc-gold font-sans ${
                thLevel === '' ? 'text-gray-500' : 'text-white'
              } ${
                formErrors.thLevel
                  ? 'border-coc-red'
                  : 'border-coc-gold-dark/50'
              }`}
            >
              <option value="" disabled>
                {t.auth.thSelectDefault}
              </option>
              {/* [PERBAIKAN] Ganti thLevelOptions dengan AVAILABLE_TH_LEVELS_DESC */}
              {AVAILABLE_TH_LEVELS_DESC.map((th) => (
                <option key={th} value={th} className="text-white">
                  Town Hall {th}
                </option>
              ))}
            </select>
          </FormGroup>

          <Button
            type="submit"
            variant="primary"
            className="w-full !mt-6"
            size="lg"
            disabled={isLoading || !isRegisterFormValid}
          >
            {isLoading ? t.auth.processing : t.auth.registerButton}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;