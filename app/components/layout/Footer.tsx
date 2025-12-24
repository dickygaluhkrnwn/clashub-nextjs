'use client';

import { useLanguage } from '@/lib/hooks/useLanguage';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto pt-12 pb-8 px-4 text-center">
      {/* Divider Halus */}
      <div className="w-full max-w-7xl mx-auto border-t border-white/5 mb-8" />

      <div className="container mx-auto flex flex-col items-center justify-center space-y-4">
        {/* Logo / Brand Name */}
        <p className="font-clash text-2xl text-coc-gold tracking-wide drop-shadow-md">
          CLASHUB
        </p>

        {/* Deskripsi Singkat */}
        <p className="text-sm text-gray-500 font-sans max-w-md leading-relaxed">
          {t.footer.aboutDesc}
        </p>

        {/* Copyright */}
        <p className="text-xs text-gray-600 mt-6 font-mono">
          {t.footer.copyright.replace('2024', currentYear.toString())}
        </p>
      </div>
    </footer>
  );
};

export default Footer;