'use client';

import React, { InputHTMLAttributes } from 'react';

// Definisikan props, tambahkan semua atribut standar input HTML
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Tambahkan prop error untuk validasi visual
  error?: boolean;
}

/**
 * Komponen Input standar untuk Clashub.
 * Desain: Gaming Glassmorphism dengan Focus Glow.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error = false, ...props }, ref) => {
    
    // Style dasar yang konsisten dengan tema Gaming
    const baseStyles =
      'flex h-12 w-full rounded-xl border bg-[#0f1115] px-4 py-3 text-sm text-white placeholder:text-gray-600 font-sans transition-all duration-300 shadow-inner';
    
    // Style border & Interaction
    const borderStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
      : 'border-white/10 hover:border-white/20 focus:border-coc-gold/50';

    // Style untuk focus state (Gold Glow effect)
    const focusStyles =
      'focus:outline-none focus:ring-2 focus:ring-coc-gold/20';
      
    // Style untuk disabled state
    const disabledStyles =
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0a0a0b] disabled:text-gray-600';

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

Input.displayName = 'Input';

export { Input };