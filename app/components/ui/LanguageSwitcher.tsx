'use client';

import { useLanguage } from '@/lib/hooks/useLanguage';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-black/20 backdrop-blur-sm">
      <button
        onClick={() => setLanguage('id')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          language === 'id'
            ? 'bg-yellow-500 text-black shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        ID
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          language === 'en'
            ? 'bg-yellow-500 text-black shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </div>
  );
}