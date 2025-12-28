'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

// --- Mendefinisikan tipe properti yang lebih kuat ---

// Properti dasar yang sama untuk semua varian
type BaseButtonProps = {
  // PERBAIKAN: Menambahkan 'danger', 'ghost', 'outline', dan 'success' ke tipe variant
  variant?:
    | 'primary'
    | 'secondary'
    | 'link'
    | 'tertiary'
    | 'danger'
    | 'ghost'
    | 'outline'
    | 'success'; // [FIX] Added success variant
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
};

// Properti untuk tombol yang berfungsi sebagai link
type LinkButtonProps = BaseButtonProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

// Properti untuk tombol standar
type ActionButtonProps = BaseButtonProps & {
  href?: never;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

// Gabungkan kedua tipe menjadi satu
type ButtonProps = LinkButtonProps | ActionButtonProps;

// --- Komponen Button ---

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    { variant = 'primary', size = 'md', children, className = '', ...props },
    ref
  ) => {
    // Menambahkan font-clash ke kelas dasar, kecuali untuk varian 'link' dan 'ghost'
    const baseClasses = `inline-block ${
      variant !== 'link' && variant !== 'ghost' ? 'font-clash' : 'font-sans'
    } rounded-md transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed select-none`;

    // PERBAIKAN: Menambahkan kelas untuk variant 'danger', 'ghost', 'outline', dan 'success'
    const variantClasses = {
      primary: 'btn-3d-gold shadow-lg hover:shadow-xl active:translate-y-0.5', // Menggunakan utility class globals.css + interaksi
      secondary: 'btn-3d-stone shadow-lg hover:shadow-xl active:translate-y-0.5',
      tertiary: 'btn-3d-silver shadow-lg hover:shadow-xl active:translate-y-0.5', // Pastikan btn-3d-silver ada atau gunakan fallback
      link: 'btn-link font-bold text-coc-gold hover:text-white underline-offset-4 hover:underline',
      
      // Style baru untuk danger (Merah Clash)
      danger:
        'bg-gradient-to-b from-coc-red to-red-800 text-white border-b-4 border-red-900 hover:from-red-500 hover:to-coc-red shadow-lg active:border-b-0 active:translate-y-1',
      
      // Style baru untuk ghost (Transparan tapi tactile)
      ghost:
        'bg-transparent text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20',
      
      // Style baru untuk outline (Glassy Border)
      outline:
        'bg-transparent border-2 border-white/20 text-coc-gold hover:border-coc-gold hover:bg-coc-gold/10 hover:text-white shadow-sm active:scale-95',

      // [FIX] Style baru untuk success (Hijau Clash) - Konsisten dengan tema CoC
      success:
        'bg-gradient-to-b from-coc-green to-green-800 text-white border-b-4 border-green-900 hover:from-green-500 hover:to-coc-green shadow-lg active:border-b-0 active:translate-y-1',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-[10px] md:text-xs font-bold',
      md: 'px-5 py-2.5 text-xs md:text-sm font-bold',
      lg: 'px-8 py-3 text-sm md:text-base font-bold',
    };

    // Gabungkan semua kelas yang relevan
    const classes = `${baseClasses} ${
      variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary
    } ${sizeClasses[size]} ${className}`;

    // Render sebagai komponen Link jika ada properti href
    if ('href' in props && props.href) {
      // Destrukturisasi untuk memisahkan href dari sisa properti
      const { href, ...restOfProps } = props;
      return (
        <Link
          href={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...restOfProps}
        >
          {children}
        </Link>
      );
    }

    // Render sebagai tombol biasa jika tidak
    return (
      <button
        className={classes}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...(props as ActionButtonProps)}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';