import React, { ReactNode } from 'react';

// =========================================================================
// INLINE COMPONENT: FormGroup (untuk standarisasi input, label, dan error)
// =========================================================================

interface FormGroupProps {
  children: ReactNode;
  error?: string | null;
  label: string;
  htmlFor: string;
}

/**
 * Komponen pembungkus untuk setiap field form, menampilkan label dan pesan error.
 */
export const FormGroup: React.FC<FormGroupProps> = ({ children, error, label, htmlFor }) => (
  <div className="space-y-2 mt-6">
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold text-gray-200"
    >
      {label}
    </label>
    {children}
    {error && (
      <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 font-sans">
        {error}
      </p>
    )}
  </div>
);

// --- Style input yang disempurnakan (diambil dari PostForm.tsx) ---
/**
 * Kelas CSS Tailwind yang konsisten untuk semua elemen input/textarea/select.
 * @param hasError - Boolean untuk memicu styling error.
 */
export const getInputClasses = (hasError: boolean) =>
  `w-full bg-coc-stone/50 border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
  font-sans disabled:opacity-50 disabled:cursor-not-allowed
  hover:border-coc-gold/70
  focus:ring-2 focus:ring-coc-gold focus:border-coc-gold focus:outline-none
  ${
    hasError
      ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50' // Error state
      : 'border-coc-gold-dark/50' // Default state
  }`;
// --- End Style input ---

export default FormGroup;