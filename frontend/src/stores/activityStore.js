import { create } from 'zustand';
import { mockActivityFeed } from '@/utils/mockData';

/**
 * Activity Store — live SSE activity feed
 */
const useActivityStore = create((set, get) => ({
  activities: [],
  unreadCount: 0,
  isConnected: false, // SSE connection status

  // Set initial activities loaded from API
  setActivities: (list) => {
    set({
      activities: list,
      unreadCount: list.filter((a) => !a.read).length,
    });
  },

  // Push new activity (called from SSE events)
  push: (event) => {
    let type = event.type;
    let title = event.title || 'Activity Event';
    let description = event.description || '';

    if (event.type === 'new_message') {
      type = 'message_received';
      title = `New message from ${event.leadName || 'Customer'}`;
      description = event.message || '';
    } else if (event.type === 'agent_replied') {
      type = 'message_sent';
      title = `Agent replied to ${event.leadName || 'Customer'}`;
      description = event.reply || '';
    } else if (event.type === 'message_sent') {
      type = 'message_sent';
      if (event.role === 'human') {
        title = `You replied to ${event.leadName || 'Customer'}`;
      } else {
        title = `Agent replied to ${event.leadName || 'Customer'}`;
      }
      description = event.message || '';
    } else if (event.type === 'hot_lead') {
      type = 'hot_lead';
      title = 'Hot Lead Detected';
      description = `Lead scored ${event.score || 0}/4`;
    }

    const activity = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...event,
      rawType: event.type,
      type,
      title,
      description
    };
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 50), // keep last 50
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Mark activity as read
  markRead: (id) => {
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, read: true } : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  // Mark all as read
  markAllRead: () => {
    set((state) => ({
      activities: state.activities.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    }));
  },

  // Clear all
  clear: () => set({ activities: [], unreadCount: 0 }),

  // SSE connection status
  setConnected: (val) => set({ isConnected: val }),

  // Helper: get latest n activities
  getLatest: (n = 10) => get().activities.slice(0, n),
}));

export default useActivityStore;
