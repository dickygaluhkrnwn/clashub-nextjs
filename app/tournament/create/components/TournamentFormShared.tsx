import React, { ReactNode } from 'react';
import { AlertTriangleIcon } from '@/app/components/icons';

interface FormGroupProps {
  children: ReactNode;
  error?: string | null;
  label: string;
  htmlFor: string;
  helperText?: ReactNode;
}

/**
 * FormGroup khusus Turnamen dengan style Glass-Stone.
 */
export const FormGroup: React.FC<FormGroupProps> = ({ children, error, label, htmlFor, helperText }) => (
  <div className="space-y-1.5 w-full">
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold uppercase tracking-wider text-coc-gold"
    >
      {label}
    </label>
    {children}
    {helperText && (
      <div className="text-xs text-gray-500 font-sans mt-1 leading-relaxed">
        {helperText}
      </div>
    )}
    {error && (
      <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 font-sans animate-in fade-in slide-in-from-top-1">
        <AlertTriangleIcon className="h-3 w-3 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

/**
 * Style input/select/textarea Glass-Stone yang konsisten.
 */
export const getInputClasses = (hasError: boolean, disabled: boolean = false) =>
  `w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all duration-200 font-sans
   ${disabled 
      ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed' 
      : 'bg-black/20 border border-white/10 hover:border-coc-gold/50 focus:bg-black/40'
   }
   focus:ring-2 focus:ring-coc-gold/50 focus:border-coc-gold focus:outline-none
   ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
  `;