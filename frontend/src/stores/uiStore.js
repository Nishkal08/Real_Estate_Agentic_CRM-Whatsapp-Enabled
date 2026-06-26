import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI Store — sidebar, theme, modal state
 */
const useUIStore = create(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarCollapsed: false,

      // Theme — light mode default per spec
      theme: 'light',

      // Global modal/drawer state
      activeModal: null,    // 'new-campaign' | 'upload-leads' | 'upload-kb' | etc.
      activeDrawer: null,   // 'lead-detail' | 'campaign-builder' | etc.
      drawerData: null,     // Data passed to the active drawer

      // Toast queue
      toasts: [],

      // Sidebar toggle
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      // Theme
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },

      // Modals
      openModal: (name, data = null) => set({ activeModal: name, drawerData: data }),
      closeModal: () => set({ activeModal: null }),

      // Drawers
      openDrawer: (name, data = null) => set({ activeDrawer: name, drawerData: data }),
      closeDrawer: () => set({ activeDrawer: null, drawerData: null }),

      // Toast notifications
      addToast: (toast) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newToast = {
          id,
          type: 'success', // success | error | warning | info
          message: '',
          duration: 4000,
          ...toast,
        };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Auto-remove
        if (newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }
        return id;
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      clearToasts: () => set({ toasts: [] }),

      // Convenience toast helpers
      toast: {
        success: (message, opts = {}) =>
          useUIStore.getState().addToast({ type: 'success', message, ...opts }),
        error: (message, opts = {}) =>
          useUIStore.getState().addToast({ type: 'error', message, duration: 6000, ...opts }),
        warning: (message, opts = {}) =>
          useUIStore.getState().addToast({ type: 'warning', message, ...opts }),
        info: (message, opts = {}) =>
          useUIStore.getState().addToast({ type: 'info', message, ...opts }),
      },
    }),
    {
      name: 'ai-ops-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

export default useUIStore;

// Standalone toast helper for use outside components
export const toast = {
  success: (message, opts = {}) =>
    useUIStore.getState().addToast({ type: 'success', message, ...opts }),
  error: (message, opts = {}) =>
    useUIStore.getState().addToast({ type: 'error', message, duration: 6000, ...opts }),
  warning: (message, opts = {}) =>
    useUIStore.getState().addToast({ type: 'warning', message, ...opts }),
  info: (message, opts = {}) =>
    useUIStore.getState().addToast({ type: 'info', message, ...opts }),
};
