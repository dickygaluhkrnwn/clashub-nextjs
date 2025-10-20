'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

// --- Mendefinisikan tipe properti yang lebih kuat ---

// Properti dasar yang sama untuk semua varian
type BaseButtonProps = {
  variant?: 'primary' | 'secondary' | 'link';
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
  
  // Kumpulan kelas dasar dan varian yang diambil dari globals.css
  const baseClasses = "inline-block font-bold rounded-md transition-all duration-200 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: 'btn-3d-gold',
    secondary: 'btn-3d-stone',
    link: 'btn-link',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Gabungkan semua kelas yang relevan
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

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

