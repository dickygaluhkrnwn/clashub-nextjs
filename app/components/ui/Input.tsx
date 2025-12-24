'use client';

import React, { InputHTMLAttributes } from 'react';

// Definisikan props, tambahkan semua atribut standar input HTML
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Tambahkan prop error untuk validasi visual
  error?: boolean;
}

/**
 * Komponen Input standar untuk Clashub
 * Menggunakan React.forwardRef agar bisa diintegrasikan dengan form hook
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error = false, ...props }, ref) => {
    
    // Style dasar yang konsisten dengan UI Glassmorphism
    // Menggunakan bg-black/20 agar teks putih terbaca jelas di atas background apapun
    const baseStyles =
      'flex h-11 w-full rounded-xl border bg-black/20 px-4 py-2 text-sm text-white placeholder:text-gray-500 font-sans transition-all duration-200';
    
    // Style border: Default vs Error
    const borderStyles = error
      ? 'border-coc-red focus-visible:border-coc-red'
      : 'border-white/10 hover:border-white/20 focus-visible:border-coc-gold/50';

    // Style untuk focus state (Glow effect)
    const focusStyles =
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coc-gold/50 focus-visible:ring-offset-0 shadow-inner';
      
    // Style untuk disabled state
    const disabledStyles =
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white/5';

    const combinedClasses = `${baseStyles} ${borderStyles} ${focusStyles} ${disabledStyles} ${className}`;

    return (
      <input
        type={type}
        className={combinedClasses}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input'; // Wajib untuk debugging dengan forwardRef

export { Input };