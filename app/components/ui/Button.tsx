'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

// --- Mendefinisikan tipe properti yang lebih kuat ---

// Properti dasar yang sama untuk semua varian
type BaseButtonProps = {
  // PERBAIKAN: Menambahkan 'tertiary' ke tipe variant
  variant?: 'primary' | 'secondary' | 'link' | 'tertiary'; 
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
>(({ variant = 'primary', size = 'md', children, className = '', ...props }, ref) => {

  // Menambahkan font-clash ke kelas dasar, kecuali untuk varian 'link'
  const baseClasses = `inline-block ${variant !== 'link' ? 'font-clash' : 'font-sans'} rounded-md transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed`;

  // PERBAIKAN: Menambahkan kelas untuk variant 'tertiary'
  const variantClasses = {
    primary: 'btn-3d-gold', // Kelas dari globals.css
    secondary: 'btn-3d-stone', // Kelas dari globals.css
    tertiary: 'btn-3d-silver', // Asumsi: Tambahkan kelas ini di globals.css untuk gaya yang berbeda
    link: 'btn-link font-bold', // Kelas dari globals.css + font-bold
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Gabungkan semua kelas yang relevan
  // Pastikan TypeScript tidak mengeluh dengan menggunakan type assertion karena kita sudah menambahkan 'tertiary'
  const classes = `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size]} ${className}`;

  // Render sebagai komponen Link jika ada properti href
  if ('href' in props && props.href) {
    // Destrukturisasi untuk memisahkan href dari sisa properti
    const { href, ...restOfProps } = props;
    return (
      <Link href={href} className={classes} ref={ref as React.Ref<HTMLAnchorElement>} {...restOfProps}>
        {children}
      </Link>
    );
  }

  // Render sebagai tombol biasa jika tidak
  return (
    <button className={classes} ref={ref as React.Ref<HTMLButtonElement>} {...(props as ActionButtonProps)}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
