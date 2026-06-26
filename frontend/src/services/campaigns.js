import api from './api';
import { mockCampaigns } from '@/utils/mockData';

const DEMO_MODE = true;

export const campaignsService = {
  getAll: async (params = {}) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 350));
      let campaigns = [...mockCampaigns];
      if (params.status) campaigns = campaigns.filter((c) => c.status === params.status);
      return { data: campaigns, total: campaigns.length };
    }
    const res = await api.get('/campaigns', { params });
    return res.data;
  },

  getById: async (id) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 200));
      return mockCampaigns.find((c) => c.id === id) || null;
    }
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  },

  create: async (campaign) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      return { id: `camp_demo_${Date.now()}`, ...campaign, status: 'scheduled' };
    }
    const res = await api.post('/campaigns', campaign);
    return res.data;
  },

  launch: async (id) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1200));
      return { success: true, status: 'active' };
    }
    const res = await api.post(`/campaigns/${id}/launch`);
    return res.data;
  },

  pause: async (id) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, status: 'paused' };
    }
    const res = await api.post(`/campaigns/${id}/pause`);
    return res.data;
  },

  delete: async (id) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      return { success: true };
    }
    const res = await api.delete(`/campaigns/${id}`);
    return res.data;
  },
};
