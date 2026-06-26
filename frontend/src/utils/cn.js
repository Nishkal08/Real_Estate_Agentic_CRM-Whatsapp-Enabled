import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind conflict resolution.
 * Usage: cn('text-sm', condition && 'font-bold', 'text-red-500')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
