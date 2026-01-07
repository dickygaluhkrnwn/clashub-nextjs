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
    const baseClasses = `inline-flex items-center justify-center ${
      variant !== 'link' && variant !== 'ghost' ? 'font-clash' : 'font-sans'
    } rounded-xl transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]`;

    // PERBAIKAN: Menambahkan kelas untuk variant 'danger', 'ghost', 'outline', dan 'success'
    const variantClasses = {
      // Primary (Gold/Yellow - Main Action)
      primary: 
        'bg-gradient-to-b from-coc-gold to-yellow-600 text-black border-b-4 border-yellow-800 hover:brightness-110 shadow-lg active:border-b-0 active:translate-y-1', 
      
      // Secondary (Dark/Stone - Alternative Action)
      secondary: 
        'bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white border-b-4 border-black hover:bg-[#333] shadow-lg active:border-b-0 active:translate-y-1 border border-white/10',
      
      // Tertiary (Silver/Metal - Neutral Action)
      tertiary: 
        'bg-gradient-to-b from-gray-300 to-gray-500 text-gray-900 border-b-4 border-gray-700 hover:brightness-110 shadow-lg active:border-b-0 active:translate-y-1', 
      
      // Link (Text Only)
      link: 
        'bg-transparent text-coc-gold hover:text-white underline-offset-4 hover:underline p-0 h-auto',
      
      // Danger (Red - Destructive Action)
      danger:
        'bg-gradient-to-b from-coc-red to-red-800 text-white border-b-4 border-red-900 hover:from-red-500 hover:to-coc-red shadow-lg active:border-b-0 active:translate-y-1',
      
      // Ghost (Transparent - Subtle Action)
      ghost:
        'bg-transparent text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 border border-transparent',
      
      // Outline (Glassy Border - Secondary Action)
      outline:
        'bg-transparent border-2 border-white/20 text-coc-gold hover:border-coc-gold hover:bg-coc-gold/10 hover:text-white shadow-sm active:scale-95 backdrop-blur-sm',

      // Success (Green - Positive Action)
      success:
        'bg-gradient-to-b from-coc-green to-green-800 text-white border-b-4 border-green-900 hover:from-green-500 hover:to-coc-green shadow-lg active:border-b-0 active:translate-y-1',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-[10px] md:text-xs font-bold min-h-[32px]',
      md: 'px-5 py-2.5 text-xs md:text-sm font-bold min-h-[44px]',
      lg: 'px-8 py-3 text-sm md:text-base font-bold min-h-[52px]',
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