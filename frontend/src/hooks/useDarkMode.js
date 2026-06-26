import { useEffect } from 'react';
import useUIStore from '@/stores/uiStore';

/**
 * Dark mode hook — syncs theme to <html> class on mount
 * Also respects system preference on first load
 */
export function useDarkMode() {
  const { theme, setTheme, toggleTheme } = useUIStore();

  useEffect(() => {
    // On mount, apply stored theme class
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Detect system preference on first load (if no stored preference)
  useEffect(() => {
    const stored = localStorage.getItem('ai-ops-ui');
    if (!stored) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Default is light per spec — only use system if no stored preference
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
