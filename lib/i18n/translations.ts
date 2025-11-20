import { Language, Translation } from './types';
import { id } from './locales/id';
import { en } from './locales/en';

// Barrel file untuk menyatukan semua locale
export const translations: Record<Language, Translation> = {
  id,
  en,
};