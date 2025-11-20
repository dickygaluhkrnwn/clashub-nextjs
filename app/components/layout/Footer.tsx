'use client';

import { useLanguage } from '@/lib/hooks/useLanguage';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-coc-stone border-t-2 border-coc-gold-dark/30 mt-20">
      <div className="container mx-auto py-8 px-4 text-center text-gray-400">
        {/* Mengganti font-supercell menjadi font-clash */}
        <p className="font-clash text-lg text-coc-gold-dark mb-2">CLASHUB</p>
        <p className="text-sm">
          {t.footer.aboutDesc}
        </p>
        <p className="text-xs mt-4">
          {/* Mengganti tahun '2024' dari kamus dengan tahun dinamis, 
            agar tidak perlu update kamus tiap tahun baru.
          */}
          {t.footer.copyright.replace('2024', currentYear.toString())}
        </p>
      </div>
    </footer>
  );
};

export default Footer;