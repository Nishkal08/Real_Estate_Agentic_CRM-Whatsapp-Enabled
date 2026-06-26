import { useEffect } from 'react';
import useUIStore from '@/stores/uiStore';

/**
 * Keyboard shortcut hook
 * Binds global hotkeys per spec:
 *   Esc → close active modal/drawer
 *   N   → new campaign
 *   T   → take over conversation
 */
export function useHotkeys(customBindings = {}) {
  const { closeModal, closeDrawer, activeModal, activeDrawer } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when typing in an input/textarea/select
      const tag = e.target.tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (e.target.isContentEditable) return;

      const key = e.key;

      // Escape — close modal or drawer
      if (key === 'Escape') {
        if (activeModal) closeModal();
        else if (activeDrawer) closeDrawer();
        return;
      }

      // Run custom bindings
      if (customBindings[key]) {
        customBindings[key](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, activeDrawer, closeModal, closeDrawer, customBindings]);
}
