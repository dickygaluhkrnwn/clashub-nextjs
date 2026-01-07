import React, { ReactNode } from 'react';
import { AlertTriangleIcon } from '@/app/components/icons';

// =========================================================================
// INLINE COMPONENT: FormGroup (Standardized Input Wrapper)
// =========================================================================

interface FormGroupProps {
  children: ReactNode;
  error?: string | null;
  label: string;
  htmlFor: string;
  helperText?: ReactNode;
}

/**
 * Komponen pembungkus field form dengan label & error style baru.
 */
export const FormGroup: React.FC<FormGroupProps> = ({ children, error, label, htmlFor, helperText }) => (
  <div className="space-y-2 w-full">
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors group-focus-within:text-coc-gold"
    >
      {label}
    </label>
    <div className="relative group">
       {children}
    </div>
    {helperText && (
      <div className="text-xs text-gray-500 font-sans mt-1 ml-1">
        {helperText}
      </div>
    )}
    {error && (
      <div id={`${htmlFor}-error`} className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 font-sans animate-in fade-in slide-in-from-top-1 bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
        <AlertTriangleIcon className="h-3 w-3 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// --- Glass Input Styles ---
/**
 * Kelas CSS Tailwind untuk input/textarea/select bergaya Glass-Stone.
 */
export const getInputClasses = (hasError: boolean, disabled: boolean = false) =>
  `w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-all duration-300 font-sans
   ${disabled 
      ? 'bg-[#0f1115] border border-white/5 text-gray-500 cursor-not-allowed opacity-70' 
      : 'bg-[#0a0a0b] border border-white/10 hover:border-coc-gold/30 hover:bg-[#0f1115] focus:bg-[#13151b]'
   }
   focus:ring-1 focus:ring-coc-gold/50 focus:border-coc-gold focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.1)]
   ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
  `;

export default FormGroup;