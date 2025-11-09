'use client';

import React, { InputHTMLAttributes } from 'react';

// Definisikan props, tambahkan semua atribut standar input HTML
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Kita bisa tambahkan props kustom di sini jika perlu, e.g., error?: string
}

/**
 * Komponen Input standar untuk Clashub
 * Menggunakan React.forwardRef agar bisa diintegrasikan dengan form hook
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    
    // Style dasar yang konsisten dengan UI (dark, border gold)
    const baseStyles =
      'flex h-10 w-full rounded-md border border-coc-gold-dark/30 bg-coc-dark/70 px-3 py-2 text-sm text-gray-200 font-sans';
    
    // Style untuk focus state (ring gold)
    const focusStyles =
      'ring-offset-coc-dark file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coc-gold focus-visible:ring-offset-2';
      
    // Style untuk disabled state
    const disabledStyles =
      'disabled:cursor-not-allowed disabled:opacity-50';

    const combinedClasses = `${baseStyles} ${focusStyles} ${disabledStyles} ${className}`;

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