import React, { ReactNode } from 'react';

interface FormGroupProps {
  children: ReactNode;
  error?: string | null;
  label: string;
  htmlFor: string;
}

/**
 * Komponen UI konsisten untuk grup form (Label + Input + Error)
 * Diekstrak dari PostForm.tsx
 */
const FormGroup: React.FC<FormGroupProps> = ({
  children,
  error,
  label,
  htmlFor,
}) => (
  <div className="space-y-2">
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

export default FormGroup;