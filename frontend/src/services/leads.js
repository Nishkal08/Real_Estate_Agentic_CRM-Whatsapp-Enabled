import api from './api';
import { mockLeads, mockConversations } from '@/utils/mockData';

const DEMO_MODE = true;

export const leadsService = {
  getAll: async (params = {}) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      let leads = [...mockLeads];
      if (params.status) leads = leads.filter((l) => l.status === params.status);
      if (params.campaignId) leads = leads.filter((l) => l.campaignId === params.campaignId);
      return { data: leads, total: leads.length };
    }
    const res = await api.get('/leads', { params });
    return res.data;
  },

  getById: async (id) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 200));
      return mockLeads.find((l) => l.id === id) || null;
    }
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  getConversation: async (leadId) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      return mockConversations[leadId] || [];
    }
    const res = await api.get(`/leads/${leadId}/conversation`);
    return res.data;
  },

  importLeads: async (leads, campaignId) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1000));
      return { imported: leads.length, duplicates: 0, invalid: 0 };
    }
    const res = await api.post('/leads/import', { leads, campaignId });
    return res.data;
  },

  updateStatus: async (leadId, status) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true };
    }
    const res = await api.patch(`/leads/${leadId}/status`, { status });
    return res.data;
  },

  takeOver: async (leadId) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      return { success: true, mode: 'human' };
    }
    const res = await api.post(`/leads/${leadId}/takeover`);
    return res.data;
  },

  sendMessage: async (leadId, message) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 500));
      return { sent: true, messageId: `msg_demo_${Date.now()}` };
    }
    const res = await api.post(`/leads/${leadId}/message`, { message });
    return res.data;
  },
};
